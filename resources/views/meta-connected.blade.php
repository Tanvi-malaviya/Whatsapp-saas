<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>WhatsApp Connected • Sathwara SaaS</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; text-align: center; }
        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; width: 90%; }
        .icon { width: 48px; height: 48px; background: #ecfdf5; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 0.6rem 1.2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1rem; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h2 style="margin: 0 0 0.5rem; font-size: 1.25rem;">WhatsApp Connected!</h2>
        <p style="margin: 0; color: #64748b; font-size: 0.875rem;">Your WhatsApp Business number is now active in your workspace. Closing window...</p>
        <a href="/whatsapp/connect" class="btn">Return to Workspace</a>
    </div>
    <script>
        if (window.opener) {
            window.opener.postMessage({ type: 'WHATSAPP_CONNECTED' }, '*');
            setTimeout(function() { window.close(); }, 1200);
        } else {
            window.location.replace('/whatsapp/connect');
        }
    </script>
</body>
</html>
