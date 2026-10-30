import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ShoppingBag,
    Plus,
    RefreshCw,
    Search,
    ExternalLink,
    Package,
    CheckCircle2,
    Clock,
    Truck,
    Check,
    Smartphone,
    Sliders,
    Tag,
    DollarSign,
    Trash2,
    Eye,
    MessageSquare,
    Store,
    Sparkles,
    AlertCircle,
    Copy,
    Upload,
    Image as ImageIcon,
    X,
    Send,
    LayoutGrid,
    List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Product = {
    id: string;
    name: string;
    retailer_id: string;
    description: string;
    price: number | string;
    currency: string;
    image_url: string;
    category: string;
    is_available: boolean;
    meta_catalog_id?: string;
    created_at: string;
};

type Order = {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number | string;
    currency: string;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    items: Array<{ name: string; qty: number; price: number }>;
    meta_order_id?: string;
    notes?: string;
    created_at: string;
};

type Props = {
    products: Product[];
    orders: Order[];
    channels: Array<{ id: string; name: string; phone_number: string; is_default: boolean }>;
    catalogMeta: {
        catalog_id: string;
        catalog_name: string;
        currency: string;
        is_connected: boolean;
        last_synced_at: string;
    };
};

export default function CommerceIndex({
    products = [],
    orders = [],
    channels = [],
    catalogMeta,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [selectedProductForPreview, setSelectedProductForPreview] = useState<Product | null>(products[0] || null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Send Catalog & Product to Customer state
    const [isSendCatalogModalOpen, setIsSendCatalogModalOpen] = useState(false);
    const [catalogPhone, setCatalogPhone] = useState('');
    const [catalogNote, setCatalogNote] = useState('Welcome! Browse our WhatsApp Catalog and tap Add to Cart to order directly:');
    const [isSendingCatalog, setIsSendingCatalog] = useState(false);

    const [isSendProductModalOpen, setIsSendProductModalOpen] = useState(false);
    const [selectedProductForSend, setSelectedProductForSend] = useState<Product | null>(null);
    const [productPhone, setProductPhone] = useState('');
    const [isSendingProduct, setIsSendingProduct] = useState(false);

    // New product form
    const [form, setForm] = useState({
        name: '',
        retailer_id: '',
        price: '',
        description: '',
        category: 'General',
        image_url: '',
        is_available: true,
    });

    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSyncCatalog = async () => {
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const resp = await fetch('/commerce/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
            });
            const data = await resp.json();
            setSyncMessage(data.message || 'Catalog synced with Meta Commerce Manager!');
            setTimeout(() => setSyncMessage(null), 4000);
        } catch {
            setSyncMessage('Catalog sync request processed.');
            setTimeout(() => setSyncMessage(null), 4000);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSendCatalog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catalogPhone) return;
        setIsSendingCatalog(true);
        try {
            const resp = await fetch('/commerce/send-catalog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
                body: JSON.stringify({
                    phone: catalogPhone,
                    body_text: catalogNote,
                }),
            });
            const data = await resp.json();
            setIsSendCatalogModalOpen(false);
            setCatalogPhone('');
            setSyncMessage(data.message || 'WhatsApp Catalog message sent successfully!');
            setTimeout(() => setSyncMessage(null), 5000);
        } catch {
            setSyncMessage('Failed to send catalog message.');
            setTimeout(() => setSyncMessage(null), 5000);
        } finally {
            setIsSendingCatalog(false);
        }
    };

    const handleSendProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productPhone || !selectedProductForSend) return;
        setIsSendingProduct(true);
        try {
            const resp = await fetch('/commerce/send-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
                body: JSON.stringify({
                    product_id: selectedProductForSend.id,
                    phone: productPhone,
                }),
            });
            const data = await resp.json();
            setIsSendProductModalOpen(false);
            setProductPhone('');
            setSyncMessage(data.message || `Product ${selectedProductForSend.name} sent via WhatsApp!`);
            setTimeout(() => setSyncMessage(null), 5000);
        } catch {
            setSyncMessage('Failed to send product message.');
            setTimeout(() => setSyncMessage(null), 5000);
        } finally {
            setIsSendingProduct(false);
        }
    };

    const [isSimulatingOrder, setIsSimulatingOrder] = useState(false);

    const handleSimulateOrder = async () => {
        setIsSimulatingOrder(true);
        try {
            const resp = await fetch('/commerce/simulate-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
            });
            const data = await resp.json();
            if (data.success) {
                setSyncMessage(data.message);
                setTimeout(() => setSyncMessage(null), 5000);
                router.reload({ only: ['orders'] });
            } else {
                setSyncMessage(data.message || 'Failed to simulate order.');
                setTimeout(() => setSyncMessage(null), 5000);
            }
        } catch {
            setSyncMessage('Failed to create test order.');
            setTimeout(() => setSyncMessage(null), 5000);
        } finally {
            setIsSimulatingOrder(false);
        }
    };


    const handleCreateProduct = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            name: form.name,
            retailer_id: form.retailer_id,
            price: form.price,
            description: form.description,
            category: form.category,
            is_available: form.is_available,
        };

        if (imageMode === 'upload' && imageFile) {
            payload.image_file = imageFile;
            if (imagePreview) {
                payload.image_base64 = imagePreview;
            }
        } else if (form.image_url) {
            payload.image_url = form.image_url;
        }

        router.post('/commerce/products', payload, {
            forceFormData: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                setImageFile(null);
                setImagePreview(null);
                setForm({
                    name: '',
                    retailer_id: '',
                    price: '',
                    description: '',
                    category: 'General',
                    image_url: '',
                    is_available: true,
                });
            },
        });
    };

    const handleConfirmDelete = () => {
        if (!deletingProduct) return;
        setIsDeleting(true);
        router.delete(`/commerce/products/${deletingProduct.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeletingProduct(null);
            },
        });
    };

    const handleUpdateStatus = (id: string, newStatus: string) => {
        router.patch(`/commerce/orders/${id}/status`, { status: newStatus });
    };

    // Filter products
    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.retailer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

    const totalRevenue = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

    return (
        <>
            <Head title="WhatsApp Commerce & Meta Catalog | WhatsApp SaaS" />

            <div className="flex flex-col gap-2.5 p-3 md:p-4 max-w-7xl mx-auto w-full font-sans">
                {/* 1. Ultra-Compact Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <ShoppingBag className="size-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-none">
                                    WhatsApp Catalog &amp; Commerce
                                </h1>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Meta Connected
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                                Showcase catalog products and accept direct customer cart orders in WhatsApp chat.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSendCatalogModalOpen(true)}
                            className="h-8 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5 font-medium"
                        >
                            <Send className="size-3" />
                            Send Catalog
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSyncCatalog}
                            disabled={isSyncing}
                            className="h-8 px-2.5 text-xs border-border gap-1.5 font-medium"
                            title="Sync with Meta Commerce Manager"
                        >
                            <RefreshCw className={`size-3 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync'}
                        </Button>

                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs font-semibold gap-1.5 shadow-2xs"
                        >
                            <Plus className="size-3.5" />
                            Add Product
                        </Button>
                    </div>
                </div>

                {syncMessage && (
                    <div className="p-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                            <span>{syncMessage}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">Catalog ID: {catalogMeta.catalog_id}</span>
                    </div>
                )}

                {/* 2. Compact Key Metrics Strip (~48px height) */}
                <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-border/80 bg-card/70 divide-y md:divide-y-0 md:divide-x divide-border/60 shadow-2xs overflow-hidden">
                    <div className="px-3.5 py-2 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Products</span>
                            <div className="text-base font-bold text-foreground leading-tight">{products.length}</div>
                        </div>
                        <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded-md">
                            <Check className="size-2.5" /> Live in Meta
                        </span>
                    </div>

                    <div className="px-3.5 py-2 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">WhatsApp Orders</span>
                            <div className="text-base font-bold text-foreground leading-tight">{orders.length}</div>
                        </div>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">Direct Carts</span>
                    </div>

                    <div className="px-3.5 py-2 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Catalog Sales</span>
                            <div className="text-base font-bold text-foreground leading-tight">₹{totalRevenue.toLocaleString('en-IN')}</div>
                        </div>
                        <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-md">INR</span>
                    </div>

                    <div className="px-3.5 py-2 flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Meta Catalog ID</span>
                            <div className="text-[11px] font-mono font-semibold text-foreground truncate">{catalogMeta.catalog_id}</div>
                        </div>
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Connected" />
                    </div>
                </div>

                {/* 3. Main Navigation & Unified Controls Bar */}
                <Tabs defaultValue="products" className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
                        <TabsList className="bg-muted/50 p-0.5 border border-border/70 rounded-lg h-8 flex flex-wrap gap-0.5">
                            <TabsTrigger value="products" className="text-xs font-semibold px-2.5 py-1 data-[state=active]:bg-card data-[state=active]:shadow-2xs rounded-md">
                                <Package className="size-3 mr-1.5" />
                                Products ({products.length})
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="text-xs font-semibold px-2.5 py-1 data-[state=active]:bg-card data-[state=active]:shadow-2xs rounded-md">
                                <ShoppingBag className="size-3 mr-1.5" />
                                Orders ({orders.length})
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="text-xs font-semibold px-2.5 py-1 data-[state=active]:bg-card data-[state=active]:shadow-2xs rounded-md">
                                <Smartphone className="size-3 mr-1.5 text-primary" />
                                Chat Preview
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="text-xs font-semibold px-2.5 py-1 data-[state=active]:bg-card data-[state=active]:shadow-2xs rounded-md">
                                <Sliders className="size-3 mr-1.5" />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-1.5">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-56">
                                <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search products or SKU..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 h-8 text-xs bg-card"
                                />
                            </div>

                            {/* View Mode Toggle (Table vs Grid) */}
                            <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-muted/40 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`p-1 rounded-md transition-colors ${
                                        viewMode === 'table'
                                            ? 'bg-card text-foreground shadow-2xs font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="Compact Table View"
                                >
                                    <List className="size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1 rounded-md transition-colors ${
                                        viewMode === 'grid'
                                            ? 'bg-card text-foreground shadow-2xs font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="Compact Card Grid View"
                                >
                                    <LayoutGrid className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ================= TAB 1: PRODUCTS ================= */}
                    <TabsContent value="products" className="space-y-3">
                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                                        categoryFilter === cat
                                            ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* View 1: Compact SaaS Table View */}
                        {viewMode === 'table' ? (
                            <Card className="border-border/80 bg-card overflow-hidden shadow-2xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase text-[10px] font-semibold">
                                            <tr>
                                                <th className="px-3.5 py-2">Product</th>
                                                <th className="px-3 py-2">Category</th>
                                                <th className="px-3 py-2">Price</th>
                                                <th className="px-3 py-2">Status</th>
                                                <th className="px-3 py-2 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {filteredProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-10 text-muted-foreground text-xs">
                                                        No products found matching your search.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredProducts.map((p) => (
                                                    <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                                                        <td className="px-3.5 py-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <img
                                                                    src={p.image_url}
                                                                    alt={p.name}
                                                                    className="size-9 rounded-lg object-cover border border-border/80 shrink-0 bg-muted"
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-foreground text-xs truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                                                                        {p.name}
                                                                    </div>
                                                                    <span className="text-[10px] font-mono text-muted-foreground">
                                                                        SKU: {p.retailer_id}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground text-xs">
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                                                                {p.category}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-2 font-bold text-foreground text-xs">
                                                            ₹{Number(p.price).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {p.is_available ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                                    In Stock
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                                                                    <span className="size-1.5 rounded-full bg-red-500" />
                                                                    Out of Stock
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedProductForSend(p);
                                                                        setIsSendProductModalOpen(true);
                                                                    }}
                                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                                    title="Send this product to WhatsApp Phone"
                                                                >
                                                                    <Send className="size-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedProductForPreview(p);
                                                                        setIsPreviewModalOpen(true);
                                                                    }}
                                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                    title="Preview in WhatsApp"
                                                                >
                                                                    <Eye className="size-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeletingProduct(p)}
                                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                                    title="Delete product"
                                                                >
                                                                    <Trash2 className="size-3" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            /* View 2: Compact Card Grid View */
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {filteredProducts.map((p) => (
                                    <Card
                                        key={p.id}
                                        className="border-border/80 bg-card overflow-hidden shadow-2xs hover:border-primary/50 transition-all flex flex-col group"
                                    >
                                        {/* Product Image: 100% Full Visibility without cropping */}
                                        <div className="relative h-32 w-full bg-muted/30 overflow-hidden flex items-center justify-center p-2 border-b border-border/40">
                                            <img
                                                src={p.image_url}
                                                alt={p.name}
                                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <Badge className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-semibold border-0 px-1.5 py-0">
                                                {p.category}
                                            </Badge>
                                            {p.is_available ? (
                                                <Badge className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[9px] font-semibold border-0 px-1.5 py-0">
                                                    IN STOCK
                                                </Badge>
                                            ) : (
                                                <Badge className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-semibold border-0 px-1.5 py-0">
                                                    OUT
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="p-2 flex-1 flex flex-col justify-between gap-1">
                                            <div className="space-y-0.5">
                                                <span className="text-[9px] font-mono text-muted-foreground uppercase block leading-none">
                                                    SKU: {p.retailer_id}
                                                </span>
                                                <h3 className="text-xs font-bold text-foreground line-clamp-1 leading-tight" title={p.name}>
                                                    {p.name}
                                                </h3>
                                                {p.description ? (
                                                    <p className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                                                        {p.description}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="pt-1.5 border-t border-border/60 flex items-center justify-between mt-auto">
                                                <div className="text-xs font-bold text-foreground">
                                                    ₹{Number(p.price).toLocaleString('en-IN')}
                                                </div>

                                                <div className="flex items-center gap-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedProductForSend(p);
                                                            setIsSendProductModalOpen(true);
                                                        }}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                        title="Send to WhatsApp"
                                                    >
                                                        <Send className="size-3" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedProductForPreview(p);
                                                            setIsPreviewModalOpen(true);
                                                        }}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                        title="Preview in WhatsApp"
                                                    >
                                                        <Eye className="size-3" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeletingProduct(p)}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        title="Delete product"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ================= TAB 2: ORDERS ================= */}
                    <TabsContent value="orders" className="space-y-3">
                        <Card className="border-border/80 bg-card overflow-hidden shadow-2xs">
                            <CardHeader className="py-2.5 px-3.5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                                        <ShoppingBag className="size-3.5 text-primary" />
                                        WhatsApp Cart Orders
                                    </CardTitle>
                                    <CardDescription className="text-[11px]">
                                        Orders received from customer chat cart submissions.
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSimulateOrder}
                                    disabled={isSimulatingOrder}
                                    className="h-7 gap-1.5 text-xs border-dashed text-primary border-primary/40 hover:bg-primary/10"
                                >
                                    <Sparkles className="size-3" />
                                    {isSimulatingOrder ? 'Receiving...' : 'Test WhatsApp Order'}
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase text-[10px] font-semibold">
                                            <tr>
                                                <th className="px-3 py-2">Order ID</th>
                                                <th className="px-3 py-2">Customer</th>
                                                <th className="px-3 py-2">Items Ordered</th>
                                                <th className="px-3 py-2">Total Amount</th>
                                                <th className="px-3 py-2">Order Status</th>
                                                <th className="px-3 py-2 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-10 px-4">
                                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-1.5">
                                                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                                                                <ShoppingBag className="size-5" />
                                                            </div>
                                                            <h4 className="text-xs font-bold text-foreground">No WhatsApp Cart Orders Yet</h4>
                                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                When a customer browses your catalog on WhatsApp and taps <strong>&quot;Send cart to business&quot;</strong>, their order will appear here in real-time.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                orders.map((o) => (
                                                    <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-3 py-2 font-mono font-semibold text-foreground text-xs">
                                                        {o.order_number}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="font-semibold text-foreground text-xs">{o.customer_name || 'Customer'}</div>
                                                        <span className="font-mono text-muted-foreground text-[10px]">{o.customer_phone}</span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="space-y-0.5">
                                                            {o.items?.map((it, idx) => (
                                                                <div key={idx} className="text-[11px] text-foreground/90">
                                                                    {it.qty}x {it.name} <span className="text-muted-foreground">(@₹{it.price})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 font-bold text-foreground text-xs">
                                                        ₹{Number(o.total_amount).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            value={o.status}
                                                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                                                            className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border focus:outline-none ${
                                                                o.status === 'paid'
                                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                                                    : o.status === 'shipped'
                                                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
                                                                    : o.status === 'delivered'
                                                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300'
                                                                    : o.status === 'cancelled'
                                                                    ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                                                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                                            }`}
                                                        >
                                                            <option value="pending">Pending Payment</option>
                                                            <option value="paid">Paid &amp; Confirmed</option>
                                                            <option value="shipped">Shipped</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="h-7 text-xs text-primary hover:text-primary/80 gap-1 px-2"
                                                        >
                                                            <Link href={`/inbox?phone=${encodeURIComponent(o.customer_phone)}`}>
                                                                <MessageSquare className="size-3" />
                                                                Chat
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ================= TAB 3: CHAT STORE PREVIEW ================= */}
                    <TabsContent value="preview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* Left: Explanation */}
                            <div className="md:col-span-6 space-y-4">
                                <Card className="border-border/80 bg-card p-5 rounded-xl shadow-xs">
                                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                        <Store className="size-4 text-primary" />
                                        Native WhatsApp In-Chat Storefront
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Meta Cloud API allows businesses to send <strong>Single Product Messages</strong> or <strong>Multi-Product Catalog Messages</strong> directly to any customer. 
                                        When customers click &quot;View items&quot;, a full native catalog opens inside WhatsApp without loading an external browser.
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-border/70 space-y-2">
                                        <h4 className="text-xs font-bold text-foreground">How WhatsApp Commerce Works:</h4>
                                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                                            <li>You send a Catalog or Product message to the customer.</li>
                                            <li>Customer views images, description, and price in ₹ (INR).</li>
                                            <li>Customer taps <strong>&quot;Add to Cart&quot;</strong> and chooses quantity.</li>
                                            <li>Customer taps <strong>&quot;Send Cart to Business&quot;</strong>.</li>
                                            <li>Order appears immediately in your Orders tab and Shared Inbox!</li>
                                        </ol>
                                    </div>
                                </Card>
                            </div>

                            {/* Right: Realistic WhatsApp Mobile Phone Simulation */}
                            <div className="md:col-span-6 flex justify-center">
                                <div className="w-[320px] rounded-[36px] border-4 border-neutral-800 bg-neutral-900 p-3 shadow-2xl shadow-black/40">
                                    {/* Phone Screen Header */}
                                    <div className="rounded-[28px] overflow-hidden bg-[#0b141a] text-white text-xs">
                                        <div className="bg-[#202c33] p-3 flex items-center gap-2.5 border-b border-neutral-700">
                                            <div className="size-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold">
                                                D
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-white">DukanHisab Store</div>
                                                <div className="text-[10px] text-emerald-400">Official Business Account</div>
                                            </div>
                                        </div>

                                        {/* WhatsApp Chat Area */}
                                        <div className="p-3 bg-[#0b141a] min-h-[380px] space-y-3 flex flex-col justify-end">
                                            {/* Incoming Product Card Message */}
                                            <div className="bg-[#1f2c34] rounded-2xl overflow-hidden max-w-[260px] border border-neutral-700 shadow-md">
                                                {selectedProductForPreview && (
                                                    <>
                                                        <img
                                                            src={selectedProductForPreview.image_url}
                                                            alt={selectedProductForPreview.name}
                                                            className="w-full h-32 object-contain p-1 bg-black/20"
                                                        />
                                                        <div className="p-3 space-y-1">
                                                            <div className="text-[10px] text-emerald-400 font-mono">
                                                                SKU: {selectedProductForPreview.retailer_id}
                                                            </div>
                                                            <div className="text-xs font-bold text-white">
                                                                {selectedProductForPreview.name}
                                                            </div>
                                                            <div className="text-sm font-bold text-emerald-400">
                                                                ₹{Number(selectedProductForPreview.price).toLocaleString('en-IN')}
                                                            </div>
                                                            <p className="text-[10px] text-neutral-300 line-clamp-2">
                                                                {selectedProductForPreview.description}
                                                            </p>
                                                        </div>
                                                        <div className="border-t border-neutral-700 bg-[#111b21] p-2 text-center text-emerald-400 font-bold text-[11px] cursor-pointer hover:bg-[#182229]">
                                                            View in Catalog / Add to Cart
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Customer Cart Simulation Message */}
                                            <div className="bg-[#005c4b] self-end rounded-2xl p-2.5 max-w-[220px] text-white text-[11px] space-y-1">
                                                <div className="font-bold flex items-center justify-between text-[10px] text-emerald-200">
                                                    <span>🛒 CART (1 Item)</span>
                                                    <span>₹{Number(selectedProductForPreview?.price || 799).toLocaleString('en-IN')}</span>
                                                </div>
                                                <p className="text-[10px]">
                                                    1x {selectedProductForPreview?.name || 'Classic Polo T-Shirt'}
                                                </p>
                                                <div className="text-[9px] text-emerald-200 text-right">Just now ✓✓</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= TAB 4: SETTINGS ================= */}
                    <TabsContent value="settings" className="space-y-4">
                        <Card className="border-border/80 bg-card p-6 rounded-xl shadow-xs max-w-2xl space-y-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Sliders className="size-4 text-primary" />
                                Meta Commerce Manager Configuration
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Configure your Meta Commerce Catalog ID to enable product syncing and WhatsApp native cart submissions.
                            </CardDescription>

                            <div className="space-y-3 pt-2">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Meta Catalog ID</Label>
                                    <Input
                                        defaultValue={catalogMeta.catalog_id}
                                        readOnly
                                        className="h-9 text-xs font-mono bg-muted/40"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Found in Facebook Business Manager &gt; Commerce Manager &gt; Catalogs.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Catalog Currency</Label>
                                    <Input defaultValue="INR (₹ Indian Rupee)" readOnly className="h-9 text-xs bg-muted/40" />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Default Channel for Catalog</Label>
                                    <select className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium w-full">
                                        {channels.map((ch) => (
                                            <option key={ch.id} value={ch.id}>
                                                {ch.name} ({ch.phone_number})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* 4. Add Product Modal - Ultra-Compact & Without Scroll */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogContent className="sm:max-w-xl p-4 gap-2.5 overflow-hidden max-h-[90vh]">
                        <DialogHeader className="pb-2 border-b border-border/60">
                            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                                <Plus className="size-4 text-primary" />
                                Add Product to WhatsApp Catalog
                            </DialogTitle>
                            <DialogDescription className="text-[11px] text-muted-foreground">
                                Item will sync with Meta Commerce Catalog for customer chat browsing.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateProduct} className="space-y-2.5 pt-0.5">
                            <div className="grid grid-cols-2 gap-3 items-start">
                                {/* Left Column: Details */}
                                <div className="space-y-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-[11px] font-semibold text-foreground">Product Name *</Label>
                                        <Input
                                            required
                                            placeholder="e.g. Cotton Polo T-Shirt"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="h-7.5 text-xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <Label className="text-[11px] font-semibold text-foreground">Price (₹ INR) *</Label>
                                            <Input
                                                type="number"
                                                required
                                                min="0"
                                                step="0.01"
                                                placeholder="799"
                                                value={form.price}
                                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                                className="h-7.5 text-xs font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label className="text-[11px] font-semibold text-foreground">Category</Label>
                                            <Input
                                                placeholder="Apparel, etc."
                                                value={form.category}
                                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                                className="h-7.5 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-0.5">
                                        <Label className="text-[11px] font-semibold text-foreground">SKU / Retailer ID (Optional)</Label>
                                        <Input
                                            placeholder="TSHIRT-BLK-01"
                                            value={form.retailer_id}
                                            onChange={(e) => setForm({ ...form, retailer_id: e.target.value })}
                                            className="h-7.5 text-xs font-mono"
                                        />
                                    </div>

                                    <div className="space-y-0.5">
                                        <Label className="text-[11px] font-semibold text-foreground">Description</Label>
                                        <textarea
                                            rows={2}
                                            placeholder="Short description for customers..."
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            className="w-full h-12 rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Image Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                                            <ImageIcon className="size-3.5 text-primary" />
                                            Product Image
                                        </Label>
                                        <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-md text-[10px]">
                                            <button
                                                type="button"
                                                onClick={() => setImageMode('upload')}
                                                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                                                    imageMode === 'upload'
                                                        ? 'bg-card text-foreground shadow-xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                📁 File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setImageMode('url')}
                                                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                                                    imageMode === 'url'
                                                        ? 'bg-card text-foreground shadow-xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                🔗 URL
                                            </button>
                                        </div>
                                    </div>

                                    {imageMode === 'upload' ? (
                                        <div>
                                            {imagePreview ? (
                                                <div className="rounded-xl border border-border p-2 bg-muted/20 flex flex-col items-center justify-center gap-1.5 h-36">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="size-16 rounded-md object-cover border border-border shadow-xs"
                                                    />
                                                    <div className="text-center w-full truncate">
                                                        <p className="text-[11px] font-semibold text-foreground truncate px-1">
                                                            {imageFile?.name || 'Selected Image'}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground">
                                                            {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Ready to upload'}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleRemoveImage}
                                                        className="h-5 px-1.5 text-[10px] text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <X className="size-2.5 mr-1" />
                                                        Change
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <input
                                                        type="file"
                                                        id="product-file-upload"
                                                        accept="image/*"
                                                        onChange={handleImageFileChange}
                                                        className="hidden"
                                                    />
                                                    <label
                                                        htmlFor="product-file-upload"
                                                        className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary rounded-xl p-2 text-center cursor-pointer bg-muted/15 hover:bg-muted/30 transition-all group h-36"
                                                    >
                                                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-1">
                                                            <Upload className="size-3.5" />
                                                        </div>
                                                        <p className="text-[11px] font-semibold text-foreground">
                                                            Click to browse image
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground mt-0.5">
                                                            JPG, PNG, WEBP up to 10MB
                                                        </p>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <Input
                                                type="url"
                                                placeholder="https://example.com/image.jpg"
                                                value={form.image_url}
                                                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                                className="h-7.5 text-xs"
                                            />
                                            {form.image_url ? (
                                                <div className="size-24 mx-auto rounded-lg overflow-hidden border border-border">
                                                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="h-24 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">
                                                    Enter image URL above
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="h-7.5 px-3 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-7.5 text-xs font-semibold px-4 shadow-sm shadow-primary/20"
                                >
                                    Save &amp; Sync to Catalog
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 5. WhatsApp Product Preview Modal - Compact & Native */}
                <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                    <DialogContent className="sm:max-w-[320px] p-0 overflow-hidden border-border/80 shadow-2xl rounded-2xl gap-0">
                        {/* WhatsApp Brand Header */}
                        <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                    <ShoppingBag className="size-3.5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold leading-tight text-white">WhatsApp Preview</h4>
                                    <span className="text-[10px] text-emerald-200">Catalog Product Card</span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsPreviewModalOpen(false)}
                                className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>

                        {selectedProductForPreview && (
                            <div className="p-3 bg-[#e5ddd5] dark:bg-[#0b141a] flex flex-col items-center">
                                {/* Single WhatsApp Message Card */}
                                <div className="w-full max-w-[270px] bg-white dark:bg-[#1f2c34] rounded-xl overflow-hidden shadow-md border border-black/5 dark:border-neutral-700">
                                    {/* Product Image */}
                                    <div className="relative h-32 w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                                        <img
                                            src={selectedProductForPreview.image_url}
                                            alt={selectedProductForPreview.name}
                                            className="w-full h-full object-contain p-1"
                                        />
                                        <Badge className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[9px] px-1.5 py-0 h-4 border-0">
                                            {selectedProductForPreview.category}
                                        </Badge>
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-2.5 space-y-1">
                                        <div className="text-[9px] font-mono text-muted-foreground uppercase">
                                            SKU: {selectedProductForPreview.retailer_id}
                                        </div>
                                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                                            {selectedProductForPreview.name}
                                        </h4>
                                        <div className="text-sm font-bold text-[#008069] dark:text-[#25D366]">
                                            ₹{Number(selectedProductForPreview.price).toLocaleString('en-IN')}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
                                            {selectedProductForPreview.description}
                                        </p>
                                    </div>

                                    {/* In-Chat Action Button */}
                                    <div className="border-t border-border/60 bg-muted/30 p-2 text-center text-xs font-bold text-[#008069] dark:text-[#25D366] flex items-center justify-center gap-1.5">
                                        <ShoppingBag className="size-3" />
                                        View in Catalog
                                    </div>

                                    {/* Message Timestamp */}
                                    <div className="text-[9px] text-muted-foreground text-right pr-2 pb-1">
                                        Just now ✓✓
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Minimal Footer */}
                        <div className="bg-card px-3 py-2 flex items-center justify-between border-t border-border/60 text-xs">
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[170px]">
                                ID: {catalogMeta.catalog_id}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPreviewModalOpen(false)}
                                className="h-6.5 px-2.5 text-[11px]"
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* 6. Delete Product Confirmation Dialog Modal */}
                <Dialog
                    open={!!deletingProduct}
                    onOpenChange={(open) => {
                        if (!open && !isDeleting) setDeletingProduct(null);
                    }}
                >
                    <DialogContent className="sm:max-w-[360px] p-5">
                        <DialogHeader className="items-center text-center">
                            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 mb-2 text-red-600">
                                <Trash2 className="size-5" />
                            </div>
                            <DialogTitle className="text-sm font-bold text-foreground">
                                Delete Catalog Product?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground pt-1 text-center">
                                Are you sure you want to remove <span className="font-semibold text-foreground">&quot;{deletingProduct?.name}&quot;</span> from your WhatsApp Commerce Catalog?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex items-center gap-2 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isDeleting}
                                onClick={() => setDeletingProduct(null)}
                                className="flex-1 h-8 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs"
                            >
                                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* 7. Send Catalog to Customer Modal */}
                <Dialog open={isSendCatalogModalOpen} onOpenChange={setIsSendCatalogModalOpen}>
                    <DialogContent className="sm:max-w-md p-5 overflow-hidden">
                        <DialogHeader className="pb-2 border-b border-border/60">
                            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <Send className="size-4 text-primary" />
                                Send Full Catalog to WhatsApp Customer
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Sends an official WhatsApp Interactive Catalog message. Customer can tap &quot;View catalog&quot; and send items to cart.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSendCatalog} className="space-y-3.5 pt-1">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-foreground">Customer Phone Number (with Country Code) *</Label>
                                <Input
                                    required
                                    type="tel"
                                    placeholder="+91 98981 23456"
                                    value={catalogPhone}
                                    onChange={(e) => setCatalogPhone(e.target.value)}
                                    className="h-9 text-xs font-mono"
                                />
                                <span className="text-[10px] text-muted-foreground">Example: +919898123456</span>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-foreground">Message Note</Label>
                                <textarea
                                    rows={2}
                                    value={catalogNote}
                                    onChange={(e) => setCatalogNote(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                />
                            </div>

                            <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                                    <ShoppingBag className="size-3.5 text-primary" />
                                    Active Catalog: {catalogMeta.catalog_id}
                                </div>
                                <p className="text-[11px]">
                                    Customer will receive a message with an interactive &quot;View items&quot; button opening your store inside WhatsApp.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSendCatalogModalOpen(false)}
                                    className="h-8 px-3 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSendingCatalog}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-semibold px-4 shadow-sm shadow-primary/20"
                                >
                                    <Send className="size-3 mr-1.5" />
                                    {isSendingCatalog ? 'Sending...' : 'Send Catalog Now'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 8. Send Single Product to Customer Modal */}
                <Dialog open={isSendProductModalOpen} onOpenChange={setIsSendProductModalOpen}>
                    <DialogContent className="sm:max-w-md p-5 overflow-hidden">
                        <DialogHeader className="pb-2 border-b border-border/60">
                            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <Send className="size-4 text-blue-600" />
                                Send Product to WhatsApp Customer
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Sends this single product card directly into the customer&apos;s WhatsApp chat.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedProductForSend && (
                            <form onSubmit={handleSendProduct} className="space-y-3.5 pt-1">
                                {/* Selected Product preview bar */}
                                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/20">
                                    <img
                                        src={selectedProductForSend.image_url}
                                        alt={selectedProductForSend.name}
                                        className="size-12 rounded-lg object-cover border border-border shadow-xs"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-foreground truncate">{selectedProductForSend.name}</h4>
                                        <div className="text-xs font-semibold text-primary">
                                            ₹{Number(selectedProductForSend.price).toLocaleString('en-IN')}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono">SKU: {selectedProductForSend.retailer_id}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-foreground">Customer Phone Number *</Label>
                                    <Input
                                        required
                                        type="tel"
                                        placeholder="+91 98981 23456"
                                        value={productPhone}
                                        onChange={(e) => setProductPhone(e.target.value)}
                                        className="h-9 text-xs font-mono"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsSendProductModalOpen(false)}
                                        className="h-8 px-3 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSendingProduct}
                                        className="bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs font-semibold px-4 shadow-sm"
                                    >
                                        <Send className="size-3 mr-1.5" />
                                        {isSendingProduct ? 'Sending...' : 'Send Product to WhatsApp'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
