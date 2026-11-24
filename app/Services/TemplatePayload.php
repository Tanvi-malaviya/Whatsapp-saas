<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class TemplatePayload
{
    public function build(array $template, array $values = []): array
    {
        if (($template['status'] ?? '') !== 'APPROVED') { throw ValidationException::withMessages(['template' => 'Choose an approved template.']); }
        $components = []; $rendered = $template['body'] ?? '';
        $body = $this->parameters($rendered, $values['parameters'] ?? [], $rendered);
        if ($body) { $components[] = ['type' => 'body', 'parameters' => $body]; }
        $header = collect($template['components'] ?? [])->firstWhere('type', 'HEADER');
        $format = strtoupper($template['headerFormat'] ?? $header['format'] ?? '');
        if (in_array($format, ['IMAGE','VIDEO','DOCUMENT'])) {
            $kind = strtolower($format); $id = $template['headerMediaId'] ?? null;
            $url = $values['header_url'] ?? $template['headerUrl'] ?? null;
            if (! $id && (! $url || ! filter_var($url, FILTER_VALIDATE_URL) || ! str_starts_with($url, 'https://'))) { throw ValidationException::withMessages(['header_url' => 'Provide the HTTPS media URL required by this template.']); }
            $components[] = ['type' => 'header', 'parameters' => [['type' => $kind, $kind => $id && empty($values['header_url']) ? ['id' => $id] : ['link' => $url]]]];
        } elseif ($header && $format === 'TEXT') {
            $ignored = ''; $params = $this->parameters($header['text'] ?? '', $values['header_parameters'] ?? [], $ignored);
            if ($params) { $components[] = ['type' => 'header', 'parameters' => $params]; }
        }
        $buttons = collect($template['components'] ?? [])->firstWhere('type', 'BUTTONS');
        foreach ($buttons['buttons'] ?? [] as $index => $button) {
            if (($button['type'] ?? '') === 'URL' && str_contains($button['url'] ?? '', '{{')) {
                $suffix = $values['button_parameters'][$index] ?? null;
                if (! is_string($suffix) || $suffix === '') { throw ValidationException::withMessages(['button_parameters' => 'Enter the URL button value.']); }
                $components[] = ['type' => 'button', 'sub_type' => 'url', 'index' => (string) $index, 'parameters' => [['type' => 'text', 'text' => $suffix]]];
            }
        }
        return ['template' => ['name' => $template['name'], 'language' => ['code' => $template['language']], ...($components ? ['components' => $components] : [])], 'content' => $rendered];
    }
    private function parameters(string $text, array $values, string &$rendered): array
    {
        preg_match_all('/\{\{(\d+)\}\}/', $text, $matches); $indices = array_unique($matches[1] ?? []); sort($indices, SORT_NUMERIC);
        $params = []; $rendered = $text;
        foreach ($indices as $index) {
            $value = $values[(int) $index - 1] ?? null;
            if (! is_string($value) || trim($value) === '') { throw ValidationException::withMessages(['parameters' => 'Enter a value for template variable '.$index.'.']); }
            $params[] = ['type' => 'text', 'text' => $value]; $rendered = str_replace('{{'.$index.'}}', $value, $rendered);
        }
        return $params;
    }
}
