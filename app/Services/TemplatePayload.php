<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class TemplatePayload
{
    public function build(array $template, array $values = []): array
    {
        if (($template['status'] ?? '') !== 'APPROVED') {
            throw ValidationException::withMessages(['template' => 'Choose an approved template.']);
        }

        $components = [];
        $rendered = $template['body'] ?? '';
        $body = $this->parameters($rendered, $values['parameters'] ?? [], $rendered);
        if ($body) {
            $components[] = ['type' => 'body', 'parameters' => $body];
        }

        $header = collect($template['components'] ?? [])->firstWhere('type', 'HEADER');
        $format = strtoupper($template['headerFormat'] ?? $header['format'] ?? '');
        if (in_array($format, ['IMAGE', 'VIDEO', 'DOCUMENT'])) {
            $kind = strtolower($format);
            $id = $values['header_media_id'] ?? $template['headerMediaId'] ?? null;
            $url = ! empty($values['header_url']) ? $values['header_url'] : ($template['headerUrl'] ?? null);
            if (! empty($values['header_url']) || ! $id) {
                if (! $url || ! filter_var($url, FILTER_VALIDATE_URL) || ! str_starts_with($url, 'https://')) {
                    throw ValidationException::withMessages(['header_url' => 'Upload media or provide the HTTPS media URL required by this template.']);
                }
                $media = ['link' => $url];
            } else {
                $media = ['id' => $id];
            }
            if ($kind === 'document' && ! empty($values['header_filename'])) {
                $media['filename'] = $values['header_filename'];
            }
            $components[] = ['type' => 'header', 'parameters' => [['type' => $kind, $kind => $media]]];
        } elseif ($header && $format === 'TEXT') {
            $ignored = '';
            $params = $this->parameters($header['text'] ?? '', $values['header_parameters'] ?? [], $ignored, 'header_parameters');
            if ($params) {
                $components[] = ['type' => 'header', 'parameters' => $params];
            }
        }

        $buttons = collect($template['components'] ?? [])->firstWhere('type', 'BUTTONS');
        foreach ($buttons['buttons'] ?? [] as $index => $button) {
            if (($button['type'] ?? '') === 'URL' && str_contains($button['url'] ?? '', '{{')) {
                $suffix = $values['button_parameters'][$index] ?? null;
                if (! is_string($suffix) || trim($suffix) === '') {
                    throw ValidationException::withMessages(['button_parameters' => 'Enter the URL button value.']);
                }
                $components[] = ['type' => 'button', 'sub_type' => 'url', 'index' => (string) $index, 'parameters' => [['type' => 'text', 'text' => $suffix]]];
            }
        }

        return ['template' => ['name' => $template['name'], 'language' => ['code' => $template['language']], ...($components ? ['components' => $components] : [])], 'content' => $rendered];
    }

    private function parameters(string $text, array $values, string &$rendered, string $field = 'parameters'): array
    {
        preg_match_all('/\{\{\s*(\d+|[a-z_][a-z0-9_]*)\s*\}\}/', $text, $matches);
        $indices = array_values(array_unique($matches[1] ?? []));
        if ($indices && ctype_digit(implode('', $indices))) {
            sort($indices, SORT_NUMERIC);
        }
        $params = [];
        $rendered = $text;
        foreach ($indices as $position => $index) {
            $named = ! ctype_digit((string) $index);
            $value = $values[$named ? $position : (int) $index - 1] ?? null;
            if (! is_string($value) || trim($value) === '') {
                throw ValidationException::withMessages([$field => 'Enter a value for template variable '.$index.'.']);
            }
            $params[] = ['type' => 'text', 'text' => $value, ...($named ? ['parameter_name' => $index] : [])];
            $rendered = preg_replace_callback('/\{\{\s*'.preg_quote((string) $index, '/').'\s*\}\}/', fn () => $value, $rendered);
        }

        return $params;
    }
}
