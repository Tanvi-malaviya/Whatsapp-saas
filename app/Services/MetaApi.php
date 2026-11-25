<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class MetaApi
{
    public static function setting(string $key): ?string
    {
        $val = PlatformSetting::read('meta_'.$key, config('release.meta.'.$key));
        if (! $val && $key === 'app_secret') {
            $val = env('META_APP_SECRET', '02d9ac2a37b98b8b29a189f835c13027');
        }
        if (! $val && $key === 'app_id') {
            $val = env('META_APP_ID', '1079349601748656');
        }
        if (! $val && $key === 'config_id') {
            $val = env('META_CONFIG_ID', '1835889181059188');
        }
        return $val;
    }

    public static function base(): string { return 'https://graph.facebook.com/'.config('release.meta.graph_version'); }

    public function phone(string $id, string $token): array
    {
        $response = Http::withToken($token)->timeout(15)->get(self::base().'/'.$id, ['fields' => 'id,display_phone_number,verified_name,quality_rating']);
        if (! $response->successful() || ! $response->json('id')) {
            throw ValidationException::withMessages(['access_token' => 'Meta could not verify this number and token. Check the credentials and permissions.']);
        }
        return $response->json();
    }

    public function send(WhatsAppChannel $channel, array $payload): string
    {
        abort_unless($channel->status === 'connected' && $channel->access_token, 422, 'Connect this WhatsApp number before sending.');
        $response = Http::withToken($channel->access_token)->timeout(25)->post(self::base().'/'.$channel->phone_number_id.'/messages', ['messaging_product' => 'whatsapp', ...$payload]);
        if (! $response->successful() || ! $response->json('messages.0.id')) {
            throw ValidationException::withMessages(['message' => $response->json('error.message') ?? 'Meta did not accept the message.']);
        }
        return $response->json('messages.0.id');
    }

    public function numbers(string $waba, string $token): array
    {
        $all = []; $after = null;
        do {
            $response = Http::withToken($token)->timeout(15)->get(self::base().'/'.$waba.'/phone_numbers', array_filter(['limit' => 100, 'after' => $after]));
            $response->throw();
            $all = array_merge($all, $response->json('data', []));
            $after = $response->json('paging.next') ? $response->json('paging.cursors.after') : null;
        } while ($after);
        return $all;
    }
}
