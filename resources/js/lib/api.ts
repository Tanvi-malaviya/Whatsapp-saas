export async function api<T = any>(url: string, method = 'GET', body?: unknown): Promise<T> {
    const multipart = body instanceof FormData;
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
            ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        const errors = Object.values(result.errors ?? {}).flat();
        throw new Error(String(errors[0] ?? result.message ?? `Request failed (${response.status}).`));
    }
    return result;
}
