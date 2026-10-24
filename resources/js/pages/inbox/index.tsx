import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    MessageSquare,
    Search,
    User,
    Clock,
    Send,
    Bot,
    Phone,
    Check,
    CheckCheck,
    Tag,
    AlertCircle,
    ArrowLeft,
    Filter,
    ChevronDown,
    ChevronRight,
    Plus,
    Archive,
    CheckCircle2,
    Smile,
    Paperclip,
    MoreVertical,
    Sparkles,
    FileText,
    ExternalLink,
    Pencil,
    Copy,
    Info,
    Briefcase,
    Image as ImageIcon,
    X,
    Zap,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STAGE_CONFIG: Record<string, { label: string; badge: string; icon: string; desc: string }> = {
    New: { label: 'New Lead', badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30', icon: '🎯', desc: 'Fresh inquiry / new contact' },
    Qualified: { label: 'Qualified', badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30', icon: '⚡', desc: 'High interest, verified requirement' },
    Proposal: { label: 'Proposal Sent', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30', icon: '📑', desc: 'Pricing or quotation shared' },
    Won: { label: 'Deal Won', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', icon: '🏆', desc: 'Payment made / deal closed' },
    Lost: { label: 'Deal Lost', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30', icon: '❌', desc: 'Dropped or not interested' },
};

const EMOJI_GROUPS = [
    { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '🤗', '🤔', '🤐', '🤫', '🤭', '🥱'] },
    { name: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '👌', '🙏', '💪', '👋', '🎉', '🔥', '✨', '⭐', '💯', '🚀', '🎯', '📍', '💡', '✅', '❌', '⚠️', '🚨'] },
    { name: 'Hearts', emojis: ['❤️', '💚', '💙', '💜', '🤍', '🧡', '💛', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
    { name: 'Business', emojis: ['💼', '📁', '📄', '📊', '📈', '💰', '💵', '💳', '🏷️', '📦', '📞', '💬', '🔔', '📌', '🗓️', '⏰', '🛒', '🎓', '🏥', '🏢', '💻', '📱', '✉️', '📧'] },
];

const CANNED_RESPONSES = [
    { title: '👋 Welcome Greeting', text: 'Hello! Thank you for connecting with us. How can we help you today? 😊' },
    { title: '📄 Information Details', text: 'Here are the details and information you requested.' },
    { title: '💳 Payment Details', text: 'You can make the payment via UPI or Net Banking. Please share the transaction receipt once done!' },
    { title: '✅ Query Solved', text: 'Thank you for connecting with us! Please let us know if you need any further assistance.' },
];

type ChatMessage = {
    id: string;
    sender: 'contact' | 'agent' | 'bot';
    text: string;
    time: string;
    status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
    attachment?: {
        name: string;
        size?: string;
        type: 'image' | 'document';
        url?: string;
    };
};

type ChatThread = {
    id: string;
    contactName: string;
    phone: string;
    channel: string; // e.g. "DukanHisab"
    lastMessage: string;
    time: string;
    unread: number;
    windowRemaining: string;
    stage: 'New' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
    label: 'Prospect' | 'Applicant' | 'Enrolled';
    status: 'open' | 'bot_handled' | 'resolved';
};

interface TeamInboxProps {
    initialThreads?: any[];
    channels?: any[];
}

export default function TeamInbox({ initialThreads = [], channels = [] }: TeamInboxProps) {
    const [threads, setThreads] = useState<ChatThread[]>(initialThreads);

    const initialMsgMap: Record<string, ChatMessage[]> = {};
    if (initialThreads.length > 0) {
        initialThreads.forEach((t) => {
            if (t.messages && t.messages.length > 0) {
                initialMsgMap[t.id] = t.messages;
            }
        });
    }

    const [selectedThread, setSelectedThread] = useState<ChatThread | null>(initialThreads[0] || null);
    const [selectedHistoryFilter, setSelectedHistoryFilter] = useState('All');
    const [selectedChannelFilter, setSelectedChannelFilter] = useState('All channels');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(initialMsgMap);
    const [replyText, setReplyText] = useState('');

    // Emoji, Attachment and Canned state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [selectedEmojiGroup, setSelectedEmojiGroup] = useState(0);
    const [attachedFile, setAttachedFile] = useState<{
        name: string;
        size: string;
        type: 'image' | 'document';
        url?: string;
        rawFile?: File;
    } | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);
    const replyInputRef = useRef<HTMLInputElement>(null);

    // Contact Edit Modal state
    const [showEditContactDialog, setShowEditContactDialog] = useState(false);
    const [editContactName, setEditContactName] = useState('');
    const [editContactStatus, setEditContactStatus] = useState<'open' | 'resolved'>('open');
    const [editContactStage, setEditContactStage] = useState<'New' | 'Qualified' | 'Proposal' | 'Won' | 'Lost'>('New');
    const [editContactLabel, setEditContactLabel] = useState<'Prospect' | 'Applicant' | 'Enrolled'>('Prospect');
    const [isSavingContact, setIsSavingContact] = useState(false);
    const [saveNotice, setSaveNotice] = useState<string | null>(null);
    const [copiedPhone, setCopiedPhone] = useState(false);

    // Start New Conversation state
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);
    const [newChatPhone, setNewChatPhone] = useState('');
    const [newChatName, setNewChatName] = useState('');
    const [newChatMsgType, setNewChatMsgType] = useState<'template' | 'text'>('template');
    const [newChatTemplate, setNewChatTemplate] = useState('due_reminder_en');
    const [newChatMessage, setNewChatMessage] = useState('Hello! Welcome to our WhatsApp service.');
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [newChatStatus, setNewChatStatus] = useState<{ success: boolean; message: string } | null>(null);

    // Sync state when initialThreads prop changes (e.g. on workspace switch)
    useEffect(() => {
        setThreads(initialThreads);
        if (initialThreads.length > 0) {
            setSelectedThread((prev) => {
                if (!prev) return initialThreads[0];
                const found = initialThreads.find((t) => t.id === prev.id);
                return found || initialThreads[0];
            });
            const updatedMsgMap: Record<string, ChatMessage[]> = {};
            initialThreads.forEach((t) => {
                if (t.messages && t.messages.length > 0) {
                    updatedMsgMap[t.id] = t.messages;
                }
            });
            setMessages((prev) => ({ ...prev, ...updatedMsgMap }));
        } else {
            setSelectedThread(null);
        }
    }, [initialThreads]);

    // Live background polling every 4 seconds to sync incoming WhatsApp messages
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/inbox/sync');
                const data = await res.json();
                if (data.success && Array.isArray(data.threads)) {
                    setThreads(data.threads);

                    setSelectedThread((prev) => {
                        if (!prev) return data.threads[0] || null;
                        const match = data.threads.find((t: ChatThread) => t.id === prev.id);
                        return match || (data.threads.length > 0 ? data.threads[0] : null);
                    });

                    // Update message map for threads that changed
                    data.threads.forEach((remoteThread: any) => {
                        if (remoteThread.messages) {
                            setMessages((prevMsgs) => ({
                                ...prevMsgs,
                                [remoteThread.id]: remoteThread.messages,
                            }));
                        }
                    });
                }
            } catch (e) {
                // Ignore silent sync errors
            }
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const handleOpenEditContact = () => {
        if (!selectedThread) return;
        setEditContactName(selectedThread.contactName === selectedThread.phone ? '' : selectedThread.contactName);
        setEditContactStatus(selectedThread.status === 'resolved' ? 'resolved' : 'open');
        setEditContactStage(selectedThread.stage || 'New');
        setEditContactLabel(selectedThread.label || 'Prospect');
        setSaveNotice(null);
        setShowEditContactDialog(true);
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedThread) return;

        const newName = editContactName.trim() || selectedThread.phone;
        setIsSavingContact(true);
        setSaveNotice(null);

        // Update local state immediately
        setSelectedThread((prev) =>
            prev
                ? {
                      ...prev,
                      contactName: newName,
                      status: editContactStatus,
                      stage: editContactStage,
                      label: editContactLabel,
                  }
                : null
        );

        setThreads((prev) =>
            prev.map((t) =>
                t.id === selectedThread.id
                    ? {
                          ...t,
                          contactName: newName,
                          status: editContactStatus,
                          stage: editContactStage,
                          label: editContactLabel,
                      }
                    : t
            )
        );

        if (!selectedThread.id.startsWith('mock-')) {
            try {
                const res = await fetch('/inbox/update-contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                    body: JSON.stringify({
                        conversation_id: selectedThread.id,
                        contact_name: newName,
                        status: editContactStatus,
                        pipeline_stage: editContactStage,
                        label: editContactLabel,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setSaveNotice('Contact and pipeline updated successfully!');
                    setTimeout(() => setShowEditContactDialog(false), 500);
                } else {
                    setSaveNotice(data.message || 'Could not update contact');
                }
            } catch (err: any) {
                setSaveNotice(err.message || 'Network error saving contact');
            } finally {
                setIsSavingContact(false);
            }
        } else {
            setSaveNotice('Updated local contact!');
            setTimeout(() => setShowEditContactDialog(false), 500);
            setIsSavingContact(false);
        }
    };

    const handleToggleResolve = async (newStatus: 'open' | 'resolved') => {
        if (!selectedThread) return;

        setSelectedThread((prev) => (prev ? { ...prev, status: newStatus } : null));
        setThreads((prev) => prev.map((t) => (t.id === selectedThread.id ? { ...t, status: newStatus } : t)));

        if (!selectedThread.id.startsWith('mock-')) {
            try {
                await fetch('/inbox/update-contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                    body: JSON.stringify({
                        conversation_id: selectedThread.id,
                        contact_name: selectedThread.contactName,
                        status: newStatus,
                    }),
                });
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleCopyPhone = (phone: string) => {
        navigator.clipboard?.writeText(phone);
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
    };

    const handleStartNewChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChatPhone.trim()) return;
        setIsStartingChat(true);
        setNewChatStatus(null);

        try {
            const res = await fetch('/inbox/new-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    phone: newChatPhone,
                    name: newChatName,
                    type: newChatMsgType,
                    template_name: newChatTemplate,
                    message: newChatMessage,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setNewChatStatus({ success: true, message: data.message });
                setTimeout(() => {
                    setShowNewChatDialog(false);
                    window.location.href = '/inbox';
                }, 800);
            } else {
                setNewChatStatus({ success: false, message: data.message || 'Could not start chat' });
            }
        } catch (err: any) {
            setNewChatStatus({ success: false, message: err.message || 'Network error' });
        } finally {
            setIsStartingChat(false);
        }
    };

    const handleInsertEmoji = (emoji: string) => {
        setReplyText((prev) => prev + emoji);
        replyInputRef.current?.focus();
    };

    const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            setAttachedFile({
                name: file.name,
                size: sizeFormatted,
                type: 'image',
                url,
                rawFile: file,
            });
            setShowAttachmentMenu(false);
            replyInputRef.current?.focus();
        }
    };

    const handleDocumentSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            setAttachedFile({
                name: file.name,
                size: sizeFormatted,
                type: 'document',
                url,
                rawFile: file,
            });
            setShowAttachmentMenu(false);
            replyInputRef.current?.focus();
        }
    };

    const handleSelectCanned = (text: string) => {
        setReplyText(text);
        setShowAttachmentMenu(false);
        setShowQuickReplies(false);
        replyInputRef.current?.focus();
    };

    const parseAttachmentFromMessage = (rawText: string, existingAttachment?: ChatMessage['attachment']) => {
        if (existingAttachment) {
            const ext = existingAttachment.name.split('.').pop()?.toLowerCase() || '';
            const isImg = existingAttachment.type === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
            return {
                hasAttachment: true,
                fileName: existingAttachment.name,
                fileType: isImg ? 'image' : (ext === 'pdf' ? 'pdf' : ['doc', 'docx'].includes(ext) ? 'doc' : ['xls', 'xlsx', 'csv'].includes(ext) ? 'sheet' : ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ? 'archive' : 'document'),
                caption: rawText && !rawText.includes(existingAttachment.name) ? rawText : '',
                url: existingAttachment.url,
                size: existingAttachment.size || (ext ? `${ext.toUpperCase()} File` : 'File'),
            };
        }

        if (!rawText || typeof rawText !== 'string') return null;
        const trimmed = rawText.trim();

        // 1. Starts with paperclip: 📎 <filename> [- optional caption]
        if (trimmed.startsWith('📎')) {
            const afterClip = trimmed.replace(/^📎\s*/, '').trim();
            // Check if there is an extension
            const extMatch = afterClip.match(/^([^\s\r\n]+\.[a-zA-Z0-9]{2,5})(?:\s*[-:]?\s*([\s\S]*))?$/);
            let fileName = '';
            let caption = '';
            if (extMatch) {
                fileName = extMatch[1].trim();
                caption = (extMatch[2] || '').trim();
            } else {
                const parts = afterClip.split(/\s*[-–]\s*/);
                fileName = parts[0].trim();
                caption = parts.slice(1).join(' - ').trim();
            }

            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
            return {
                hasAttachment: true,
                fileName,
                fileType: isImg ? 'image' : (ext === 'pdf' ? 'pdf' : ['doc', 'docx'].includes(ext) ? 'doc' : ['xls', 'xlsx', 'csv'].includes(ext) ? 'sheet' : ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ? 'archive' : 'document'),
                caption,
                url: undefined,
                size: ext ? `${ext.toUpperCase()} File` : 'Document',
            };
        }

        // 2. Bracket style: [filename.ext] caption
        if (trimmed.startsWith('[')) {
            const bracketMatch = trimmed.match(/^\[([^\s\]]+\.[a-zA-Z0-9]{2,5})\](?:\s*([\s\S]*))?$/);
            if (bracketMatch) {
                const fileName = bracketMatch[1].trim();
                const caption = (bracketMatch[2] || '').trim();
                const ext = fileName.split('.').pop()?.toLowerCase() || '';
                const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
                return {
                    hasAttachment: true,
                    fileName,
                    fileType: isImg ? 'image' : (ext === 'pdf' ? 'pdf' : ['doc', 'docx'].includes(ext) ? 'doc' : ['xls', 'xlsx', 'csv'].includes(ext) ? 'sheet' : ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ? 'archive' : 'document'),
                    caption,
                    url: undefined,
                    size: ext ? `${ext.toUpperCase()} File` : 'Document',
                };
            }
        }

        // 3. Standalone filename ending with document / media extension
        const standaloneMatch = trimmed.match(/^([a-zA-Z0-9_\-\.\(\)\s]+\.(pdf|docx?|xlsx?|csv|zip|rar|pptx?|webp|png|jpe?g|svg|txt))$/i);
        if (standaloneMatch) {
            const fileName = standaloneMatch[1].trim();
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
            return {
                hasAttachment: true,
                fileName,
                fileType: isImg ? 'image' : (ext === 'pdf' ? 'pdf' : ['doc', 'docx'].includes(ext) ? 'doc' : ['xls', 'xlsx', 'csv'].includes(ext) ? 'sheet' : ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ? 'archive' : 'document'),
                caption: '',
                url: undefined,
                size: ext ? `${ext.toUpperCase()} File` : 'Document',
            };
        }

        return null;
    };

    const handleDownloadAttachment = (fileName: string, fileUrl?: string) => {
        if (fileUrl) {
            const a = document.createElement('a');
            a.href = fileUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }

        // Fallback: create downloadable file blob
        const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
        let mime = 'application/octet-stream';
        if (ext === 'pdf') mime = 'application/pdf';
        else if (ext === 'csv') mime = 'text/csv';
        else if (ext === 'txt') mime = 'text/plain';
        else if (ext === 'webp') mime = 'image/webp';
        else if (ext === 'png') mime = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';

        const content = `%PDF-1.4\n% Sathwara InfoTech WhatsApp SaaS Document\n% Document Name: ${fileName}\n% Timestamp: ${new Date().toISOString()}\n% Sample / Synced Document downloaded from WhatsApp Inbox.`;
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!replyText.trim() && !attachedFile) || !selectedThread) return;

        const textToSend = replyText.trim();
        const currentAttachment = attachedFile;
        setReplyText('');
        setAttachedFile(null);
        setShowEmojiPicker(false);
        setShowAttachmentMenu(false);
        setShowQuickReplies(false);

        const fullMessageContent = currentAttachment
            ? (textToSend ? `[${currentAttachment.name}] ${textToSend}` : `📎 ${currentAttachment.name}`)
            : textToSend;

        const optimisticMsg: ChatMessage = {
            id: 'temp-' + Date.now(),
            sender: 'agent',
            text: fullMessageContent,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent', // Initially single gray tick
            attachment: currentAttachment || undefined,
        };

        setMessages((prev) => ({
            ...prev,
            [selectedThread.id]: [...(prev[selectedThread.id] || []), optimisticMsg],
        }));

        // Update last message in thread list
        setThreads((prev) =>
            prev.map((t) => (t.id === selectedThread.id ? { ...t, lastMessage: fullMessageContent, time: 'Just now' } : t))
        );

        if (!selectedThread.id.startsWith('mock-')) {
            try {
                let res: Response;
                const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

                if (currentAttachment?.rawFile) {
                    const formData = new FormData();
                    formData.append('conversation_id', selectedThread.id);
                    formData.append('message', textToSend);
                    formData.append('attachment', currentAttachment.rawFile);
                    formData.append('attachment_name', currentAttachment.name);
                    formData.append('attachment_type', currentAttachment.type);

                    res = await fetch('/inbox/reply', {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': csrf,
                        },
                        body: formData,
                    });
                } else {
                    res = await fetch('/inbox/reply', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrf,
                        },
                        body: JSON.stringify({
                            conversation_id: selectedThread.id,
                            message: fullMessageContent,
                        }),
                    });
                }
                const data = await res.json();
                if (data.success && data.message) {
                    setMessages((prev) => ({
                        ...prev,
                        [selectedThread.id]: (prev[selectedThread.id] || []).map((m) =>
                            m.id === optimisticMsg.id
                                ? { ...m, id: data.message.id, status: data.message.status || 'sent' }
                                : m
                        ),
                    }));
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const filteredThreads = threads.filter((t) => {
        if (selectedChannelFilter !== 'All channels' && t.channel !== selectedChannelFilter) {
            return false;
        }
        if (selectedStatusFilter === 'open' && t.status === 'resolved') {
            return false;
        }
        if (selectedStatusFilter === 'resolved' && t.status !== 'resolved') {
            return false;
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return t.contactName.toLowerCase().includes(q) || t.phone.includes(q) || t.lastMessage.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <>
            <Head title="Chat - Sathwara InfoTech | WhatsApp Business SaaS" />

            {/* Clean Modern 2-Column WhatsApp Chat Layout */}
            <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-background">
                {/* 1. Left Column: Conversation List */}
                <div className="w-full sm:w-80 md:w-96 shrink-0 border-r border-border/80 flex flex-col bg-card">
                    {/* Search & Header */}
                    <div className="p-3.5 border-b border-border/80 space-y-2.5 bg-card">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-foreground">Inbox</h2>
                                <Badge className="bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] text-[11px] font-semibold border-0 px-2 py-0.5">
                                    {filteredThreads.length}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="sm"
                                    onClick={() => setShowNewChatDialog(true)}
                                    className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold h-7 px-2.5 gap-1 rounded-full shadow-2xs"
                                    title="Start a new WhatsApp conversation with any phone number"
                                >
                                    <Plus className="size-3.5" />
                                    <span>New Chat</span>
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search customer, phone, or message..."
                                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#47b672]"
                            />
                        </div>

                        {/* Status Filter Tabs (All / Open / Resolved) */}
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 text-xs">
                            <button
                                type="button"
                                onClick={() => setSelectedStatusFilter('all')}
                                className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    selectedStatusFilter === 'all'
                                        ? 'bg-card text-foreground shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                All ({threads.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedStatusFilter('open')}
                                className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    selectedStatusFilter === 'open'
                                        ? 'bg-card text-[#28804c] dark:text-[#52c480] shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Open ({threads.filter((t) => t.status !== 'resolved').length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedStatusFilter('resolved')}
                                className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    selectedStatusFilter === 'resolved'
                                        ? 'bg-card text-muted-foreground shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Resolved ({threads.filter((t) => t.status === 'resolved').length})
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <select
                                value={selectedChannelFilter}
                                onChange={(e) => setSelectedChannelFilter(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                            >
                                <option>All channels</option>
                                {channels.length === 0 ? (
                                    <option>DukanHisab WhatsApp</option>
                                ) : (
                                    channels.map((ch: any) => (
                                        <option key={ch.id} value={ch.name}>
                                            {ch.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Chat Item List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                        {filteredThreads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
                                <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                                    <MessageSquare className="size-6 opacity-60" />
                                </div>
                                <h4 className="text-xs font-semibold text-foreground">No conversations yet</h4>
                                <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
                                    {searchQuery ? 'No chats match your search query.' : 'Click "New Chat" above to start a conversation.'}
                                </p>
                            </div>
                        ) : (
                            filteredThreads.map((thread) => {
                            const isSelected = selectedThread?.id === thread.id;
                            const isResolved = thread.status === 'resolved';
                            return (
                                <div
                                    key={thread.id}
                                    onClick={() => setSelectedThread(thread)}
                                    className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors relative ${
                                        isSelected
                                            ? 'bg-[#47b672]/10 border-l-4 border-l-[#47b672]'
                                            : 'hover:bg-muted/40'
                                    }`}
                                >
                                    {/* Avatar with Initials */}
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-bold text-xs border border-[#47b672]/20">
                                        {thread.contactName.slice(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate">
                                                    {thread.contactName}
                                                </span>
                                                {isResolved && (
                                                    <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-semibold text-muted-foreground shrink-0 border border-border/70">
                                                        Resolved
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                                {thread.time}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground font-semibold truncate max-w-[120px]">
                                                {thread.channel}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate flex-1 flex items-center gap-1">
                                                {thread.lastMessage.startsWith('📎') || thread.lastMessage.toLowerCase().endsWith('.pdf') ? (
                                                    <>
                                                        <FileText className="size-3 text-red-500 shrink-0 inline" />
                                                        <span className="truncate">{thread.lastMessage.replace(/^📎\s*/, '')}</span>
                                                    </>
                                                ) : (
                                                    thread.lastMessage
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                                24h Window: {thread.windowRemaining}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }))}
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="p-2.5 border-t border-border/80 flex items-center justify-between bg-card text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            <span className="truncate">Active WhatsApp Connected</span>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-[#28804c] dark:text-[#52c480]"
                            asChild
                        >
                            <Link href="/whatsapp/connect">Manage</Link>
                        </Button>
                    </div>
                </div>

                {/* 2. Right Column: Chat Conversation Thread OR Empty State */}
                <div className="flex-1 flex flex-col bg-muted/20 overflow-hidden">
                    {selectedThread ? (
                        /* Active Conversation View */
                        <div className="flex flex-col h-full">
                            {/* Thread Header with Contact Options - Clean Compact, No Scrollbars */}
                            <div className="min-h-13 border-b border-border/80 px-3.5 md:px-4 py-2 flex items-center justify-between bg-card shrink-0 gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-bold text-xs border border-[#47b672]/30">
                                        {selectedThread.contactName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                                            <h3 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[130px] sm:max-w-[200px] leading-tight">
                                                {selectedThread.contactName}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={handleOpenEditContact}
                                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
                                                title="Edit Contact Name & Pipeline"
                                            >
                                                <Pencil className="size-3" />
                                            </button>
                                            <span className="rounded bg-[#47b672]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#28804c] dark:text-[#52c480] whitespace-nowrap shrink-0">
                                                {selectedThread.channel}
                                            </span>
                                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold border inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                                                selectedThread.status === 'resolved'
                                                    ? 'bg-muted text-muted-foreground border-border/70'
                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                            }`}>
                                                <span className={`size-1.5 rounded-full ${selectedThread.status === 'resolved' ? 'bg-muted-foreground' : 'bg-emerald-500'}`} />
                                                {selectedThread.status === 'resolved' ? 'Resolved' : 'Open'}
                                            </span>
                                            {selectedThread.stage && (
                                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold border whitespace-nowrap shrink-0 ${
                                                    STAGE_CONFIG[selectedThread.stage]?.badge || 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {STAGE_CONFIG[selectedThread.stage]?.icon || '🎯'} {selectedThread.stage}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono leading-none">
                                            <span>{selectedThread.phone}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyPhone(selectedThread.phone)}
                                                className="hover:text-foreground text-muted-foreground p-0.5 transition-colors"
                                                title="Copy phone number"
                                            >
                                                <Copy className="size-2.5" />
                                            </button>
                                            {copiedPhone && <span className="text-[9px] text-emerald-600 font-semibold font-sans">Copied!</span>}
                                            <span>•</span>
                                            <span className="font-sans">Session Window:</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans">{selectedThread.windowRemaining}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Header Action Buttons */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Quick Mark Resolved / Reopen */}
                                    {selectedThread.status === 'resolved' ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggleResolve('open')}
                                            className="h-7 text-xs font-semibold gap-1 text-amber-700 dark:text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2 shadow-2xs"
                                            title="Reopen this resolved conversation"
                                        >
                                            <Archive className="size-3" />
                                            <span className="hidden sm:inline">Reopen</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggleResolve('resolved')}
                                            className="h-7 text-xs font-semibold gap-1 text-muted-foreground hover:text-emerald-700 hover:border-emerald-500/40 px-2.5 shadow-2xs"
                                            title="Mark conversation as resolved"
                                        >
                                            <CheckCircle2 className="size-3 text-emerald-600" />
                                            <span className="hidden sm:inline">Resolve</span>
                                        </Button>
                                    )}

                                    <Badge variant="outline" className="hidden lg:flex text-[10px] border-[#47b672]/40 text-[#28804c] dark:text-[#52c480] gap-1 py-0.5 px-2">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        24h Window
                                    </Badge>
                                </div>
                            </div>

                            {/* Message Feed */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
                                {(messages[selectedThread.id] || []).map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col max-w-[70%] ${
                                            msg.sender === 'agent'
                                                ? 'ml-auto items-end'
                                                : msg.sender === 'bot'
                                                ? 'mr-auto items-start'
                                                : 'mr-auto items-start'
                                        }`}
                                    >
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                                                msg.sender === 'agent'
                                                    ? 'bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef] rounded-tr-xs'
                                                    : msg.sender === 'bot'
                                                    ? 'bg-card text-foreground border border-purple-500/30 rounded-tl-xs'
                                                    : 'bg-card text-foreground border border-border rounded-tl-xs'
                                            }`}
                                        >
                                            {msg.sender === 'bot' && (
                                                <div className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-bold mb-1">
                                                    <Bot className="size-3" /> Auto-Bot Reply
                                                </div>
                                            )}

                                            {/* Render Rich WhatsApp Document Card or Plain Text */}
                                            {(() => {
                                                const parsedAttachment = parseAttachmentFromMessage(msg.text, msg.attachment);

                                                if (parsedAttachment) {
                                                    return (
                                                        <div className="space-y-1.5 min-w-[220px] max-w-[320px] sm:max-w-[360px]">
                                                            {/* Document Card */}
                                                            {parsedAttachment.fileType === 'image' && parsedAttachment.url ? (
                                                                <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-w-xs shadow-xs">
                                                                    <img
                                                                        src={parsedAttachment.url}
                                                                        alt={parsedAttachment.fileName}
                                                                        className="w-full max-h-56 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                        onClick={() => window.open(parsedAttachment.url, '_blank')}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    onClick={() => handleDownloadAttachment(parsedAttachment.fileName, parsedAttachment.url)}
                                                                    className={`group flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all ${
                                                                        msg.sender === 'agent'
                                                                            ? 'bg-[#128c7e]/10 dark:bg-black/25 hover:bg-[#128c7e]/15 border border-[#128c7e]/20'
                                                                            : 'bg-muted/70 hover:bg-muted border border-border/80'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                        {/* Format Badge */}
                                                                        <div
                                                                            className={`size-10 sm:size-11 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold shadow-xs border ${
                                                                                parsedAttachment.fileType === 'pdf'
                                                                                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                                                                                    : parsedAttachment.fileType === 'doc'
                                                                                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                                                                    : parsedAttachment.fileType === 'sheet'
                                                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                                                    : parsedAttachment.fileType === 'archive'
                                                                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                                                    : parsedAttachment.fileType === 'image'
                                                                                    ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30'
                                                                                    : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                                                                            }`}
                                                                        >
                                                                            {parsedAttachment.fileType === 'image' ? (
                                                                                <ImageIcon className="size-4 sm:size-4.5" />
                                                                            ) : (
                                                                                <FileText className="size-4 sm:size-4.5" />
                                                                            )}
                                                                            <span className="text-[9px] uppercase tracking-wider font-extrabold -mt-0.5">
                                                                                {parsedAttachment.fileName.split('.').pop() || 'DOC'}
                                                                            </span>
                                                                        </div>

                                                                        {/* File Name & Subtitle */}
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:underline">
                                                                                {parsedAttachment.fileName}
                                                                            </p>
                                                                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                                                                                <span className="font-semibold uppercase">{parsedAttachment.fileName.split('.').pop()}</span>
                                                                                <span>•</span>
                                                                                <span>{parsedAttachment.size || 'Document'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Download Circle Action */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDownloadAttachment(parsedAttachment.fileName, parsedAttachment.url);
                                                                        }}
                                                                        className="size-8 sm:size-8.5 rounded-full bg-background dark:bg-card border border-border/80 text-foreground/80 hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0 shadow-2xs hover:scale-105 active:scale-95 transition-transform"
                                                                        title={`Download ${parsedAttachment.fileName}`}
                                                                    >
                                                                        <Download className="size-3.5 sm:size-4" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Optional Caption Text */}
                                                            {parsedAttachment.caption && (
                                                                <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap px-1 pt-0.5">
                                                                    {parsedAttachment.caption}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                return msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>;
                                            })()}
                                            <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-1">
                                                <span>{msg.time}</span>
                                                {msg.sender === 'agent' && (
                                                    <span
                                                        className="inline-flex items-center ml-0.5"
                                                        title={
                                                            msg.status === 'read'
                                                                ? 'Read'
                                                                : msg.status === 'delivered'
                                                                ? 'Delivered'
                                                                : msg.status === 'failed'
                                                                ? 'Failed to send'
                                                                : 'Sent'
                                                        }
                                                    >
                                                        {msg.status === 'read' ? (
                                                            <CheckCheck className="size-3.5 text-[#53bdeb]" />
                                                        ) : msg.status === 'delivered' ? (
                                                            <CheckCheck className="size-3.5 text-muted-foreground/70" />
                                                        ) : msg.status === 'failed' ? (
                                                            <AlertCircle className="size-3.5 text-red-500" />
                                                        ) : (
                                                            <Check className="size-3.5 text-muted-foreground/70" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Hidden File Input Pickers */}
                            <input
                                type="file"
                                ref={imageInputRef}
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleImageSelected}
                            />
                            <input
                                type="file"
                                ref={documentInputRef}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                                className="hidden"
                                onChange={handleDocumentSelected}
                            />

                            {/* Message Reply Input Box with Interactive Popovers */}
                            <form onSubmit={handleSendReply} className="relative p-3 border-t border-border/80 bg-card shrink-0">
                                {/* 1. Attached File Preview Chip */}
                                {attachedFile && (
                                    <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-muted/60 border border-border/70 text-xs">
                                        <div className="flex items-center gap-2.5 truncate">
                                            {attachedFile.type === 'image' && attachedFile.url ? (
                                                <img
                                                    src={attachedFile.url}
                                                    alt="preview"
                                                    className="size-8 rounded-lg object-cover border border-border shrink-0"
                                                />
                                            ) : (
                                                <div className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                                    <FileText className="size-4" />
                                                </div>
                                            )}
                                            <div className="truncate">
                                                <p className="font-semibold text-foreground truncate">{attachedFile.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{attachedFile.size} • Ready to send</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setAttachedFile(null)}
                                            className="size-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            title="Remove attachment"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                )}

                                {/* 2. Interactive Emoji Picker Popover */}
                                {showEmojiPicker && (
                                    <div className="absolute bottom-16 left-3 z-50 w-72 sm:w-80 rounded-2xl border border-border bg-card p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 space-y-2">
                                        <div className="flex items-center justify-between border-b border-border/70 pb-2">
                                            <span className="text-xs font-bold text-foreground">Select Emoji</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowEmojiPicker(false)}
                                                className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Category Tabs */}
                                        <div className="flex items-center gap-1 border-b border-border/50 pb-1.5 text-xs">
                                            {EMOJI_GROUPS.map((grp, idx) => (
                                                <button
                                                    key={grp.name}
                                                    type="button"
                                                    onClick={() => setSelectedEmojiGroup(idx)}
                                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                                                        selectedEmojiGroup === idx
                                                            ? 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480]'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    {grp.name}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Emoji Grid */}
                                        <div className="grid grid-cols-6 sm:grid-cols-7 gap-1 p-1 max-h-48 overflow-y-auto">
                                            {EMOJI_GROUPS[selectedEmojiGroup].emojis.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => handleInsertEmoji(emoji)}
                                                    className="size-9 rounded-lg flex items-center justify-center text-xl hover:bg-muted transition-transform hover:scale-125"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Interactive Attachment Menu Popover */}
                                {showAttachmentMenu && (
                                    <div className="absolute bottom-16 left-10 z-50 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 space-y-1">
                                        <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-foreground border-b border-border/70 mb-1">
                                            <span>Attach Content</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowAttachmentMenu(false)}
                                                className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Option: Photos & Videos */}
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/70 text-left transition-colors"
                                        >
                                            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                                <ImageIcon className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-foreground">Photos & Media</p>
                                                <p className="text-[10px] text-muted-foreground">PNG, JPG, MP4, WebP</p>
                                            </div>
                                        </button>

                                        {/* Option: Document / PDF */}
                                        <button
                                            type="button"
                                            onClick={() => documentInputRef.current?.click()}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/70 text-left transition-colors"
                                        >
                                            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                                <FileText className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-foreground">Document & PDF</p>
                                                <p className="text-[10px] text-muted-foreground">PDF, DOC, XLS, ZIP</p>
                                            </div>
                                        </button>

                                        {/* Option: Canned Quick Responses */}
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/70 text-left transition-colors"
                                        >
                                            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                                <Zap className="size-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-foreground">Quick Responses</p>
                                                <p className="text-[10px] text-muted-foreground">Frequently used replies</p>
                                            </div>
                                            <ChevronRight className="size-3.5 text-muted-foreground" />
                                        </button>

                                        {/* Quick Replies Submenu */}
                                        {showQuickReplies && (
                                            <div className="p-1 space-y-1 bg-muted/40 rounded-xl border border-border/60 mt-1 max-h-40 overflow-y-auto">
                                                {CANNED_RESPONSES.map((cr) => (
                                                    <button
                                                        key={cr.title}
                                                        type="button"
                                                        onClick={() => handleSelectCanned(cr.text)}
                                                        className="w-full p-2 text-left rounded-lg hover:bg-card text-xs transition-colors space-y-0.5 border border-transparent hover:border-border/60"
                                                    >
                                                        <p className="font-semibold text-[11px] text-foreground">{cr.title}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{cr.text}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Main Input Row */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowEmojiPicker(!showEmojiPicker);
                                            setShowAttachmentMenu(false);
                                        }}
                                        className={`size-8 p-0 transition-colors ${
                                            showEmojiPicker
                                                ? 'bg-[#47b672]/20 text-[#28804c] dark:text-[#52c480]'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                        title="Insert emoji"
                                    >
                                        <Smile className="size-4" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowAttachmentMenu(!showAttachmentMenu);
                                            setShowEmojiPicker(false);
                                        }}
                                        className={`size-8 p-0 transition-colors ${
                                            showAttachmentMenu
                                                ? 'bg-[#47b672]/20 text-[#28804c] dark:text-[#52c480]'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                        title="Attach document, photo, or quick response"
                                    >
                                        <Paperclip className="size-4" />
                                    </Button>

                                    <input
                                        ref={replyInputRef}
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Type a WhatsApp reply to ${selectedThread.contactName}...`}
                                        className="flex-1 rounded-lg border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#47b672]"
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5 px-4 shadow-sm"
                                    >
                                        <Send className="size-3.5" />
                                        <span>Send</span>
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        /* Exact Empty State from Xobito Screenshot */
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center select-none">
                            {/* Graphic Illustration Matching Screenshot */}
                            <div className="relative mb-6">
                                <div className="size-48 rounded-3xl bg-card border border-border/70 p-5 shadow-sm flex flex-col justify-center space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-[#47b672]/15 flex items-center justify-center text-[#47b672]">
                                            <MessageSquare className="size-4" />
                                        </div>
                                        <div className="h-2.5 w-24 rounded-full bg-muted"></div>
                                        <div className="size-2 rounded-full bg-[#47b672] ml-auto"></div>
                                    </div>
                                    <div className="h-7 w-36 rounded-lg bg-muted/60 self-start"></div>
                                    <div className="h-7 w-40 rounded-lg bg-[#47b672] self-end flex items-center justify-end px-2">
                                        <CheckCheck className="size-3 text-white/80" />
                                    </div>
                                    <div className="flex items-center gap-1 self-start bg-muted/70 rounded-full px-2 py-1">
                                        <span className="size-1 rounded-full bg-muted-foreground animate-pulse"></span>
                                        <span className="size-1 rounded-full bg-muted-foreground animate-pulse delay-100"></span>
                                        <span className="size-1 rounded-full bg-muted-foreground animate-pulse delay-200"></span>
                                    </div>
                                </div>
                                <div className="absolute -top-2 -right-2 size-8 rounded-full bg-card border border-border shadow-xs flex items-center justify-center text-[#47b672]">
                                    <MessageSquare className="size-4" />
                                </div>
                                <div className="absolute -bottom-2 -left-2 size-8 rounded-full bg-card border border-border shadow-xs flex items-center justify-center text-amber-500">
                                    <Sparkles className="size-4" />
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-foreground">
                                Select a conversation
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
                                Choose a conversation from the list to view the thread, reply, and see the full contact context.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Start New Conversation Modal */}
            {showNewChatDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
                    <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-[#47b672]/15 flex items-center justify-center text-[#47b672]">
                                    <Plus className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Start New WhatsApp Conversation</h3>
                                    <p className="text-[11px] text-muted-foreground">Send a WhatsApp message directly to any phone number</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNewChatDialog(false)}
                                className="text-muted-foreground hover:text-foreground text-xs p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {newChatStatus && (
                            <div className={`p-2.5 rounded-lg text-xs ${
                                newChatStatus.success
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                            }`}>
                                {newChatStatus.message}
                            </div>
                        )}

                        <form onSubmit={handleStartNewChat} className="space-y-3.5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Recipient Mobile Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newChatPhone}
                                        onChange={(e) => setNewChatPhone(e.target.value)}
                                        placeholder="e.g. 919898096798"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono"
                                    />
                                    <span className="text-[10px] text-muted-foreground">Include country code (e.g. 91 for India)</span>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Contact Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={newChatName}
                                        onChange={(e) => setNewChatName(e.target.value)}
                                        placeholder="e.g. Rahul Patel"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                    />
                                    <span className="text-[10px] text-muted-foreground">Name saved in your contacts</span>
                                </div>
                            </div>

                            {/* Message Type Toggle */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold">Message Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewChatMsgType('template')}
                                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                            newChatMsgType === 'template'
                                                ? 'border-[#47b672] bg-[#47b672]/10 ring-1 ring-[#47b672]'
                                                : 'border-border bg-background hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="font-semibold text-foreground">⚡ Approved Template</div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Delivers anytime to any number</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewChatMsgType('text')}
                                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                            newChatMsgType === 'text'
                                                ? 'border-[#47b672] bg-[#47b672]/10 ring-1 ring-[#47b672]'
                                                : 'border-border bg-background hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="font-semibold text-foreground">💬 Custom Text</div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">If customer messaged in last 24h</p>
                                    </button>
                                </div>
                            </div>

                            {newChatMsgType === 'template' ? (
                                <div className="space-y-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                                    <label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                        Select Meta Approved Template *
                                    </label>
                                    <select
                                        value={newChatTemplate}
                                        onChange={(e) => setNewChatTemplate(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="due_reminder_en">due_reminder_en (Payment Due Reminder)</option>
                                        <option value="sale_invoice_en">sale_invoice_en (Sale Invoice Notification)</option>
                                        <option value="payment_received_en">payment_received_en (Payment Received Confirmation)</option>
                                        <option value="appointment_cancelled">appointment_cancelled (Alert Notification)</option>
                                    </select>
                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                        Pre-approved templates land directly on the user's phone to start the conversation.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Message Text *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={newChatMessage}
                                        onChange={(e) => setNewChatMessage(e.target.value)}
                                        placeholder="Type your WhatsApp message..."
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowNewChatDialog(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isStartingChat}
                                    className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5 px-4 shadow-sm"
                                >
                                    <Send className="size-3.5" />
                                    {isStartingChat ? 'Sending & Opening...' : '🚀 Start Chat & Send'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Contact & Conversation Modal - Fully Responsive & Explanatory */}
            {showEditContactDialog && selectedThread && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in-50">
                    <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5 bg-card shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-lg bg-[#47b672]/15 flex items-center justify-center text-[#47b672]">
                                    <Pencil className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Edit Contact & Pipeline</h3>
                                    <p className="text-[11px] text-muted-foreground">Manage customer details, conversation status & sales stage</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditContactDialog(false)}
                                className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-sm transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {saveNotice && (
                                <div className={`p-2.5 rounded-lg text-xs font-medium ${
                                    saveNotice.includes('successfully') || saveNotice.includes('Updated')
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                                }`}>
                                    {saveNotice}
                                </div>
                            )}

                            {/* Informational Guidance Box */}
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 text-[11px]">
                                    <Info className="size-3.5" />
                                    <span>Understanding Status vs Pipeline Stage:</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground leading-relaxed pt-1">
                                    <div className="bg-card/70 p-2 rounded-lg border border-border/50">
                                        <strong className="text-foreground block mb-0.5">🟢 Conversation Status (Support)</strong>
                                        ચેટ ચાલુ છે કે પૂરી થઈ ગઈ? <strong>Open</strong> = એજન્ટે જવાબ આપવાનો બાકી છે. <strong>Resolved</strong> = કસ્ટમરનો પ્રશ્ન સોલ્વ થઈ ગયો અને ચેટ આર્કાઇવ થશે.
                                    </div>
                                    <div className="bg-card/70 p-2 rounded-lg border border-border/50">
                                        <strong className="text-foreground block mb-0.5">🎯 Pipeline Stage (Sales CRM)</strong>
                                        ગ્રાહક ખરીદીના કયા તબક્કે છે? <strong>New Lead</strong> → <strong>Qualified</strong> → <strong>Proposal</strong> → <strong>Won (ડીલ પાકી)</strong> કે <strong>Lost</strong>.
                                    </div>
                                </div>
                            </div>

                            <form id="edit-contact-form" onSubmit={handleSaveContact} className="space-y-4">
                                {/* Contact Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Contact / Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editContactName}
                                        onChange={(e) => setEditContactName(e.target.value)}
                                        placeholder="Enter customer name (e.g. Tanvi Malaviya)..."
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/30 focus:border-[#47b672]"
                                    />
                                    <p className="text-[10px] text-muted-foreground">This name is shown across your shared team inbox and CRM directory.</p>
                                </div>

                                {/* Phone number (read-only) */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">WhatsApp Mobile Number</label>
                                    <div className="flex items-center justify-between rounded-lg border border-input bg-muted/40 px-3 py-2 text-xs font-mono text-muted-foreground">
                                        <span className="font-semibold text-foreground">{selectedThread.phone}</span>
                                        <span className="text-[10px] text-[#28804c] font-sans font-semibold bg-[#47b672]/15 px-2 py-0.5 rounded">
                                            WhatsApp
                                        </span>
                                    </div>
                                </div>

                                {/* Conversation Status Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Conversation Status (Inbox Queue)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditContactStatus('open')}
                                            className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-0.5 ${
                                                editContactStatus === 'open'
                                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                                            }`}
                                        >
                                            <div className="font-bold flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-emerald-500"></span>
                                                Open (Active)
                                            </div>
                                            <span className="text-[10px] opacity-80">Needs agent reply / in-progress</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditContactStatus('resolved')}
                                            className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-0.5 ${
                                                editContactStatus === 'resolved'
                                                    ? 'border-muted-foreground bg-muted text-foreground ring-2 ring-muted-foreground/20'
                                                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                                            }`}
                                        >
                                            <div className="font-bold flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-muted-foreground"></span>
                                                Resolved (Closed)
                                            </div>
                                            <span className="text-[10px] opacity-80">Query answered / archive chat</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Pipeline Stage Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Pipeline Stage (CRM Deal Funnel)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {(['New', 'Qualified', 'Proposal', 'Won', 'Lost'] as const).map((stage) => {
                                            const cfg = STAGE_CONFIG[stage];
                                            const isSelected = editContactStage === stage;
                                            return (
                                                <button
                                                    key={stage}
                                                    type="button"
                                                    onClick={() => setEditContactStage(stage)}
                                                    className={`p-2 rounded-xl border text-left transition-all text-xs flex flex-col gap-0.5 ${
                                                        isSelected
                                                            ? 'border-[#47b672] bg-[#47b672]/10 text-foreground ring-2 ring-[#47b672]/20 font-bold'
                                                            : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-1 text-[11px]">
                                                        <span>{cfg.icon}</span>
                                                        <span className="truncate">{cfg.label}</span>
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground truncate">{cfg.desc}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Customer Tag / Label */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Customer Label / Tag</label>
                                    <select
                                        value={editContactLabel}
                                        onChange={(e) => setEditContactLabel(e.target.value as any)}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/30 focus:border-[#47b672]"
                                    >
                                        <option value="Prospect">🏷️ Prospect (Potential Buyer)</option>
                                        <option value="Applicant">📋 Applicant (Applied for course/service)</option>
                                        <option value="Enrolled">🎓 Enrolled Customer (Existing paid client)</option>
                                    </select>
                                </div>
                            </form>
                        </div>

                        {/* Sticky Modal Action Footer - Always visible on any screen */}
                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/80 bg-muted/40 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowEditContactDialog(false)}
                                className="text-xs h-8 px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="edit-contact-form"
                                size="sm"
                                disabled={isSavingContact}
                                className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5 px-5 h-8 shadow-xs"
                            >
                                <CheckCircle2 className="size-3.5" />
                                {isSavingContact ? 'Saving Changes...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
