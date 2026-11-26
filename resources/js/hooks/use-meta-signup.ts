import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { api } from '@/lib/api';

type Selection = { phone_number_id?: string; waba_id?: string };
type Options = { appId: string; graphVersion?: string; onError: (message: string) => void };
let sdkPromise: Promise<void> | null = null;
function loadSdk(): Promise<void> {
    if ((window as any).FB) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => { sdkPromise = null; reject(new Error('Facebook took too long to load. Please try again.')); }, 15000);
        (window as any).fbAsyncInit = () => { clearTimeout(timer); resolve(); };
        let script = document.getElementById('facebook-jssdk') as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script'); script.id = 'facebook-jssdk'; script.src = 'https://connect.facebook.net/en_US/sdk.js'; script.async = true;
            script.onerror = () => { clearTimeout(timer); sdkPromise = null; script?.remove(); reject(new Error('Could not load Facebook. Check your connection or browser extensions.')); };
            document.body.appendChild(script);
        }
    });
    return sdkPromise;
}

export function useMetaSignup({ appId, graphVersion = 'v22.0', onError }: Options) {
    const [busy, setBusy] = useState(false);
    const selection = useRef<Selection>({});
    const active = useRef(false);
    const callbackRunning = useRef(false);
    const popup = useRef<Window | null>(null);
    const onErrorRef = useRef(onError); onErrorRef.current = onError;
    const finish = () => { active.current = false; callbackRunning.current = false; setBusy(false); };

    useEffect(() => {
        if (appId) loadSdk().then(() => (window as any).FB.init({ appId, cookie: true, xfbml: false, version: graphVersion })).catch(() => {});
    }, [appId, graphVersion]);

    useEffect(() => {
        const message = (event: MessageEvent) => {
            if (!active.current) return;
            if (event.origin === window.location.origin && popup.current && event.source === popup.current) {
                if (event.data?.type === 'WHATSAPP_CONNECTED') { finish(); router.reload(); }
                if (event.data?.type === 'WHATSAPP_CONNECT_ERROR') { finish(); onErrorRef.current(event.data.error ?? 'Facebook signup did not complete.'); }
                return;
            }
            if (!['https://www.facebook.com', 'https://business.facebook.com', 'https://web.facebook.com'].includes(event.origin)) return;
            let data: any;
            try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; }
            if (data?.type !== 'WA_EMBEDDED_SIGNUP') return;
            if (['FINISH', 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'].includes(data.event)) {
                // These IDs are checked again against the server-validated Facebook token.
                selection.current = { phone_number_id: data.data?.phone_number_id, waba_id: data.data?.waba_id ?? data.data?.messaging_account_id };
            } else if (data.event === 'ERROR') {
                onErrorRef.current('Facebook could not finish signup. Check the popup and try again.');
            }
        };
        window.addEventListener('message', message);
        const closed = window.setInterval(() => { if (active.current && popup.current?.closed) { finish(); onErrorRef.current('Facebook signup window closed. If you did not finish, start again.'); } }, 1000);
        return () => { window.removeEventListener('message', message); clearInterval(closed); };
    }, []);

    const launch = async () => {
        if (active.current) return;
        active.current = true; callbackRunning.current = false; selection.current = {}; setBusy(true);
        // Open during the user gesture, allowing the redirect fallback even when the SDK is blocked.
        const fallback = window.open('about:blank', 'WhatsAppSignup', 'width=650,height=750'); popup.current = fallback;
        try {
            const signup = await api('/channels/signup', 'POST', {});
            if (!(window as any).FB) {
                if (fallback) fallback.location.href = signup.url;
                else window.location.assign(signup.url);
                return;
            }
            fallback?.close(); popup.current = null;
            (window as any).FB.init({ appId: signup.app_id, cookie: true, xfbml: false, version: signup.graph_version });
            (window as any).FB.login((response: any) => {
                if (callbackRunning.current) return;
                callbackRunning.current = true;
                const code = response?.authResponse?.code;
                if (!code) { finish(); onErrorRef.current('Facebook signup was cancelled or permission was declined. No number was added.'); return; }
                // Give the FINISH message a short opportunity to arrive if it follows the SDK callback.
                window.setTimeout(() => {
                    api('/channels/quick-connect', 'POST', { code, state: signup.state, ...selection.current })
                        .then(result => {
                            finish();
                            if (result.pending) window.location.assign(result.review_url);
                            else if (result.success && result.channel?.id) router.reload();
                            else onErrorRef.current('No WhatsApp number was added. Please retry Facebook signup.');
                        })
                        .catch(error => { finish(); onErrorRef.current(error.message); });
                }, 250);
            }, { config_id: signup.config_id, response_type: 'code', override_default_response_type: true,
                extras: { featureType: 'whatsapp_business_app_onboarding', setup: {} } });
        } catch (error) { fallback?.close(); popup.current = null; finish(); onErrorRef.current((error as Error).message); }
    };
    return { launch, busy };
}
