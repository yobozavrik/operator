import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Loader2, RefreshCw, ShoppingBag, Truck, CheckCircle2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateDistributionExcel } from '@/lib/distribution-export';
import { ShopSelector } from '../ShopSelector';
import { GRAVITON_SHOPS } from '@/lib/transformers';

interface GravitonResult {
    "Название продукта": string;
    "Магазин": string;
    "Количество": number;
    "Время расчета"?: string;
}

export const GravitonDistributionPanel = () => {
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState<GravitonResult[]>([]);
    const [selectedShops, setSelectedShops] = useState<number[]>(GRAVITON_SHOPS.map(s => s.id));
    const [tableLoading, setTableLoading] = useState(false);
    const [lastRunMessage, setLastRunMessage] = useState<string | null>(null);

    // Fetch Data
    const fetchTableData = async () => {
        setTableLoading(true);
        try {
            const { data, error } = await supabase
                .from('v_graviton_results_public')
                .select('*')
                .order('Название продукта', { ascending: true });

            if (error) throw error;
            setTableData(data || []);
        } catch (err) {
            console.error('Error fetching graviton results:', err);
        } finally {
            setTableLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchTableData();
    }, []);

    // Run Algorithm
    const handleRunDistribution = async () => {
        setLoading(true);
        setLastRunMessage(null);
        try {
            if (selectedShops.length === 0) {
                throw new Error('Оберіть хоча б один магазин!');
            }

            // Call RPC directly
            const { data, error } = await supabase.rpc('fn_orchestrate_distribution', {
                p_shop_ids: selectedShops.length === GRAVITON_SHOPS.length ? null : selectedShops
            });

            if (error) throw error;

            setLastRunMessage('Розподіл успішно завершено');
            await fetchTableData();
        } catch (err: any) {
            console.error('Error running graviton calc:', err);
            setLastRunMessage(`Помилка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (tableData.length === 0) return;
        try {
            await generateDistributionExcel(tableData);
            setLastRunMessage('Файл успішно сформовано');
        } catch (err) {
            console.error('Export error:', err);
            setLastRunMessage('Помилка експорту');
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-[#0B0E14] text-slate-100 p-6 font-sans antialiased relative overflow-hidden">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    {/* Brand Icon Box */}
                    <div className="w-14 h-14 bg-[#00D4FF]/10 border border-[#00D4FF] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                        <Truck className="text-[#00D4FF] w-8 h-8" />
                    </div>
                    {/* Title & Subtitle */}
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-[0.25em] uppercase text-white [text-shadow:0_0_8px_rgba(0,212,255,0.6)]">
                            ГРАВІТОН: ЛОГІСТИКА
                        </h1>
                        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                            Автоматичний розподіл продукції
                        </p>
                    </div>
                </div>

                {/* Header Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <ShopSelector selectedShops={selectedShops} setSelectedShops={setSelectedShops} />

                    <button
                        onClick={handleRunDistribution}
                        disabled={loading}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(0,212,255,0.4)]",
                            loading
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                        )}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        <span>СФОРМУВАТИ</span>
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={tableData.length === 0 || loading}
                        className={cn(
                            "flex items-center gap-2 border border-slate-700 px-6 py-2 rounded-md font-bold text-sm tracking-widest transition-all active:scale-95",
                            tableData.length === 0 || loading
                                ? "text-slate-600 border-slate-800 cursor-not-allowed"
                                : "hover:bg-slate-800 text-slate-300"
                        )}
                    >
                        <Send className="w-4 h-4" />
                        <span>ВІДПРАВИТИ</span>
                    </button>

                    <AnimatePresence>
                        {lastRunMessage && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className={cn(
                                    "px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5",
                                    lastRunMessage.startsWith('Помилка') ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                                )}
                            >
                                {lastRunMessage.startsWith('Помилка') ? null : <CheckCircle2 size={12} />}
                                {lastRunMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Main Content */}
            <section className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col relative min-h-0">
                {/* Loading State Overlay */}
                {tableLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
                        <div className="w-12 h-12 border-4 border-t-[#00D4FF] border-slate-700 rounded-full animate-spin mb-4"></div>
                        <p className="text-[#00D4FF] font-bold tracking-widest animate-pulse">РАХУЄМО...</p>
                    </div>
                )}

                {/* Empty State */}
                {!tableLoading && tableData.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm font-bold tracking-widest uppercase">Розподіл ще не сформовано</p>
                    </div>
                )}

                {/* Data Table */}
                {tableData.length > 0 && (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse relative">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-slate-800 bg-[#0F172A]">
                                    <th className="py-5 px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase sticky top-0">#</th>
                                    <th className="py-5 px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase sticky top-0">Назва продукту</th>
                                    <th className="py-5 px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase sticky top-0">Магазин</th>
                                    <th className="py-5 px-6 text-[10px] font-black tracking-widest text-slate-500 uppercase text-right sticky top-0">Кількість</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {tableData.map((row, idx) => (
                                    <motion.tr
                                        key={`${row['Название продукта']}-${row['Магазин']}-${idx}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className="group hover:bg-white/5 transition-colors cursor-default"
                                    >
                                        <td className="py-3 px-6 text-sm font-mono text-slate-500 group-hover:text-[#00D4FF] transition-colors">{idx + 1}</td>
                                        <td className="py-3 px-6 text-sm font-bold tracking-wide text-white">{row['Название продукта']}</td>
                                        <td className="py-3 px-6 text-xs font-semibold text-slate-400">{row['Магазин']}</td>
                                        <td className="py-3 px-6 text-right">
                                            <span className="inline-block px-3 py-1 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 rounded font-mono text-sm font-bold min-w-[4rem] text-center">
                                                {row['Количество']}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800/50 shrink-0 bg-[#0B0E14]/50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            Всього позицій: <span className="text-white">{tableData.length}</span>
                        </p>
                    </div>
                    <button
                        onClick={fetchTableData}
                        className="p-2 text-slate-500 hover:text-[#00D4FF] hover:bg-slate-800/50 rounded-full transition-all group"
                        title="Оновити"
                    >
                        <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </section>
        </div>
    );
};
