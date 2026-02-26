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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data, error } = await supabase.rpc('fn_orchestrate_distribution', {
                p_shop_ids: selectedShops.length === GRAVITON_SHOPS.length ? null : selectedShops
            });

            if (error) throw error;

            setLastRunMessage('Розподіл успішно завершено');
            await fetchTableData();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <div className="w-full h-full flex flex-col gap-6 bg-bg-primary text-text-primary p-6 font-sans antialiased relative overflow-hidden">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    {/* Brand Icon Box */}
                    <div className="w-14 h-14 bg-accent-primary/10 border border-accent-primary/20 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)] rounded-xl flex items-center justify-center">
                        <Truck className="text-accent-primary w-8 h-8" />
                    </div>
                    {/* Title & Subtitle */}
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-[0.25em] uppercase text-text-primary font-display">
                            ГРАВІТОН: ЛОГІСТИКА
                        </h1>
                        <p className="text-xs font-semibold tracking-widest text-text-secondary uppercase font-sans">
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
                            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm tracking-widest transition-all active:scale-95 shadow-sm",
                            loading
                                ? "bg-panel-bg text-text-muted cursor-not-allowed opacity-50"
                                : "bg-accent-primary hover:bg-accent-primary/80 text-bg-primary shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)]"
                        )}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        <span>СФОРМУВАТИ</span>
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={tableData.length === 0 || loading}
                        className={cn(
                            "flex items-center gap-2 bg-panel-bg border border-panel-border px-6 py-2.5 rounded-lg font-bold text-sm tracking-widest transition-all active:scale-95 shadow-sm hover:border-text-muted",
                            tableData.length === 0 || loading
                                ? "text-text-muted cursor-not-allowed opacity-50"
                                : "hover:bg-bg-primary text-text-primary"
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
                                    "px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 font-medium border",
                                    lastRunMessage.startsWith('Помилка') ? "bg-status-critical/10 text-status-critical border-status-critical/30 shadow-[0_0_10px_rgba(var(--color-status-critical),0.2)]" : "bg-status-ok/10 text-status-ok border-status-ok/30 shadow-[0_0_10px_rgba(var(--color-status-ok),0.2)]"
                                )}
                            >
                                {lastRunMessage.startsWith('Помилка') ? null : <CheckCircle2 size={14} />}
                                {lastRunMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Main Content */}
            <section className="bg-panel-bg border border-panel-border rounded-xl overflow-hidden shadow-[var(--panel-shadow)] flex-1 flex flex-col relative min-h-0">
                {/* Loading State Overlay */}
                {tableLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg-primary/80 backdrop-blur-md transition-opacity duration-300">
                        <div className="w-12 h-12 border-4 border-t-accent-primary border-panel-border rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)]"></div>
                        <p className="text-accent-primary font-bold tracking-widest animate-pulse font-display">РАХУЄМО...</p>
                    </div>
                )}

                {/* Empty State */}
                {!tableLoading && tableData.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                        <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm font-bold tracking-widest uppercase text-text-secondary">Розподіл ще не сформовано</p>
                    </div>
                )}

                {/* Data Table */}
                {tableData.length > 0 && (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse relative">
                            <thead className="sticky top-0 z-10 bg-panel-bg border-b border-panel-border">
                                <tr>
                                    <th className="py-4 px-6 text-[10px] font-black tracking-widest text-text-secondary uppercase">#</th>
                                    <th className="py-4 px-6 text-[10px] font-black tracking-widest text-text-secondary uppercase">Назва продукту</th>
                                    <th className="py-4 px-6 text-[10px] font-black tracking-widest text-text-secondary uppercase">Магазин</th>
                                    <th className="py-4 px-6 text-[10px] font-black tracking-widest text-text-secondary uppercase text-right">Кількість</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-panel-border/50">
                                {tableData.map((row, idx) => (
                                    <motion.tr
                                        key={`${row['Название продукта']}-${row['Магазин']}-${idx}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className="group hover:bg-bg-primary/50 transition-colors cursor-default"
                                    >
                                        <td className="py-3 px-6 text-sm font-mono text-text-secondary group-hover:text-accent-primary transition-colors">{idx + 1}</td>
                                        <td className="py-3 px-6 text-sm font-bold tracking-wide text-text-primary">{row['Название продукта']}</td>
                                        <td className="py-3 px-6 text-xs font-semibold text-text-secondary">{row['Магазин']}</td>
                                        <td className="py-3 px-6 text-right">
                                            <span className="inline-block px-3 py-1 bg-accent-primary/10 text-accent-primary border border-accent-primary/20 rounded font-mono text-sm font-bold min-w-[4rem] text-center shadow-[0_0_10px_rgba(var(--color-accent-primary),0.1)]">
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
                <div className="flex items-center justify-between px-6 py-3 border-t border-panel-border shrink-0 bg-panel-bg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-ok animate-pulse shadow-[0_0_8px_rgba(var(--color-status-ok),0.8)]"></div>
                        <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
                            Всього позицій: <span className="text-text-primary font-black ml-1 font-mono">{tableData.length}</span>
                        </p>
                    </div>
                    <button
                        onClick={fetchTableData}
                        className="p-2 text-text-secondary hover:text-accent-primary hover:bg-bg-primary rounded-full transition-all group border border-transparent hover:border-panel-border shadow-sm"
                        title="Оновити"
                    >
                        <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </section>
        </div>
    );
};
