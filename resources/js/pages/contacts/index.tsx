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

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
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

        router.post('/contacts', {
            name: name.trim(),
            phone: cleaned,
            stage,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddOpen(false);
                setName('');
                setPhone('');
                setEmail('');
                setCity('');
                setStage('New');
                setOptIn(true);
                showToast(`Contact "${name.trim()}" saved successfully!`);
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
                                    className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs font-semibold gap-1.5 h-9 px-4 shadow-xs"
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
                                onClick={() => setIsAddOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Save Contact
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
                            Upload a spreadsheet or CSV file with names, WhatsApp numbers, and city.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="rounded-lg border-2 border-dashed border-sidebar-border p-6 text-center hover:bg-muted/20 transition-colors cursor-pointer">
                            <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
                            <p className="text-xs font-semibold text-foreground">Click to upload CSV or drag and drop</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Columns: Name, Phone, Email, City (Max 5,000 rows)</p>
                        </div>

                        <div className="rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
                            <p className="font-semibold text-foreground">CSV Format Example:</p>
                            <p className="font-mono text-[10px]">Name,Phone,Email,City<br/>Rahul Patel,9825012345,rahul@mail.com,Ahmedabad</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsImportOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleImportSample}
                        >
                            Simulate Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
