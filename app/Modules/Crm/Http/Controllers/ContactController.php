<?php

namespace App\Modules\Crm\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Crm\Models\Contact;
use App\Shared\PhoneNumber;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function index()
    {
        $org = TenantContext::organization();
        $defaultLabels = ['VIP', 'Wholesale', 'Retail', 'New Lead', 'Follow-up', 'Urgent', 'High Value', 'Support'];
        $savedLabels = $org?->metadata['contact_labels'] ?? $defaultLabels;

        $contacts = Contact::orderByDesc('last_message_at')->get()->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->contact_name ?: $c->contact_phone,
            'phone' => $c->contact_phone,
            'email' => $c->email ?: '—',
            'city' => $c->city ?: '—',
            'stage' => $c->pipeline_stage,
            'label' => $c->label ?: '',
            'consent' => $c->is_opted_in ? 'opted_in' : 'opted_out',
        ]);

        $usedLabels = $contacts->flatMap(function ($c) {
            return !empty($c['label']) ? array_map('trim', explode(',', $c['label'])) : [];
        })->filter()->unique()->values()->all();

        $allLabels = array_values(array_unique(array_merge($savedLabels, $usedLabels)));
        sort($allLabels);

        return Inertia::render('contacts/index', [
            'initialContacts' => $contacts,
            'initialLabels' => $allLabels,
        ]);
    }

    public function saveLabel(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $newLabel = trim($data['name']);
        $org = TenantContext::organization();
        if ($org) {
            $meta = $org->metadata ?? [];
            $labels = $meta['contact_labels'] ?? ['VIP', 'Wholesale', 'Retail', 'New Lead', 'Follow-up', 'Urgent', 'High Value', 'Support'];
            if (!in_array($newLabel, $labels, true)) {
                $labels[] = $newLabel;
                $meta['contact_labels'] = array_values(array_unique($labels));
                $org->update(['metadata' => $meta]);
            }
        }

        return back()->with('success', "Label \"{$newLabel}\" saved.");
    }

    public function deleteLabel(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $toDelete = trim($data['name']);
        $org = TenantContext::organization();
        if ($org) {
            $meta = $org->metadata ?? [];
            $labels = $meta['contact_labels'] ?? ['VIP', 'Wholesale', 'Retail', 'New Lead', 'Follow-up', 'Urgent', 'High Value', 'Support'];
            $meta['contact_labels'] = array_values(array_filter($labels, fn ($l) => strcasecmp($l, $toDelete) !== 0));
            $org->update(['metadata' => $meta]);
        }

        return back()->with('success', "Label \"{$toDelete}\" removed from master list.");
    }
    private function data(Request $request): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
            'email' => 'nullable|email|max:255',
            'city' => 'nullable|string|max:100',
            'stage' => 'nullable|in:New,Contacted,Interested,Qualified,Proposal,Negotiation,Won,Lost',
            'label' => 'nullable|string|max:100',
            'opt_in' => 'required|boolean',
        ]);
        return [
            'contact_name' => $data['name'],
            'contact_phone' => (new PhoneNumber($data['phone']))->getE164(),
            'email' => $data['email'] ?? null,
            'city' => $data['city'] ?? null,
            'pipeline_stage' => $data['stage'] ?? 'New',
            'label' => $data['label'] ?? null,
            'is_opted_in' => $data['opt_in'],
        ];
    }
    public function store(Request $request)
    {
        $data = $this->data($request);
        Contact::updateOrCreate(['organization_id' => TenantContext::id(), 'contact_phone' => $data['contact_phone']], $data);
        return back()->with('success', 'Contact saved.');
    }
    public function update(Request $request, string $id)
    {
        $contact = Contact::findOrFail($id);
        $data = $this->data($request);

        $existsOther = Contact::where('organization_id', TenantContext::id())
            ->where('contact_phone', $data['contact_phone'])
            ->whereKeyNot($id)
            ->exists();

        if ($existsOther) {
            throw ValidationException::withMessages([
                'phone' => 'This phone number already belongs to another contact.',
            ]);
        }

        // If phone number changed, keep conversation history in sync with the new number
        if ($contact->contact_phone !== $data['contact_phone']) {
            \App\Modules\Messaging\Models\Conversation::withoutGlobalScopes()
                ->where('organization_id', TenantContext::id())
                ->where(function ($q) use ($contact) {
                    $q->where('contact_id', $contact->id)
                      ->orWhere('contact_phone', $contact->contact_phone);
                })
                ->update(['contact_phone' => $data['contact_phone']]);
        }

        $contact->update($data);
        return back()->with('success', 'Contact updated successfully.');
    }
    public function destroy(string $id)
    {
        Contact::findOrFail($id)->delete(); return back()->with('success', 'Contact archived. Message histories retained.');
    }
    public function bulk(Request $request)
    {
        $data = $request->validate([
            'contacts' => 'required|array|max:10000',
            'contacts.*.name' => 'nullable|string|max:100',
            'contacts.*.phone' => 'required|string|max:30',
            'contacts.*.label' => 'nullable|string|max:100',
            'consent_confirmed' => 'accepted'
        ]);
        DB::transaction(function () use ($data) {
            foreach ($data['contacts'] as $row) {
                $phone = (new PhoneNumber($row['phone']))->getE164();
                Contact::firstOrCreate(
                    ['organization_id' => TenantContext::id(), 'contact_phone' => $phone],
                    ['contact_name' => $row['name'] ?? $phone, 'label' => $row['label'] ?? null, 'is_opted_in' => true]
                );
            }
        });
        return back()->with('success', 'Contacts imported. Existing opt-out choices retained.');
    }
    public function duplicates()
    {
        // E.164 normalization and a database unique key prevent duplicate phone records.
        return response()->json(['duplicates' => [], 'total_duplicates' => 0]);
    }
    public function merge(Request $request)
    {
        $data = $request->validate(['primary_id' => 'required|uuid','duplicate_ids' => 'required|array|min:1', 'duplicate_ids.*' => 'required|uuid|different:primary_id']);
        DB::transaction(function () use ($data) {
            $primary = Contact::findOrFail($data['primary_id']);
            foreach (Contact::whereIn('id', $data['duplicate_ids'])->get() as $duplicate) {
                abort_unless($duplicate->contact_phone === $primary->contact_phone, 422, 'Contacts with different numbers must keep separate histories.');
                $duplicate->conversations()->update(['contact_id' => $primary->id]); $duplicate->delete();
            }
        });
        return back()->with('success', 'Contact details merged. Per-number conversations retained.');
    }
}
