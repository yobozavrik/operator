'use client';

import React, { useState, useMemo } from 'react';
import { X, Send, Download, Copy, Check } from 'lucide-react';
import { OrderItem, SharePlatform } from '@/types/order';
import { formatOrderMessage } from '@/lib/messageFormatter';
import { cn } from '@/lib/utils';
import { groupItemsByCategory, generateExcel, prepareWorkbook } from '@/lib/order-export';
import { auditLog } from '@/lib/logger';
import ExcelJS from 'exceljs';

interface ShareOptionsModalProps {
    isOpen: boolean;
    items: OrderItem[];
    orderData: any;
    onClose: () => void;
    onShare: (platform: SharePlatform['id']) => void;
}

export const ShareOptionsModal = ({ isOpen, items, orderData, onClose, onShare }: ShareOptionsModalProps) => {
    const [copied, setCopied] = useState(false);

    const handleDownloadExcel = async () => {
        // Log export action
        await auditLog('EXPORT_EXCEL', 'ShareOptionsModal', {
            date: orderData.date,
            totalKg: orderData.totalKg,
            itemCount: items.length
        });

        const fileName = await generateExcel(orderData);
        alert(`Файл збережено: ${fileName}`);
    };

    const handleShareExcel = async () => {
        try {
            // Log share action
            await auditLog('SHARE_ORDER', 'ShareOptionsModal', {
                date: orderData.date,
                totalKg: orderData.totalKg,
                itemCount: items.length
            });

            const workbook = await prepareWorkbook(orderData);
            const buffer = await workbook.xlsx.writeBuffer();
            const file = new File(
                [buffer],
                `Graviton_${orderData.date.replace(/\./g, '-')}.xlsx`,
                { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
            );

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Виробниче замовлення',
                    text: `Замовлення GRAVITON на ${orderData.date}\nЗагальна вага: ${orderData.totalKg} кг`
                });
            } else {
                alert('Ваш браузер не підтримує функцію поділитися. Використайте кнопку "Завантажити".');
            }
        } catch (error) {
            console.error('Помилка при поділитися:', error);
            await auditLog('ERROR', 'ShareOptionsModal', { error: String(error) });
            alert('Помилка при поділитися файлом');
        }
    };


    const messagePreview = useMemo(() => {
        return formatOrderMessage(items);
    }, [items]);

    const groupedByCategory = useMemo(() => {
        return groupItemsByCategory(items);
    }, [items]);

    const handleCopy = () => {
        navigator.clipboard.writeText(messagePreview);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="flex-shrink-0 px-6 py-5 border-b border-[#3A3A3A] bg-[#111823]">
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
                    {/* Action Buttons */}
                    <div className="space-y-4">
                        <h3 className="text-[12px] font-bold uppercase text-[#8B949E] tracking-widest text-center mb-6">
                            Оберіть дію
                        </h3>

                        <div className="flex gap-4">
                            {/* Кнопка Поділитися */}
                            <button
                                onClick={handleShareExcel}
                                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-[13px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20"
                                style={{
                                    background: 'linear-gradient(135deg, #0088CC 0%, #0066AA 100%)',
                                    color: '#fff'
                                }}
                            >
                                <Send size={18} />
                                Поділитися
                            </button>

                            {/* Кнопка Завантажити */}
                            <button
                                onClick={handleDownloadExcel}
                                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-[13px] transition-all hover:scale-[1.02] active:scale-[0.98] bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                            >
                                <Download size={18} className="text-[#58A6FF]" />
                                Завантажити
                            </button>
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

                        <div className="bg-[#0D1117] border border-[#3A3A3A] rounded-xl p-5 font-sans text-[13px] text-[#E6EDF3] leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                {Object.entries(groupedByCategory).map(([category, data]: any) => (
                                    <div key={category} className="space-y-1">
                                        <div className="font-black text-[#58A6FF] border-b border-white/5 pb-1 mb-2">
                                            {category.toUpperCase()}: {data.totalKg} кг
                                        </div>
                                        <div className="pl-2 space-y-1.5 opacity-90">
                                            {data.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-[12px]">
                                                    <span>• {item.productName}</span>
                                                    <span className="font-bold text-[#52E8FF]">{item.kg} кг</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(groupedByCategory).length === 0 && (
                                    <p className="text-center opacity-40 py-8">Немає вибраних товарів</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-[#3A3A3A] bg-[#111823] z-10">
                    <div className="flex items-center justify-center">
                        <button
                            onClick={onClose}
                            className="w-full px-10 py-3 bg-[#252526] border border-[#3A3A3A] rounded-xl text-[12px] font-bold text-[#E6EDF3] hover:bg-[#2D2D2D] hover:border-[#44454A] transition-all hover:scale-[1.01]"
                        >
                            ЗАКРИТИ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
