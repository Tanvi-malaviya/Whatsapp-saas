<?php

namespace App\Services;

use App\Models\KnowledgeDocument;
use App\Models\PlatformSetting;
use App\Modules\Foundation\Models\Organization;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AiAgentService
{
    public function defaultKey(): ?string
    {
        return PlatformSetting::read('openai_api_key', config('release.ai.api_key'));
    }

    public function request(
        string $model,
        array $input,
        string $instructions,
        float $temperature = 0.4,
        string $provider = 'openai',
        ?string $apiKey = null
    ): string {
        $token = $apiKey ?: ($provider === 'openai' ? $this->defaultKey() : null);

        $providerLabel = match ($provider) {
            'anthropic' => 'Anthropic Claude',
            'gemini' => 'Google Gemini',
            'groq' => 'Groq',
            default => 'OpenAI',
        };

        if (! $token) {
            throw ValidationException::withMessages([
                'ai' => "Please enter your {$providerLabel} API Key in WhatsApp AI Agent settings.",
            ]);
        }

        return match ($provider) {
            'anthropic' => $this->requestAnthropic($model, $input, $instructions, $temperature, $token),
            'gemini' => $this->requestGemini($model, $input, $instructions, $temperature, $token),
            'groq' => $this->requestOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', 'Groq', $model ?: 'llama-3.3-70b-versatile', $input, $instructions, $temperature, $token),
            default => $this->requestOpenAiCompatible('https://api.openai.com/v1/chat/completions', 'OpenAI', $model ?: 'gpt-4o-mini', $input, $instructions, $temperature, $token),
        };
    }

    private function requestOpenAiCompatible(
        string $endpoint,
        string $label,
        string $model,
        array $input,
        string $instructions,
        float $temperature,
        string $token
    ): string {
        $messages = [['role' => 'system', 'content' => $instructions]];
        foreach ($input as $msg) {
            $messages[] = [
                'role' => $msg['role'] ?? 'user',
                'content' => is_string($msg['content'] ?? '') ? $msg['content'] : json_encode($msg['content']),
            ];
        }

        $response = Http::withToken($token)->timeout(45)->post($endpoint, [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => 1200,
        ]);

        if (! $response->successful()) {
            $err = $response->json('error.message') ?? "{$label} service error";
            throw ValidationException::withMessages(['ai' => "{$label} Error: " . $err]);
        }

        $reply = $response->json('choices.0.message.content');
        if (! trim((string) $reply)) {
            throw ValidationException::withMessages(['ai' => "{$label} returned an empty response."]);
        }

        return trim($reply);
    }

    private function requestAnthropic(string $model, array $input, string $instructions, float $temperature, string $token): string
    {
        $messages = [];
        foreach ($input as $msg) {
            $messages[] = [
                'role' => in_array($msg['role'] ?? '', ['assistant', 'ai']) ? 'assistant' : 'user',
                'content' => is_string($msg['content'] ?? '') ? $msg['content'] : json_encode($msg['content']),
            ];
        }

        $response = Http::withHeaders([
            'x-api-key' => $token,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])->timeout(45)->post('https://api.anthropic.com/v1/messages', [
            'model' => $model ?: 'claude-3-5-sonnet-20241022',
            'system' => $instructions,
            'messages' => $messages,
            'max_tokens' => 1200,
            'temperature' => $temperature,
        ]);

        if (! $response->successful()) {
            $err = $response->json('error.message') ?? 'Anthropic Claude service error';
            throw ValidationException::withMessages(['ai' => 'Claude Error: ' . $err]);
        }

        $reply = $response->json('content.0.text');
        if (! trim((string) $reply)) {
            throw ValidationException::withMessages(['ai' => 'Claude returned an empty response.']);
        }

        return trim($reply);
    }

    private function requestGemini(string $model, array $input, string $instructions, float $temperature, string $token): string
    {
        $modelId = $model ?: 'gemini-2.5-flash';
        $contents = [];
        foreach ($input as $msg) {
            $role = in_array($msg['role'] ?? '', ['assistant', 'ai', 'model']) ? 'model' : 'user';
            $text = is_string($msg['content'] ?? '') ? $msg['content'] : json_encode($msg['content']);
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => $text]],
            ];
        }

        $response = Http::timeout(45)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key=" . urlencode($token),
            [
                'systemInstruction' => [
                    'parts' => [['text' => $instructions]],
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => $temperature,
                    'maxOutputTokens' => 1200,
                ],
            ]
        );

        if (! $response->successful()) {
            $err = $response->json('error.message') ?? 'Google Gemini service error';
            throw ValidationException::withMessages(['ai' => 'Gemini Error: ' . $err]);
        }

        $reply = $response->json('candidates.0.content.parts.0.text');
        if (! trim((string) $reply)) {
            throw ValidationException::withMessages(['ai' => 'Gemini returned an empty response.']);
        }

        return trim($reply);
    }

    /**
     * Extract text from an uploaded PDF via the configured AI provider when pdftotext is unavailable.
     */
    public function extractPdfText(string $mimeType, string $base64Content, string $provider = 'openai', ?string $apiKey = null, ?string $model = null): string
    {
        $token = $apiKey ?: ($provider === 'openai' ? $this->defaultKey() : null);
        if (! $token) {
            throw ValidationException::withMessages([
                'files' => 'Please save your AI API Key (OpenAI, Claude, or Gemini) first so PDF documents can be indexed.',
            ]);
        }

        if ($provider === 'anthropic') {
            $response = Http::withHeaders([
                'x-api-key' => $token,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->timeout(60)->post('https://api.anthropic.com/v1/messages', [
                'model' => $model ?: 'claude-3-5-sonnet-20241022',
                'max_tokens' => 4096,
                'messages' => [[
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'document',
                            'source' => [
                                'type' => 'base64',
                                'media_type' => $mimeType,
                                'data' => $base64Content,
                            ],
                        ],
                        ['type' => 'text', 'text' => 'Extract all text content from this document faithfully as plain text.'],
                    ],
                ]],
            ]);
            if (! $response->successful()) {
                throw ValidationException::withMessages(['files' => 'Claude PDF extraction failed: ' . ($response->json('error.message') ?? 'Unknown error')]);
            }
            return trim((string) $response->json('content.0.text'));
        }

        if ($provider === 'gemini') {
            $modelId = $model ?: 'gemini-2.5-flash';
            $response = Http::timeout(60)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key=" . urlencode($token),
                [
                    'contents' => [[
                        'role' => 'user',
                        'parts' => [
                            ['inlineData' => ['mimeType' => $mimeType, 'data' => $base64Content]],
                            ['text' => 'Extract all text content from this document faithfully as plain text.'],
                        ],
                    ]],
                ]
            );
            if (! $response->successful()) {
                throw ValidationException::withMessages(['files' => 'Gemini PDF extraction failed: ' . ($response->json('error.message') ?? 'Unknown error')]);
            }
            return trim((string) $response->json('candidates.0.content.parts.0.text'));
        }

        // OpenAI chat/responses fallback
        $response = Http::withToken($token)->timeout(60)->post('https://api.openai.com/v1/responses', [
            'model' => $model ?: 'gpt-4o-mini',
            'input' => [[
                'role' => 'user',
                'content' => [
                    ['type' => 'input_text', 'text' => 'Extract all text content from this document faithfully as plain text.'],
                    ['type' => 'input_file', 'filename' => 'document.pdf', 'file_data' => "data:{$mimeType};base64,{$base64Content}"],
                ],
            ]],
        ]);
        if (! $response->successful()) {
            throw ValidationException::withMessages(['files' => 'OpenAI PDF extraction failed: ' . ($response->json('error.message') ?? 'Unknown error')]);
        }

        return trim((string) ($response->json('output.0.content.0.text') ?? $response->json('output_text') ?? ''));
    }

    public function answer(Organization $org, string $question, array $history = []): string
    {
        $settings = $org->metadata['ai_agent'] ?? [];
        $provider = $settings['provider'] ?? 'openai';
        $customerKey = $settings['api_key'] ?? null;
        $model = $settings['model'] ?? match ($provider) {
            'anthropic' => 'claude-3-5-sonnet-20241022',
            'gemini' => 'gemini-2.5-flash',
            'groq' => 'llama-3.3-70b-versatile',
            default => 'gpt-4o-mini',
        };

        $words = preg_split('/\W+/u', mb_strtolower($question), -1, PREG_SPLIT_NO_EMPTY);
        $documents = KnowledgeDocument::where('organization_id', $org->id)->get()->map(function ($doc) use ($words) {
            $chunks = mb_str_split($doc->content, 3000);
            return collect($chunks)->map(fn ($chunk, $idx) => [
                'text' => $doc->name . " (Part " . ($idx + 1) . "):\n" . $chunk,
                'score' => collect($words)->sum(fn ($w) => mb_strlen($w) > 2 ? substr_count(mb_strtolower($chunk), $w) : 0) + ($idx === 0 ? 0.1 : 0),
            ])->all();
        })->flatten(1)->sortByDesc('score')->take(6)->pluck('text')->implode("\n\n");

        $instructions = ($settings['system_prompt'] ?? 'Help customers using the business knowledge provided.')
            . "\n\nSTRICT KNOWLEDGE & OUT-OF-BOUNDS RULES:"
            . "\n1. Respond in " . ($settings['language'] ?? 'the customer’s language') . "."
            . "\n2. Search the Reference Documents below first. If the customer's question is covered in the documents, answer accurately and clearly from them."
            . "\n3. If the question is OUT OF BOUNDS or the answer is NOT in the Reference Documents, do NOT invent prices, policies, or facts—politely state that you don't have that specific detail in the company documents and offer to connect them with a human team member."
            . "\n\nBusiness Name: " . $org->name
            . "\n\nReference Documents:\n" . ($documents ?: 'No documents uploaded yet.');

        $input = collect(array_slice($history, -8))->map(fn ($m) => [
            'role' => ($m['sender'] ?? '') === 'ai' ? 'assistant' : 'user',
            'content' => mb_substr($m['text'] ?? '', 0, 3000),
        ])->all();
        $input[] = ['role' => 'user', 'content' => $question];

        return $this->request(
            $model,
            $input,
            $instructions,
            (float) ($settings['temperature'] ?? 0.4),
            $provider,
            $customerKey
        );
    }
}
