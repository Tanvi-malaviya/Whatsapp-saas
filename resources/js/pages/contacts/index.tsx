import { Head, Link } from '@inertiajs/react';
import {
    Users,
    Plus,
    Search,
    Upload,
    Download,
    Phone,
    Mail,
    CheckCircle2,
    XCircle,
    ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

type Contact = {
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    stage: 'New' | 'Contacted' | 'Interested' | 'Won';
    consent: 'opted_in' | 'opted_out';
};

export default function ContactsList() {
    const [contacts, setContacts] = useState<Contact[]>([
        {
            id: '1',
            name: 'Rahul Patel',
            phone: '+919825012345',
            email: 'rahul@example.com',
            city: 'Ahmedabad',
            stage: 'Interested',
            consent: 'opted_in',
        },
        {
            id: '2',
            name: 'Priya Sharma',
            phone: '+919428067890',
            email: 'priya@example.com',
            city: 'Surat',
            stage: 'Contacted',
            consent: 'opted_in',
        },
        {
            id: '3',
            name: 'Amit Shah',
            phone: '+917984054321',
            email: 'amit@example.com',
            city: 'Vadodara',
            stage: 'Won',
            consent: 'opted_in',
        },
        {
            id: '4',
            name: 'Dhaval Joshi',
            phone: '+919898099887',
            email: 'dhaval@example.com',
            city: 'Rajkot',
            stage: 'New',
            consent: 'opted_out',
        },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

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
                        <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs">
                            <Upload className="size-3.5" />
                            Import CSV
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 text-xs">
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
                </Card>
            </div>
        </>
    );
}
