'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Trash2, Edit2, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { OrderItem } from '@/types/order';
import { SKUCategory } from '@/types/bi';
import { cn } from '@/lib/utils';

interface OrderConfirmationModalProps {
    isOpen: boolean;
    items: OrderItem[];
    onClose: () => void;
    onConfirm: (items: OrderItem[]) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
    'ВАРЕНИКИ': '🥟',
    'ПЕЛЬМЕНІ': '🥢',
    'ХІНКАЛІ': '🥡',
    'ЧЕБУРЕКИ': '🌯',
    'КОВБАСКИ': '🌭',
    'ГОЛУБЦІ': '🥬',
    'КОТЛЕТИ': '🥩',
    'СИРНИКИ': '🥞',
    'ФРИКАДЕЛЬКИ': '🧆',
    'ЗРАЗИ': '🥔',
    'ПЕРЕЦЬ ФАРШИРОВАНИЙ': '🫑',
    'МЛИНЦІ': '🥞',
    'БЕНДЕРИКИ': '🌮'
};

const getEmoji = (category: string) => CATEGORY_EMOJI[category] || '📦';

export const OrderConfirmationModal = ({ isOpen, items, onClose, onConfirm }: OrderConfirmationModalProps) => {
    const [editedItems, setEditedItems] = useState<OrderItem[]>(items);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<SKUCategory>>(new Set());

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Sync editedItems when items prop changes and filter out zero quantities
    useEffect(() => {
        const filtered = items.filter(item => item.quantity > 0);
        setEditedItems(filtered);

        // Auto-expand all initially
        const allCats = new Set(filtered.map(i => i.category));
        setExpandedCategories(allCats);
    }, [items]);

    const toggleAllCategories = () => {
        if (expandedCategories.size > 0) {
            setExpandedCategories(new Set());
        } else {
            const allCats = new Set(groupedItems.map(g => g.category));
            setExpandedCategories(allCats);
        }
    };

    const toggleCategory = (category: SKUCategory) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) next.delete(category);
            else next.add(category);
            return next;
        });
    };

    // Group by category
    const groupedItems = useMemo(() => {
        const groups = new Map<SKUCategory, OrderItem[]>();

        // Only include items with quantity > 0
        editedItems.filter(item => item.quantity > 0).forEach(item => {
            if (!groups.has(item.category)) {
                groups.set(item.category, []);
            }
            groups.get(item.category)!.push(item);
        });

        return Array.from(groups.entries()).map(([category, items]) => ({
            category,
            emoji: getEmoji(category),
            totalWeight: items.reduce((sum, item) => sum + item.quantity, 0),
            items: items.sort((a, b) => a.productName.localeCompare(b.productName))
        }));
    }, [editedItems]);

    const totalWeight = useMemo(() => {
        return editedItems.reduce((sum, item) => sum + item.quantity, 0);
    }, [editedItems]);

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) return;

        setEditedItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity, kg: newQuantity } : item
            )
        );
    };

    const handleRemoveItem = (itemId: string) => {
        setEditedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleConfirm = () => {
        if (editedItems.length === 0) {
            alert('Замовлення порожнє!');
            return;
        }
        onConfirm(editedItems);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#1C1C1E] border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[75vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-5 py-3 border-b border-white/10 bg-[#0D1117]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-[#58A6FF]/20 flex items-center justify-center">
                                <Package className="text-[#58A6FF]" size={16} />
                            </div>
                            <h2 className="text-[12px] font-black uppercase tracking-[0.1em] text-white">
                                Попередній перегляд замовлення
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleAllCategories}
                                className="px-2 py-1 text-[9px] font-bold text-[#8B949E] hover:text-white bg-white/5 rounded border border-white/5 transition-colors"
                            >
                                {expandedCategories.size > 0 ? 'ЗГОРНУТИ ВСЕ' : 'РОЗГОРНУТИ ВСЕ'}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-[#8B949E] hover:text-white hover:bg-white/5 rounded-full transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">
                                Вага:
                            </span>
                            <span className="text-[14px] font-black text-[#58A6FF]">
                                {totalWeight.toFixed(1)} кг
                            </span>
                        </div>
                        <div className="h-4 w-[1px] bg-white/5" />
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">
                                Позицій:
                            </span>
                            <span className="text-[12px] font-bold text-white/90">
                                {editedItems.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#111111]">
                    {groupedItems.length === 0 ? (
                        <div className="text-center py-12 text-[#8B949E]">
                            <Package size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-[14px] font-semibold">Замовлення порожнє</p>
                        </div>
                    ) : (
                        groupedItems.map(group => (
                            <div
                                key={group.category}
                                className="bg-[#252526] rounded-xl border border-[#3A3A3A] overflow-hidden"
                            >
                                {/* Category Header */}
                                <div
                                    className="px-4 py-2 bg-[#0D1117] border-b border-white/5 cursor-pointer hover:bg-[#161B22] transition-colors"
                                    onClick={() => toggleCategory(group.category)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {expandedCategories.has(group.category) ? (
                                                <ChevronDown size={14} className="text-[#8B949E]" />
                                            ) : (
                                                <ChevronRight size={14} className="text-[#8B949E]" />
                                            )}
                                            <span className="text-[16px]">{group.emoji}</span>
                                            <span className="text-[13px] font-black uppercase text-white/90">
                                                {group.category}
                                            </span>
                                        </div>
                                        <span className="text-[14px] font-black text-[#58A6FF]">
                                            {group.totalWeight.toFixed(1)} кг
                                        </span>
                                    </div>
                                </div>

                                {/* Items */}
                                {expandedCategories.has(group.category) && (
                                    <div className="divide-y divide-white/5">
                                        {group.items.map(item => (
                                            <div
                                                key={item.id}
                                                className="px-4 py-2 hover:bg-white/[0.01] transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    {/* Product Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[12px] font-bold text-white/80 truncate">
                                                            {item.productName}
                                                        </div>
                                                        <div className="text-[10px] text-white/40 italic">
                                                            🏪 {item.storeName}
                                                        </div>
                                                    </div>

                                                    {/* Quantity Editor */}
                                                    <div className="flex items-center gap-2">
                                                        {editingId === item.id ? (
                                                            <input
                                                                type="number"
                                                                min="0.1"
                                                                step="0.5"
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value))}
                                                                onBlur={() => setEditingId(null)}
                                                                className="w-16 px-1 py-0.5 bg-black border border-[#58A6FF] rounded text-[12px] font-black text-[#58A6FF] text-center focus:outline-none"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <button
                                                                onClick={() => setEditingId(item.id)}
                                                                className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded hover:border-[#58A6FF] transition-colors"
                                                            >
                                                                <span className="text-[13px] font-black text-[#58A6FF]">
                                                                    {item.quantity.toFixed(1)}
                                                                </span>
                                                                <Edit2 size={12} className="text-white/20" />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="p-1.5 text-white/20 hover:text-[#F85149] hover:bg-[#F85149]/10 rounded transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/10 bg-[#0D1117]">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-white/60 hover:text-white transition-colors"
                        >
                            Назад
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={editedItems.length === 0}
                            className={cn(
                                "px-8 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all shadow-xl",
                                editedItems.length === 0
                                    ? "bg-white/5 text-white/10 cursor-not-allowed"
                                    : "bg-gradient-to-r from-[#58A6FF] to-[#0099FF] text-white hover:scale-[1.03] shadow-[#58A6FF]/20"
                            )}
                        >
                            Підтвердити та поділитися →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
