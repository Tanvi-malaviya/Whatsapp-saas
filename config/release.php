<?php

return [
    'meta' => [
        'app_id' => env('META_APP_ID'),
        'app_secret' => env('META_APP_SECRET'),
        'config_id' => env('META_CONFIG_ID'),
        'verify_token' => env('META_VERIFY_TOKEN'),
        'graph_version' => env('META_GRAPH_VERSION', 'v22.0'),
    ],
    'ai' => ['api_key' => env('OPENAI_API_KEY'), 'model' => env('OPENAI_MODEL', 'gpt-4o-mini')],
    'razorpay' => [
        'key_id' => env('RAZORPAY_KEY_ID'),
        'key_secret' => env('RAZORPAY_KEY_SECRET'),
        'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET'),
    ],
    'plans' => [
        'annual' => [
            'name' => 'Annual Business Plan',
            'period' => 'year',
            'validity_days' => 365,
            'amount_paise' => 999900,
            'messages' => 'Pay as you go',
            'channels' => 1,
            'seats' => 10,
            'welcome_bonus_paise' => 50000,
            'features' => [
                '1 WhatsApp Business Number',
                'Official Meta Cloud API & Coexistence',
                'AI Chatbot & Knowledge Base',
                'Automatic Customer Data Storage',
                'Broadcast Campaigns (up to 2,000 contacts/campaign)',
                '₹500 Welcome Bonus Credit',
                'Referral Program (₹500 reward per conversion)',
                'Real-time Campaign Analytics & Delivery Reports',
                'Setup Guidance & Customer Support',
            ],
        ],
        'starter' => ['name' => 'Starter', 'amount_paise' => 99900, 'messages' => 5000, 'seats' => 2],
        'growth' => ['name' => 'Growth', 'amount_paise' => 249900, 'messages' => 25000, 'seats' => 10],
        'business_pro' => ['name' => 'Business Pro', 'amount_paise' => 499900, 'messages' => 100000, 'seats' => 50],
        'enterprise' => ['name' => 'Enterprise', 'amount_paise' => null, 'messages' => 1000000, 'seats' => 999],
    ],
];
