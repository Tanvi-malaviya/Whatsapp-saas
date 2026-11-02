import { Head, Link, router } from '@inertiajs/react';
import {
    Users,
    Plus,
    Search,
    Upload,
    Phone,
    Mail,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Check,
    FileSpreadsheet,
    Pencil,
    Trash2,
    GitMerge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';

type Contact = {
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    stage: 'New' | 'Contacted' | 'Interested' | 'Won';
    consent: 'opted_in' | 'opted_out';
};

export default function ContactsList({ initialContacts = [] }: { initialContacts?: Contact[] }) {
    const [contacts, setContacts] = useState<Contact[]>(initialContacts);

    useEffect(() => {
        setContacts(initialContacts);
    }, [initialContacts]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Add Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [stage, setStage] = useState<'New' | 'Contacted' | 'Interested' | 'Won'>('New');
    const [optIn, setOptIn] = useState(true);

    // Edit Form State
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editStage, setEditStage] = useState<'New' | 'Contacted' | 'Interested' | 'Won'>('New');
    const [editOptIn, setEditOptIn] = useState(true);

    // Delete Confirmation Modal State
    const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Deduplication Modal State
    const [isDeduplicateOpen, setIsDeduplicateOpen] = useState(false);
    const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
    const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
    const [selectedPrimaries, setSelectedPrimaries] = useState<Record<string, string>>({});

    const handleOpenDeduplicate = () => {
        setIsDeduplicateOpen(true);
        setIsScanningDuplicates(true);
        fetch('/contacts/duplicates')
            .then((res) => res.json())
            .then((data) => {
                setDuplicateGroups(data.duplicates || []);
                // Default primary is the first contact in each group
                const primaries: Record<string, string> = {};
                (data.duplicates || []).forEach((g: any) => {
                    if (g.records && g.records.length > 0) {
                        primaries[g.normalized_phone] = g.records[0].id;
                    }
                });
                setSelectedPrimaries(primaries);
            })
            .catch(() => {})
            .finally(() => setIsScanningDuplicates(false));
    };

    const handleMergeGroup = (groupPhone: string) => {
        const primaryId = selectedPrimaries[groupPhone];
        const group = duplicateGroups.find((g) => g.normalized_phone === groupPhone);
        if (!primaryId || !group) return;

        const duplicateIds = group.records
            .map((r: any) => r.id)
            .filter((id: string) => id !== primaryId);

        if (duplicateIds.length === 0) return;

        router.post(
            '/contacts/merge',
            {
                primary_id: primaryId,
                duplicate_ids: duplicateIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDuplicateGroups((prev) => prev.filter((g) => g.normalized_phone !== groupPhone));
                    showToast('Duplicate contacts merged successfully!');
                },
            }
        );
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) {
                setIsUploading(false);
                return;
            }
            const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l.length > 0);
            if (lines.length === 0) {
                setIsUploading(false);
                showToast('Uploaded CSV file is empty.');
                return;
            }

            const firstLine = lines[0].toLowerCase();
            const dataLines = firstLine.includes('phone') || firstLine.includes('name') ? lines.slice(1) : lines;
            const parsedContacts: { name: string; phone: string }[] = [];

            for (const line of dataLines) {
                const parts = line.split(',').map((p) => p.trim());
                if (parts.length >= 2 && parts[1].length >= 8) {
                    parsedContacts.push({ name: parts[0] || 'Customer', phone: parts[1] });
                } else if (parts.length === 1 && parts[0].length >= 8) {
                    parsedContacts.push({ name: 'Contact ' + parts[0], phone: parts[0] });
                }
            }

            if (parsedContacts.length === 0) {
                setIsUploading(false);
                showToast('No valid contacts found in CSV. Please ensure each row has at least Name,Phone.');
                return;
            }

            router.post(
                '/contacts/bulk',
                { contacts: parsedContacts },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsImportOpen(false);
                        setIsUploading(false);
                        showToast(`Successfully imported ${parsedContacts.length} contacts!`);
                    },
                    onError: () => {
                        setIsUploading(false);
                    },
                }
            );
        };
        reader.readAsText(file);
    };

    const handleAddContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;

        // Normalize phone number to E.164 (+91)
        let cleaned = phone.replace(/[^\d+]/g, '');
        if (!cleaned.startsWith('+')) {
            if (cleaned.length === 10) {
                cleaned = '+91' + cleaned;
            } else if (cleaned.startsWith('91') && cleaned.length === 12) {
                cleaned = '+' + cleaned;
            } else {
                cleaned = '+91' + cleaned;
            }
        }

        setIsAdding(true);
        router.post('/contacts', {
            name: name.trim(),
            phone: cleaned,
            email: email.trim(),
            city: city.trim(),
            stage,
            opt_in: optIn,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAdding(false);
                setIsAddOpen(false);
                setName('');
                setPhone('');
                setEmail('');
                setCity('');
                setStage('New');
                setOptIn(true);
                showToast(`Contact "${name.trim()}" saved successfully!`);
            },
            onError: () => {
                setIsAdding(false);
            },
            onFinish: () => {
                setIsAdding(false);
            },
        });
    };

    const openEditModal = (contact: Contact) => {
        setEditingContact(contact);
        setEditName(contact.name);
        setEditPhone(contact.phone);
        setEditCity(contact.city === '—' ? '' : contact.city);
        setEditEmail(contact.email === '—' ? '' : contact.email);
        setEditStage(contact.stage);
        setEditOptIn(contact.consent === 'opted_in');
    };

    const handleUpdateContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContact || !editName.trim() || !editPhone.trim()) return;

        let cleaned = editPhone.replace(/[^\d+]/g, '');
        if (!cleaned.startsWith('+')) {
            if (cleaned.length === 10) {
                cleaned = '+91' + cleaned;
            } else if (cleaned.startsWith('91') && cleaned.length === 12) {
                cleaned = '+' + cleaned;
            } else {
                cleaned = '+91' + cleaned;
            }
        }

        const targetId = editingContact.id;
        const newName = editName.trim();
        const newCity = editCity.trim() || '—';
        const newEmail = editEmail.trim() || '—';
        const newStage = editStage;
        const newConsent: 'opted_in' | 'opted_out' = editOptIn ? 'opted_in' : 'opted_out';

        // Immediate state update for instant UI response in table
        setContacts((prev) =>
            prev.map((c) =>
                c.id === targetId
                    ? {
                          ...c,
                          name: newName,
                          phone: cleaned,
                          city: newCity,
                          email: newEmail,
                          stage: newStage,
                          consent: newConsent,
                      }
                    : c
            )
        );

        setIsUpdating(true);
        router.put(
            `/contacts/${targetId}`,
            {
                name: newName,
                phone: cleaned,
                city: editCity.trim(),
                email: editEmail.trim(),
                stage: newStage,
                opt_in: editOptIn,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsUpdating(false);
                    setEditingContact(null);
                    showToast(`Contact "${newName}" updated successfully!`);
                },
                onError: () => {
                    setIsUpdating(false);
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!deletingContact) return;
        setIsDeleting(true);
        const targetId = deletingContact.id;
        const deletedName = deletingContact.name;

        // Immediate removal from table
        setContacts((prev) => prev.filter((c) => c.id !== targetId));

        router.delete(`/contacts/${targetId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingContact(null);
                setIsDeleting(false);
                showToast(`Contact "${deletedName}" deleted successfully.`);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const filtered = contacts.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Head title="Contacts & CRM Directory" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground p-0">
                                <Link href="/dashboard">
                                    <ArrowLeft className="size-3.5 mr-1" />
                                    Dashboard
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Users className="size-6 text-emerald-600" />
                            Contacts & CRM Directory
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage all your customer WhatsApp phone numbers, tags, lead stages, and DPDP suppression list.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {toastMessage && (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-in fade-in mr-2">
                                <Check className="size-4" /> {toastMessage}
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-9 text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                            onClick={handleOpenDeduplicate}
                        >
                            <GitMerge className="size-3.5" />
                            Deduplicate &amp; Merge
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-9 text-xs"
                            onClick={() => setIsImportOpen(true)}
                        >
                            <Upload className="size-3.5" />
                            Import CSV
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 text-xs"
                            onClick={() => setIsAddOpen(true)}
                        >
                            <Plus className="size-3.5" />
                            Add Contact
                        </Button>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search contacts by name, city, or +91 number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-xs focus:outline-none"
                        />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {filtered.length} Contacts
                    </Badge>
                </div>

                {/* Contacts Data Table */}
                <Card className="border-sidebar-border/70 overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3">
                                <Users className="size-7" />
                            </div>
                            <h3 className="text-base font-bold text-foreground">
                                No Contacts Found
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                                {searchTerm
                                    ? 'No contacts match your search query.'
                                    : 'Contacts are automatically captured when customers message you on WhatsApp, or you can add contacts manually.'}
                            </p>
                            {!searchTerm && (
                                <Button
                                    onClick={() => setIsAddOpen(true)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 h-9 px-4 shadow-xs"
                                >
                                    <Plus className="size-4" />
                                    Add First Contact
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-sidebar-border/60 uppercase font-semibold text-muted-foreground text-[10px]">
                                    <tr>
                                        <th className="p-3.5">Name</th>
                                        <th className="p-3.5">WhatsApp Number</th>
                                        <th className="p-3.5">Email</th>
                                        <th className="p-3.5">City</th>
                                        <th className="p-3.5">Lead Stage</th>
                                        <th className="p-3.5">Consent / Opt-in</th>
                                        <th className="p-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/40">
                                    {filtered.map((contact) => (
                                        <tr key={contact.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3.5 font-semibold text-foreground">
                                                {contact.name}
                                            </td>
                                            <td className="p-3.5 font-mono text-muted-foreground">
                                                {contact.phone}
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {contact.email}
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {contact.city}
                                            </td>
                                            <td className="p-3.5">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {contact.stage}
                                                </Badge>
                                            </td>
                                            <td className="p-3.5">
                                                {contact.consent === 'opted_in' ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                                                        <CheckCircle2 className="size-3.5" /> Opted In
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 font-medium text-[11px]">
                                                        <XCircle className="size-3.5" /> Suppressed (Opt-Out)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditModal(contact)}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                                        title="Edit contact"
                                                    >
                                                        <Pencil className="size-3.5 text-emerald-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeletingContact(contact)}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                                                        title="Delete contact"
                                                    >
                                                        <Trash2 className="size-3.5 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal 1: Add Contact Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Plus className="size-4 text-emerald-600" />
                            Add New WhatsApp Contact
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Add a customer number. Numbers will be normalized to standard E.164 (+91).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddContact} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Full Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Rahul Patel"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">WhatsApp Number *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. 9825012345 or +919825012345"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <p className="text-[10px] text-muted-foreground">Automatically formatted with India +91 code</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">City (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ahmedabad"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Lead Stage</label>
                                <select
                                    value={stage}
                                    onChange={(e) => setStage(e.target.value as any)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                                >
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Won">Won</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Email (optional)</label>
                            <input
                                type="email"
                                placeholder="e.g. rahul@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                            />
                        </div>

                        <div className="flex items-start gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="optin"
                                checked={optIn}
                                onChange={(e) => setOptIn(e.target.checked)}
                                className="rounded border-input text-emerald-600 focus:ring-emerald-500 size-4 mt-0.5"
                            />
                            <label htmlFor="optin" className="text-[11px] text-muted-foreground leading-tight cursor-pointer">
                                <strong>WhatsApp Opt-In Consent</strong>: Contact gave permission to receive WhatsApp notifications (DPDP Act compliant).
                            </label>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isAdding}
                                onClick={() => setIsAddOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isAdding}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[125px]"
                            >
                                {isAdding ? (
                                    <>
                                        <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Contact</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Import CSV Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <FileSpreadsheet className="size-4 text-emerald-600" />
                            Import Contacts from CSV
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Upload a spreadsheet or CSV file with customer names and WhatsApp numbers.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-sidebar-border p-6 text-center hover:bg-muted/20 transition-colors cursor-pointer">
                            <Upload className="size-8 text-muted-foreground mb-2" />
                            <p className="text-xs font-semibold text-foreground">
                                {isUploading ? 'Importing CSV Contacts...' : 'Click to select CSV file'}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Columns: Name, Phone (Max 5,000 rows)</p>
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                disabled={isUploading}
                                onChange={handleFileUpload}
                            />
                        </label>

                        <div className="rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
                            <p className="font-semibold text-foreground">CSV Format Example:</p>
                            <p className="font-mono text-[10px]">Name,Phone<br/>Customer Name,919876543210</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            onClick={() => setIsImportOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Modal 3: Edit Contact Dialog */}
            <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Pencil className="size-4 text-emerald-600" />
                            Edit Contact Details
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Update contact name, WhatsApp phone number, and lead pipeline stage.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateContact} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Full Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Rahul Patel"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">WhatsApp Number *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. 9825012345 or +919825012345"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <p className="text-[10px] text-muted-foreground">Automatically formatted with India +91 code</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">City (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ahmedabad"
                                    value={editCity}
                                    onChange={(e) => setEditCity(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Lead Stage</label>
                                <select
                                    value={editStage}
                                    onChange={(e) => setEditStage(e.target.value as any)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                                >
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Won">Won</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Email (optional)</label>
                            <input
                                type="email"
                                placeholder="e.g. rahul@example.com"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                            />
                        </div>

                        <div className="flex items-start gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="edit-optin"
                                checked={editOptIn}
                                onChange={(e) => setEditOptIn(e.target.checked)}
                                className="rounded border-input text-emerald-600 focus:ring-emerald-500 size-4 mt-0.5"
                            />
                            <label htmlFor="edit-optin" className="text-[11px] text-muted-foreground leading-tight cursor-pointer">
                                <strong>WhatsApp Opt-In Consent</strong>: Contact gave permission to receive WhatsApp notifications (DPDP Act compliant).
                            </label>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => setEditingContact(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isUpdating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[135px]"
                            >
                                {isUpdating ? (
                                    <>
                                        <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <span>Update Contact</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 4: Delete Confirmation Dialog */}
            <Dialog
                open={!!deletingContact}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) setDeletingContact(null);
                }}
            >
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 mb-2">
                            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <DialogTitle className="text-center text-base font-bold text-foreground">
                            Delete Contact
                        </DialogTitle>
                        <DialogDescription className="text-center text-xs text-muted-foreground pt-1">
                            Are you sure you want to delete <span className="font-semibold text-foreground">{deletingContact?.name}</span> ({deletingContact?.phone})?
                            This contact and conversation will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex-row gap-2 sm:justify-center pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setDeletingContact(null)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
                        >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 5: Contact Deduplication & Merge Dialog */}
            <Dialog open={isDeduplicateOpen} onOpenChange={setIsDeduplicateOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <GitMerge className="size-4 text-indigo-600" />
                            Contact Deduplication &amp; 1-Click Merge
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Scans your directory for duplicate WhatsApp phone numbers across multiple formats and merges conversations into 1 master record.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-2 space-y-4">
                        {isScanningDuplicates ? (
                            <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
                                <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
                                <p className="text-xs font-semibold">Scanning phone numbers for duplicates...</p>
                            </div>
                        ) : duplicateGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-dashed border-border">
                                <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                                    <CheckCircle2 className="size-6" />
                                </div>
                                <h4 className="text-sm font-bold text-foreground">Clean Directory! No Duplicates Found</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                    All customer phone numbers in your directory are unique and properly normalized.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-300">
                                    <span>Found <strong>{duplicateGroups.length} duplicate phone cluster(s)</strong>. Select which record to keep as Primary:</span>
                                </div>

                                {duplicateGroups.map((group, gIdx) => {
                                    const primaryId = selectedPrimaries[group.normalized_phone];

                                    return (
                                        <div
                                            key={group.normalized_phone}
                                            className="rounded-xl border border-border bg-card p-3.5 shadow-2xs space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-foreground">
                                                        Cluster #{gIdx + 1}:
                                                    </span>
                                                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                        ending in ...{group.normalized_phone}
                                                    </span>
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {group.count} records
                                                    </Badge>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMergeGroup(group.normalized_phone)}
                                                    className="h-7 px-3 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                                                >
                                                    <GitMerge className="size-3" />
                                                    Merge Cluster
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {group.records.map((rec: any) => {
                                                    const isPrimary = rec.id === primaryId;

                                                    return (
                                                        <div
                                                            key={rec.id}
                                                            onClick={() =>
                                                                setSelectedPrimaries({
                                                                    ...selectedPrimaries,
                                                                    [group.normalized_phone]: rec.id,
                                                                })
                                                            }
                                                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                                                isPrimary
                                                                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-500/5'
                                                                    : 'border-border/80 hover:border-border hover:bg-muted/30'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="font-bold text-foreground">
                                                                    {rec.name}
                                                                </span>
                                                                {isPrimary ? (
                                                                    <Badge className="bg-indigo-600 text-[10px] px-1.5 py-0 font-bold">
                                                                        Primary (Keep)
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        Will merge into primary
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="space-y-0.5 text-[11px] text-muted-foreground font-mono">
                                                                <p>Phone: <span className="text-foreground">{rec.phone}</span></p>
                                                                <p>Stage: <span className="text-foreground">{rec.stage}</span></p>
                                                                <p>Email: <span className="text-foreground">{rec.email}</span></p>
                                                                <p>Deal: <span className="text-emerald-600 font-bold">₹{rec.deal_value}</span></p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDeduplicateOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
