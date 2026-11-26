<?php

namespace Tests\Unit;

use App\Services\TemplatePayload;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class TemplatePayloadTest extends TestCase
{
    private function template(array $overrides = []): array
    {
        return array_replace(['name' => 'offer', 'language' => 'en_US', 'status' => 'APPROVED', 'body' => 'Hello {{1}}'], $overrides);
    }

    public function test_named_values_include_parameter_names_and_replace_repeated_tokens(): void
    {
        $payload = (new TemplatePayload)->build($this->template([
            'body' => 'Hello {{ customer_name }}, {{offer}} for {{customer_name}}',
            'components' => [['type' => 'HEADER', 'format' => 'TEXT', 'text' => 'From {{sender}}']],
        ]), ['parameters' => ['Alice', 'SAVE20'], 'header_parameters' => ['Store']]);
        $this->assertEquals('Hello Alice, SAVE20 for Alice', $payload['content']);
        $this->assertEquals('customer_name', $payload['template']['components'][0]['parameters'][0]['parameter_name']);
        $this->assertEquals('sender', $payload['template']['components'][1]['parameters'][0]['parameter_name']);
    }

    public function test_numeric_values_follow_position_and_repeated_tokens_need_one_value(): void
    {
        $payload = (new TemplatePayload)->build($this->template(['body' => '{{2}} for {{1}} and {{1}}']), ['parameters' => ['Alice', 'SAVE20']]);
        $this->assertEquals('SAVE20 for Alice and Alice', $payload['content']);
        $this->assertEquals([['type' => 'text', 'text' => 'Alice'], ['type' => 'text', 'text' => 'SAVE20']], $payload['template']['components'][0]['parameters']);
    }

    public function test_saved_media_is_used_when_url_input_is_empty(): void
    {
        $payload = (new TemplatePayload)->build($this->template(['body' => '', 'headerFormat' => 'VIDEO', 'headerUrl' => 'https://example.com/video.mp4']), ['header_url' => '']);
        $this->assertEquals(['link' => 'https://example.com/video.mp4'], $payload['template']['components'][0]['parameters'][0]['video']);
    }

    public function test_invalid_override_url_is_rejected_even_when_saved_media_exists(): void
    {
        $this->expectException(ValidationException::class);
        (new TemplatePayload)->build($this->template(['body' => '', 'headerFormat' => 'IMAGE', 'headerMediaId' => 'saved']), ['header_url' => 'http://example.com/image.jpg']);
    }
}
