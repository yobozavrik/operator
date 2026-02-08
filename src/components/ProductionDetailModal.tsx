'use client';

import React from 'react';
import useSWR from 'swr';
import { X, ChefHat, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ProductionItem {
    product_name: string;
    baked_at_factory: number;
}

export const ProductionDetailModal = ({ isOpen, onClose }: ProductionDetailModalProps) => {
    const { data, error, isLoading } = useSWR<ProductionItem[]>(
        isOpen ? '/api/pizza/production-detail' : null,
        (url) => fetch(url).then(r => r.json()),
        { refreshInterval: 10000 }
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#141829] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1A1F3A]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center">
                            <ChefHat size={20} className="text-[#00D4FF]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-wide">Виробництво</h2>
                            <p className="text-xs text-white/50 uppercase tracking-widest">Детальна статистика (24 год)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
                            <Loader2 size={32} className="animate-spin text-[#00D4FF]" />
                            <span className="text-xs font-mono uppercase tracking-widest">Завантаження даних...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-[#E74856] gap-3">
                            <AlertCircle size={32} />
                            <span className="text-sm font-bold">Помилка завантаження</span>
                            <span className="text-xs font-mono opacity-70">{String(error)}</span>
                        </div>
                    ) : data && data.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#141829] z-10 text-[10px] uppercase font-bold tracking-widest text-white/40">
                                <tr>
                                    <th className="p-3 pl-4">Піца</th>
                                    <th className="p-3 pr-4 text-right">Кількість</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.map((item, i) => (
                                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-3 pl-4 text-sm font-medium text-white/90 group-hover:text-white">
                                            {item.product_name}
                                        </td>
                                        <td className="p-3 pr-4 text-right">
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded bg-[#00D4FF]/10 text-[#00D4FF] font-mono text-sm font-bold min-w-[3rem]">
                                                {item.baked_at_factory}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-white/30">
                            <ChefHat size={32} className="mb-3 opacity-20" />
                            <span className="text-sm">Дані відсутні</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-[#1A1F3A]/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all border border-white/5 hover:border-white/20"
                    >
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
};
