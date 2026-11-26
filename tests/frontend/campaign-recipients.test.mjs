import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeCampaignPhone, normalizeCampaignRecipients } from '../../resources/js/lib/campaign-recipients.ts';

test('local phone numbers use the selected country and its trunk-prefix rules', () => {
    assert.equal(normalizeCampaignPhone('98765 43210', 'IN'), '+919876543210');
    assert.equal(normalizeCampaignPhone('09876543210', 'IN'), '+919876543210');
    assert.equal(normalizeCampaignPhone('07700 900123', 'GB'), '+447700900123');
    assert.equal(normalizeCampaignPhone('050 123 4567', 'AE'), '+971501234567');
    assert.equal(normalizeCampaignPhone('8123 4567', 'SG'), '+6581234567');
    assert.equal(normalizeCampaignPhone('(213) 373-4253', 'US'), '+12133734253');
    assert.equal(normalizeCampaignPhone('02 36618 300', 'IT'), '+390236618300');
});

test('international numbers are preserved without duplicating calling codes', () => {
    assert.equal(normalizeCampaignPhone('+1 (213) 373-4253', 'IN'), '+12133734253');
    assert.equal(normalizeCampaignPhone('0044 7700 900123', 'IN'), '+447700900123');
    assert.equal(normalizeCampaignPhone('919876543210', 'IN'), '+919876543210');
    assert.equal(normalizeCampaignPhone('447700900123', 'GB'), '+447700900123');
    // A local number beginning with its country's calling code is still local.
    assert.equal(normalizeCampaignPhone('9123456789', 'IN'), '+919123456789');
});

test('invalid rows and spreadsheet errors are rejected instead of partially extracted', () => {
    for (const value of ['', '123', '12345678901234567', '#VALUE!', 'Customer 9876543210', '9876543210 ext 123', '+91+9876543210']) {
        assert.equal(normalizeCampaignPhone(value, 'IN'), null, value);
    }
});

test('bulk and spreadsheet recipients are deduplicated after normalization', () => {
    const audience = normalizeCampaignRecipients([
        { phone: '9876543210', name: 'Alice' },
        { phone: '+919876543210', name: 'Duplicate' },
        { phone: 'invalid', name: 'Bad row' },
        { phone: '9123456789', name: '' },
    ], 'IN');
    assert.deepEqual(audience, {
        recipients: [{ phone: '+919876543210', name: 'Alice' }, { phone: '+919123456789', name: 'Valued Customer' }],
        skipped: 1,
        duplicates: 1,
    });
});

test('changing countries reprocesses original imported numbers', () => {
    const rows = [{ phone: '2133734253', name: 'Alice' }];
    assert.equal(normalizeCampaignRecipients(rows, 'US').recipients[0].phone, '+12133734253');
    assert.equal(normalizeCampaignRecipients(rows, 'IN').recipients[0].phone, '+912133734253');
    assert.equal(rows[0].phone, '2133734253');
});
