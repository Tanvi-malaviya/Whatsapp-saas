import { Input } from '@/components/ui/input';
export type TemplateValues = { parameters: string[]; header_url?: string; header_parameters?: string[]; button_parameters?: Record<string, string> };
export function TemplateFields({ template, value, onChange, hideBody = false }: { template: any; value: TemplateValues; onChange: (value: TemplateValues) => void; hideBody?: boolean }) {
    if (!template) return null;
    const body = hideBody ? [] : [...new Set<string>((template.body ?? '').match(/\{\{\d+\}\}/g) ?? [])];
    const header = template.components?.find((c: any) => c.type === 'HEADER');
    const headerVars = [...new Set<string>((header?.text ?? '').match(/\{\{\d+\}\}/g) ?? [])];
    const format = template.headerFormat ?? header?.format;
    const buttons = template.components?.find((c: any) => c.type === 'BUTTONS')?.buttons ?? [];
    const field = (token: string, group: 'parameters' | 'header_parameters') => {
        const index = Number(token.replace(/\D/g, '')) - 1;
        return <label key={group+token} className="block text-xs">{group === 'parameters' ? 'Body' : 'Header'} variable {index+1}<Input required value={value[group]?.[index] ?? ''} onChange={event => { const next = [...(value[group] ?? [])]; next[index] = event.target.value; onChange({ ...value, [group]: next }); }} /></label>;
    };
    return <div className="space-y-2">{body.map(t => field(t, 'parameters'))}{headerVars.map(t => field(t, 'header_parameters'))}
        {['IMAGE','VIDEO','DOCUMENT'].includes(format) && <label className="block text-xs">{format.toLowerCase()} URL<Input type="url" placeholder="https://…" required={!template.headerMediaId && !template.headerUrl} value={value.header_url ?? ''} onChange={e => onChange({ ...value, header_url: e.target.value })} /></label>}
        {buttons.map((b: any, i: number) => b.type === 'URL' && b.url?.includes('{{') ? <label className="block text-xs" key={i}>{b.text} URL value<Input required value={value.button_parameters?.[i] ?? ''} onChange={e => onChange({ ...value, button_parameters: { ...value.button_parameters, [i]: e.target.value } })} /></label> : null)}
    </div>;
}
