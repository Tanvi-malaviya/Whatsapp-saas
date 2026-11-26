<?php

namespace App\Modules\Bot\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeDocument;
use App\Modules\Bot\Models\BotRule;
use App\Services\AiAgentService;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AutomationController extends Controller
{
    public function responder()
    {
        $org = TenantContext::get();
        return Inertia::render('bot/auto-responder', ['settings' => $org->metadata['auto_responder'] ?? [], 'initialRules' => BotRule::where('organization_id', $org->id)->orderBy('priority')->get()->map(fn ($r) => ['id' => $r->id, 'keyword' => $r->keywords, 'matchType' => $r->match_type, 'reply' => $r->reply_text, 'enabled' => $r->is_enabled])]);
    }
    public function saveResponder(Request $request)
    {
        $data = $request->validate([
            'welcome_enabled' => 'required|boolean', 'welcome_message' => 'nullable|string|max:4000',
            'away_enabled' => 'required|boolean', 'away_message' => 'nullable|string|max:4000',
            'opens_at' => 'required|date_format:H:i', 'closes_at' => 'required|date_format:H:i|after:opens_at',
            'business_days' => 'required|array|min:1', 'business_days.*' => 'integer|between:1,7',
            'rules' => 'required|array|max:100', 'rules.*.keyword' => 'required|string|max:500',
            'rules.*.matchType' => 'required|in:exact,contains,starts_with', 'rules.*.reply' => 'required|string|max:4000', 'rules.*.enabled' => 'required|boolean',
        ]);
        DB::transaction(function () use ($data) {
            $org = TenantContext::get()->newQuery()->whereKey(TenantContext::id())->lockForUpdate()->firstOrFail();
            $rules = $data['rules']; unset($data['rules']); $meta = $org->metadata ?? []; $meta['auto_responder'] = $data; $org->update(['metadata' => $meta]);
            BotRule::where('organization_id', $org->id)->delete();
            foreach ($rules as $i => $rule) { BotRule::create(['organization_id' => $org->id, 'keywords' => $rule['keyword'], 'match_type' => $rule['matchType'], 'reply_text' => $rule['reply'], 'is_enabled' => $rule['enabled'], 'priority' => $i]); }
        });
        return response()->json(['success' => true]);
    }
    public function agent()
    {
        return Inertia::render('bot/ai-agent', [
            'settings' => TenantContext::get()->metadata['ai_agent'] ?? [],
            'providerReady' => (bool) app(AiAgentService::class)->defaultKey(),
            'initialDocs' => $this->documents(),
        ]);
    }
    private function documents()
    {
        return KnowledgeDocument::where('organization_id', TenantContext::id())->latest()->get()->map(fn ($d) => ['id' => $d->id, 'name' => $d->name, 'size' => round($d->size / 1024).' KB', 'status' => 'Indexed']);
    }
    public function saveAgent(Request $request)
    {
        $data = $request->validate([
            'enabled' => 'required|boolean',
            'provider' => 'nullable|string|in:openai,anthropic,gemini,groq',
            'api_key' => 'nullable|string|max:1000',
            'model' => 'required|string|max:100',
            'language' => 'required|in:multilingual,en,gu,hi',
            'system_prompt' => 'required|string|max:12000',
            'temperature' => 'required|numeric|between:0,2'
        ]);

        $org = TenantContext::get();
        $meta = $org->metadata ?? [];
        $meta['ai_agent'] = $data;
        $org->update(['metadata' => $meta]);
        return response()->json(['success' => true]);
    }
    public function upload(Request $request, AiAgentService $ai)
    {
        $data = $request->validate(['files' => 'required|array|max:5', 'files.*' => 'required|file|mimes:txt,md,csv,json,pdf,doc,docx|max:4096']);
        abort_if(KnowledgeDocument::where('organization_id', TenantContext::id())->count() + count($data['files']) > 30, 422, 'A workspace can store up to 30 knowledge documents.');

        $org = TenantContext::get();
        $settings = $org->metadata['ai_agent'] ?? [];
        $provider = $settings['provider'] ?? 'openai';
        $apiKey = $settings['api_key'] ?? null;
        $model = $settings['model'] ?? null;

        foreach ($data['files'] as $file) {
            $ext = strtolower($file->getClientOriginalExtension());
            $text = '';
            if (in_array($ext, ['txt', 'md', 'csv', 'json'])) {
                $text = $file->getContent();
            } elseif ($ext === 'docx' && class_exists(\ZipArchive::class)) {
                $zip = new \ZipArchive();
                if ($zip->open($file->getRealPath()) === true) {
                    $xml = $zip->getFromName('word/document.xml');
                    $zip->close();
                    if ($xml) {
                        $text = trim(preg_replace('/\s+/', ' ', strip_tags(str_replace('<', ' <', $xml))));
                    }
                }
            } else {
                $text = $ai->extractPdfText(
                    $file->getMimeType() ?: 'application/pdf',
                    base64_encode($file->getContent()),
                    $provider,
                    $apiKey,
                    $model
                );
            }
            abort_unless(trim($text) !== '', 422, 'The document contains no readable text.');
            KnowledgeDocument::create(['organization_id' => TenantContext::id(), 'name' => basename($file->getClientOriginalName()), 'size' => $file->getSize(), 'content' => mb_substr($text, 0, 200000)]);
        }
        return response()->json(['success' => true, 'docs' => $this->documents()]);
    }
    public function deleteDocument(string $id)
    {
        KnowledgeDocument::findOrFail($id)->delete(); return response()->json(['success' => true]);
    }
    public function test(Request $request, AiAgentService $ai)
    {
        $data = $request->validate(['question' => 'required|string|max:4000', 'history' => 'nullable|array|max:8', 'history.*.sender' => 'required|in:user,ai', 'history.*.text' => 'required|string|max:4000']);
        return response()->json(['success' => true, 'reply' => $ai->answer(TenantContext::get(), $data['question'], $data['history'] ?? [])]);
    }
}
