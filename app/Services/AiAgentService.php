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
        $token = $apiKey ?: $this->defaultKey();

        if (! $token) {
            throw ValidationException::withMessages([
                'ai' => 'Please provide your ' . ($provider === 'anthropic' ? 'Anthropic Claude' : 'OpenAI') . ' API Key in AI Agent settings.',
            ]);
        }

        if ($provider === 'anthropic') {
            return $this->requestAnthropic($model, $input, $instructions, $temperature, $token);
        }

        return $this->requestOpenAi($model, $input, $instructions, $temperature, $token);
    }

    private function requestOpenAi(string $model, array $input, string $instructions, float $temperature, string $token): string
    {
        $messages = [['role' => 'system', 'content' => $instructions]];
        foreach ($input as $msg) {
            $messages[] = [
                'role' => $msg['role'] ?? 'user',
                'content' => is_string($msg['content'] ?? '') ? $msg['content'] : json_encode($msg['content']),
            ];
        }

        $response = Http::withToken($token)->timeout(45)->post('https://api.openai.com/v1/chat/completions', [
            'model' => $model ?: 'gpt-4o-mini',
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => 1200,
        ]);

        if (! $response->successful()) {
            $err = $response->json('error.message') ?? 'OpenAI service error';
            throw ValidationException::withMessages(['ai' => 'OpenAI Error: ' . $err]);
        }

        $reply = $response->json('choices.0.message.content');
        if (! trim((string) $reply)) {
            throw ValidationException::withMessages(['ai' => 'OpenAI returned an empty response.']);
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

    public function answer(Organization $org, string $question, array $history = []): string
    {
        $settings = $org->metadata['ai_agent'] ?? [];
        $provider = $settings['provider'] ?? 'openai';
        $customerKey = $settings['api_key'] ?? null;
        $model = $settings['model'] ?? ($provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini');

        $words = preg_split('/\W+/u', mb_strtolower($question), -1, PREG_SPLIT_NO_EMPTY);
        $documents = KnowledgeDocument::where('organization_id', $org->id)->get()->map(function ($doc) use ($words) {
            $chunks = mb_str_split($doc->content, 3000);
            return collect($chunks)->map(fn ($chunk) => [
                'text' => $doc->name . ":\n" . $chunk,
                'score' => collect($words)->sum(fn ($w) => mb_strlen($w) > 2 ? substr_count(mb_strtolower($chunk), $w) : 0),
            ])->all();
        })->flatten(1)->sortByDesc('score')->take(6)->pluck('text')->implode("\n\n");

        $instructions = ($settings['system_prompt'] ?? 'Help customers using the business knowledge provided.')
            . "\nRespond in " . ($settings['language'] ?? 'the customer’s language')
            . ". Never invent prices, policies or facts. If information is missing, say so politely and offer human support.\nBusiness: "
            . $org->name . "\nReference documents:\n" . $documents;

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
