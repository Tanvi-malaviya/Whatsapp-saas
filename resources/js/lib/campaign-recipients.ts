import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export type CampaignRecipient = { phone: string; name: string };

export function normalizeCampaignPhone(raw: string, country: CountryCode): string | null {
    const input = raw.trim();
    // Reject text, extensions, and spreadsheet errors rather than extracting a partial number.
    if (!/^\+?[\d\s().-]+$/.test(input)) return null;
    const number = input.startsWith('00') ? '+' + input.slice(2) : input;
    const parsed = parsePhoneNumberFromString(number, { defaultCountry: country, extract: false });
    return parsed?.isPossible() ? parsed.number : null;
}

export function normalizeCampaignRecipients(rows: CampaignRecipient[], country: CountryCode) {
    const recipients: CampaignRecipient[] = [];
    const seen = new Set<string>();
    let skipped = 0;
    let duplicates = 0;
    for (const row of rows) {
        const phone = normalizeCampaignPhone(row.phone, country);
        if (!phone) {
            skipped++;
            continue;
        }
        if (seen.has(phone)) {
            duplicates++;
            continue;
        }
        seen.add(phone);
        recipients.push({ phone, name: row.name.trim() || 'Valued Customer' });
    }
    return { recipients, skipped, duplicates };
}
