'use client';

import React, { useState, useMemo } from 'react';
import { X, Send, Download, Copy, Check } from 'lucide-react';
import { OrderItem, SharePlatform } from '@/types/order';
import { formatOrderMessage } from '@/lib/messageFormatter';
import { cn } from '@/lib/utils';

interface ShareOptionsModalProps {
    isOpen: boolean;
    items: OrderItem[];
    onClose: () => void;
    onShare: (platform: SharePlatform['id']) => void;
}

const SHARE_OPTIONS: SharePlatform[] = [
    { id: 'telegram', label: 'Telegram', icon: '📱', color: '#0088cc' },
    { id: 'viber', label: 'Viber', icon: '💜', color: '#7360f2' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25d366' },
    { id: 'download', label: 'Завантажити', icon: '📥', color: '#58A6FF' }
];

export const ShareOptionsModal = ({ isOpen, items, onClose, onShare }: ShareOptionsModalProps) => {
    const [selectedPlatform, setSelectedPlatform] = useState<SharePlatform['id'] | null>(null);
    const [copied, setCopied] = useState(false);

    const messagePreview = useMemo(() => {
        return formatOrderMessage(items);
    }, [items]);

    const handleCopy = () => {
        navigator.clipboard.writeText(messagePreview);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        if (!selectedPlatform) {
            alert('Оберіть платформу для відправки');
            return;
        }
        onShare(selectedPlatform);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#3A3A3A] bg-[#111823] rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Send className="text-[#58A6FF]" size={24} />
                            <h2 className="text-[16px] font-black uppercase tracking-tight text-[#E6EDF3]">
                                📤 Поділитися замовленням
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Platform Selection */}
                    <div>
                        <h3 className="text-[12px] font-bold uppercase text-[#8B949E] mb-3 tracking-widest">
                            Оберіть спосіб відправки
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {SHARE_OPTIONS.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedPlatform(option.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                                        selectedPlatform === option.id
                                            ? "border-[#58A6FF] bg-[#58A6FF]/10"
                                            : "border-[#3A3A3A] bg-[#252526] hover:border-[#44454A]"
                                    )}
                                >
                                    <span className="text-[24px]">{option.icon}</span>
                                    <span className="text-[13px] font-bold text-[#E6EDF3]">
                                        {option.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Preview */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[12px] font-bold uppercase text-[#8B949E] tracking-widest">
                                Попередній перегляд
                            </h3>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border border-[#3A3A3A] rounded-lg text-[11px] font-bold text-[#E6EDF3] hover:border-[#58A6FF] transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <Check size={12} className="text-[#3FB950]" />
                                        Скопійовано
                                    </>
                                ) : (
                                    <>
                                        <Copy size={12} />
                                        Копіювати
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-[#0D1117] border border-[#3A3A3A] rounded-xl p-4 font-mono text-[11px] text-[#E6EDF3] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar">
                            {messagePreview}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#111823] rounded-b-2xl">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-[#252526] border border-[#3A3A3A] rounded-lg text-[12px] font-bold text-[#E6EDF3] hover:bg-[#2D2D2D] hover:border-[#44454A] transition-all"
                        >
                            Назад
                        </button>

                        <button
                            onClick={handleShare}
                            disabled={!selectedPlatform}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-[12px] font-bold transition-all",
                                selectedPlatform
                                    ? "bg-[#58A6FF] text-white hover:bg-[#4A9EEE] shadow-lg shadow-[#58A6FF]/20"
                                    : "bg-[#252526] border border-[#3A3A3A] text-[#8B949E] cursor-not-allowed"
                            )}
                        >
                            <Send size={14} />
                            Відправити
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
