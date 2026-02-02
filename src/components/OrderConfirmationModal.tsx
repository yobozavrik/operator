'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Trash2, Edit2, Package } from 'lucide-react';
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

    // Sync editedItems when items prop changes and filter out zero quantities
    useEffect(() => {
        setEditedItems(items.filter(item => item.quantity > 0));
    }, [items]);

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
                item.id === itemId ? { ...item, quantity: newQuantity } : item
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#3A3A3A] bg-[#111823] rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="text-[#58A6FF]" size={24} />
                            <h2 className="text-[16px] font-black uppercase tracking-tight text-[#E6EDF3]">
                                📋 Підтвердження замовлення
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mt-4 flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-widest">
                                Дата
                            </span>
                            <span className="text-[14px] font-bold text-[#E6EDF3]">
                                {new Date().toLocaleDateString('uk-UA')}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-widest">
                                Загальна вага
                            </span>
                            <span className="text-[18px] font-black text-[#58A6FF]">
                                {totalWeight.toFixed(1)} кг
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-widest">
                                Позицій
                            </span>
                            <span className="text-[14px] font-bold text-[#E6EDF3]">
                                {editedItems.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
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
                                <div className="px-5 py-3 bg-[#0D1117] border-b border-[#3A3A3A]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[18px]">{group.emoji}</span>
                                            <span className="text-[14px] font-bold uppercase text-white">
                                                {group.category}
                                            </span>
                                        </div>
                                        <span className="text-[16px] font-black text-[#58A6FF]">
                                            {group.totalWeight.toFixed(1)} кг
                                        </span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-[#3A3A3A]/30">
                                    {group.items.map(item => (
                                        <div
                                            key={item.id}
                                            className="px-5 py-4 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[13px] font-semibold text-white mb-1">
                                                        {item.productName}
                                                    </div>
                                                    <div className="text-[11px] text-[#A0A0A0]">
                                                        {item.storeName}
                                                    </div>
                                                </div>

                                                {/* Quantity Editor */}
                                                <div className="flex items-center gap-3">
                                                    {editingId === item.id ? (
                                                        <input
                                                            type="number"
                                                            min="0.1"
                                                            step="0.5"
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value))}
                                                            onBlur={() => setEditingId(null)}
                                                            className="w-20 px-2 py-1 bg-[#0D1117] border border-[#58A6FF] rounded text-[12px] font-bold text-[#E6EDF3] text-center focus:outline-none focus:ring-2 focus:ring-[#58A6FF]/50"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => setEditingId(item.id)}
                                                            className="flex items-center gap-2 px-3 py-2 bg-[#0D1117] border border-[#3A3A3A] rounded hover:border-[#58A6FF] transition-colors"
                                                        >
                                                            <span className="text-[14px] font-black text-[#58A6FF]">
                                                                {item.quantity.toFixed(1)} кг
                                                            </span>
                                                            <Edit2 size={14} className="text-[#8B949E]" />
                                                        </button>
                                                    )}

                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-2 text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 rounded transition-colors"
                                                        title="Видалити"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#111823] rounded-b-2xl">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-[#252526] border border-[#3A3A3A] rounded-lg text-[12px] font-bold text-[#E6EDF3] hover:bg-[#2D2D2D] hover:border-[#44454A] transition-all"
                        >
                            Скасувати
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={editedItems.length === 0}
                            className={cn(
                                "px-6 py-2.5 rounded-lg text-[12px] font-bold transition-all",
                                editedItems.length === 0
                                    ? "bg-[#252526] border border-[#3A3A3A] text-[#8B949E] cursor-not-allowed"
                                    : "bg-[#58A6FF] text-white hover:bg-[#4A9EEE] shadow-lg shadow-[#58A6FF]/20"
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
