import { Input } from '@/components/ui/input';

export type TemplateValues = { parameters: string[]; header_url?: string; header_parameters?: string[]; button_parameters?: Record<string, string> };
export type MessageTemplate = {
    body: string;
    headerFormat?: string | null;
    headerMediaId?: string | null;
    headerUrl?: string | null;
    components?: { type: string; format?: string; text?: string; buttons?: { type: string; text: string; url?: string }[] }[];
};

export function templateVariables(text: string) {
    return [...new Set([...text.matchAll(/\{\{\s*(\d+|[a-z_][a-z0-9_]*)\s*\}\}/g)].map(match => match[1]))]
        .sort((a, b) => /^\d+$/.test(a) && /^\d+$/.test(b) ? Number(a) - Number(b) : 0);
}

export function templateMediaFormat(template?: MessageTemplate | null) {
    return (template?.headerFormat ?? template?.components?.find(c => c.type === 'HEADER')?.format ?? '').toUpperCase();
}

export function templateHasVariables(template: MessageTemplate) {
    return templateVariables(template.body).length > 0 || (template.components ?? []).some(component =>
        templateVariables(component.text ?? '').length > 0 || component.buttons?.some(button => button.type === 'URL' && button.url?.includes('{{')),
    );
}

export const templateMediaTypes: Record<string, { accept: string; help: string; maxMb: number }> = {
    IMAGE: { accept: 'image/jpeg,image/png', help: 'JPEG or PNG, up to 5 MB', maxMb: 5 },
    VIDEO: { accept: 'video/mp4,video/3gpp', help: 'MP4 or 3GP, up to 16 MB', maxMb: 16 },
    DOCUMENT: { accept: 'application/pdf', help: 'PDF, up to 100 MB', maxMb: 100 },
};

export function TemplateFields({ template, value, onChange, hideBody = false, mediaFile, onMediaFileChange }: {
    template: MessageTemplate | null;
    value: TemplateValues;
    onChange: (value: TemplateValues) => void;
    hideBody?: boolean;
    mediaFile?: File | null;
    onMediaFileChange?: (file: File | null) => void;
}) {
    if (!template) return null;
    const body = hideBody ? [] : templateVariables(template.body ?? '');
    const header = template.components?.find(c => c.type === 'HEADER');
    const headerVars = templateVariables(header?.text ?? '');
    const format = templateMediaFormat(template);
    const media = templateMediaTypes[format];
    const buttons = template.components?.find(c => c.type === 'BUTTONS')?.buttons ?? [];
    const field = (token: string, position: number, group: 'parameters' | 'header_parameters') => {
        const index = /^\d+$/.test(token) ? Number(token) - 1 : position;
        return <label key={group+token} className="block text-xs">{group === 'parameters' ? 'Body' : 'Header'} variable {'{{'+token+'}}'}<Input required value={value[group]?.[index] ?? ''} onChange={event => { const next = [...(value[group] ?? [])]; next[index] = event.target.value; onChange({ ...value, [group]: next }); }} /></label>;
    };
    return <div className="space-y-3">
        {(body.length > 0 || headerVars.length > 0 || buttons.some(b => b.type === 'URL' && b.url?.includes('{{'))) && <p className="text-xs font-semibold">Template Dynamic Values</p>}
        {body.map((t, i) => field(t, i, 'parameters'))}
        {headerVars.map((t, i) => field(t, i, 'header_parameters'))}
        {media && <div className="space-y-2 rounded-xl border p-3">
            <p className="text-xs font-semibold">Attach Media — {format.toLowerCase()}</p>
            {onMediaFileChange && <label className="block text-xs">Upload {format.toLowerCase()}
                <Input key={`${format}-${mediaFile?.name ?? 'empty'}`} type="file" accept={media.accept} onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && (file.size > media.maxMb * 1024 * 1024 || !media.accept.split(',').includes(file.type))) {
                        e.target.setCustomValidity(`Choose ${media.help}.`);
                        e.target.reportValidity();
                        e.target.value = '';
                        onMediaFileChange(null);
                        return;
                    }
                    e.target.setCustomValidity('');
                    onMediaFileChange(file);
                    if (file) onChange({ ...value, header_url: '' });
                }} />
                <span className="text-muted-foreground">{media.help}</span>
            </label>}
            {mediaFile && <div className="flex items-center justify-between gap-2 text-xs"><span>{mediaFile.name}</span><button type="button" className="text-primary underline" onClick={() => onMediaFileChange?.(null)}>Remove attachment</button></div>}
            <label className="block text-xs">{onMediaFileChange ? 'Or enter an HTTPS media URL' : `${format.toLowerCase()} URL`}<Input type="url" placeholder="https://…" disabled={!!mediaFile} required={!mediaFile && !template.headerMediaId && !template.headerUrl} value={value.header_url ?? ''} onChange={e => onChange({ ...value, header_url: e.target.value })} /></label>
            {(template.headerMediaId || template.headerUrl) && !mediaFile && !value.header_url && <p className="text-xs text-muted-foreground">The saved template media will be used unless you attach a replacement.</p>}
        </div>}
        {buttons.map((b, i) => b.type === 'URL' && b.url?.includes('{{') ? <label className="block text-xs" key={i}>{b.text} URL value<Input required value={value.button_parameters?.[i] ?? ''} onChange={e => onChange({ ...value, button_parameters: { ...value.button_parameters, [i]: e.target.value } })} /></label> : null)}
    </div>;
}
