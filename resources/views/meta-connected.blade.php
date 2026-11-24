<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ !empty($error) ? 'Connection Notice' : 'WhatsApp Connected' }} | Sathwara InfoTech</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f8fafc;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
            max-width: 440px;
            width: 100%;
            padding: 28px;
            text-align: center;
        }
        .icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 28px;
        }
        .icon.success { background: #dcfce7; color: #16a34a; }
        .icon.error { background: #fee2e2; color: #dc2626; }
        h1 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        p { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px; }
        .details {
            background: #f1f5f9;
            border-radius: 10px;
            padding: 12px 14px;
            font-size: 12px;
            color: #334155;
            text-align: left;
            margin-bottom: 20px;
            word-break: break-word;
        }
        .btn {
            display: inline-block;
            background: #2563eb;
            color: #ffffff;
            font-weight: 600;
            font-size: 13px;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: background 0.15s ease;
        }
        .btn:hover { background: #1d4ed8; }
        .btn-outline { background: transparent; color: #475569; border: 1px solid #cbd5e1; margin-left: 8px; }
        .btn-outline:hover { background: #f8fafc; }
    </style>
</head>
<body>
    <div class="card">
        @if (!empty($error))
            <div class="icon error">⚠️</div>
            <h1>Connection Incomplete</h1>
            <p>{{ $error }}</p>
            <div class="details">
                <strong>Helpful Tip:</strong> Make sure you have admin rights on the Meta Business Account and selected the WhatsApp Business number during Facebook login.
            </div>
            <div>
                <button class="btn" onclick="window.close()">Close Window</button>
                <a href="/whatsapp/connect" class="btn btn-outline" target="_blank">Open Panel</a>
            </div>
        @else
            <div class="icon success">✓</div>
            <h1>WhatsApp Connected!</h1>
            <p>Your WhatsApp number has been successfully linked to your workspace.</p>
            @if (!empty($channel))
                <div class="details">
                    <div><strong>Channel:</strong> {{ $channel->name }}</div>
                    <div><strong>Number:</strong> {{ $channel->phone_number ?: $channel->phone_number_id }}</div>
                </div>
            @endif
            <div>
                <button class="btn" onclick="window.close()">Back to Dashboard</button>
            </div>
        @endif
    </div>

    <script>
        (function() {
            var isError = {{ !empty($error) ? 'true' : 'false' }};
            var errorMsg = {!! json_encode($error ?? '') !!};
            var channelData = {!! json_encode($channel ?? null) !!};

            if (window.opener && !window.opener.closed) {
                try {
                    if (isError) {
                        window.opener.postMessage({
                            type: 'WHATSAPP_CONNECT_ERROR',
                            error: errorMsg
                        }, window.location.origin);
                    } else {
                        window.opener.postMessage({
                            type: 'WHATSAPP_CONNECTED',
                            channel: channelData
                        }, window.location.origin);
                        setTimeout(function() {
                            window.close();
                        }, 1200);
                    }
                } catch (e) {
                    console.error('postMessage failed:', e);
                }
            }
        })();
    </script>
</body>
</html>
