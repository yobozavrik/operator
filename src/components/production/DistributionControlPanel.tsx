
import React, { useState } from 'react';
import useSWR from 'swr';
import { Play, Loader2, AlertCircle, RefreshCw, CheckCircle2, ShoppingBag, Truck, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDistributionExcel } from '@/lib/order-export';

// --- Types ---
interface DistributionResult {
    product_name: string;
    spot_name: string;
    quantity_to_ship: number;
    calc_time: string;
}

interface ProductionStatus {
    prod_count: number;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return res.json();
};

export const DistributionControlPanel = () => {
    // 1. Fetch Results (What has been distributed today?)
    const {
        data: resultsData,
        isLoading: resultsLoading,
        mutate: refreshResults
    } = useSWR<DistributionResult[]>('/api/pizza/distribution/results', fetcher, { refreshInterval: 10000 });

    const [isRunning, setIsRunning] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [lastRunResult, setLastRunResult] = useState<string | null>(null);

    // 📥 ACTION: Export to Excel
    const handleExport = async () => {
        if (!resultsData || resultsData.length === 0) return;

        setIsExporting(true);
        try {
            await generateDistributionExcel(resultsData);
            setLastRunResult('Файл збережено!');
            setTimeout(() => setLastRunResult(null), 3000);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Помилка при експорті');
        } finally {
            setIsExporting(false);
        }
    };

    // 🚀 ACTION: Trigger Distribution
    const handleRunDistribution = async () => {
        setIsRunning(true);
        setLastRunResult(null);
        try {
            const res = await fetch('/api/pizza/distribution/run', { method: 'POST' });
            const json = await res.json();

            if (!res.ok) throw new Error(json.error || 'Failed to run distribution');

            setLastRunResult(json.message || 'Success');
            await refreshResults(); // Immediately update table
        } catch (error: any) {
            console.error('Distribution error:', error);
            setLastRunResult(`Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0B0E14] overflow-hidden font-sans">

            {/* --- CONTROL HEADER --- */}
            <div className="p-6 border-b border-white/5 bg-[#141829]/30 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Left: Info */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center shrink-0">
                        <Truck size={24} className="text-[#FFB800]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wide">Панель Логіста</h2>
                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">
                            Керування розподілом продукції
                        </div>
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* EXPORT BUTTON */}
                        <button
                            onClick={handleExport}
                            disabled={isExporting || resultsLoading || !resultsData || resultsData.length === 0}
                            className={cn(
                                "h-12 px-6 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center gap-2 border border-white/10 shrink-0",
                                !resultsData || resultsData.length === 0
                                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                                    : "bg-[#1A1F3A] text-[#00D4FF] hover:bg-[#00D4FF]/10 hover:border-[#00D4FF]/30 active:scale-[0.98]"
                            )}
                            title="Скачати Excel"
                        >
                            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            <span className="hidden sm:inline text-xs">Excel</span>
                        </button>

                        {/* RUN BUTTON */}
                        <button
                            onClick={handleRunDistribution}
                            disabled={isRunning}
                            className={cn(
                                "relative overflow-hidden h-12 px-8 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-3 shadow-xl w-full md:w-auto justify-center",
                                isRunning
                                    ? "bg-[#1A1F3A] text-white/50 cursor-not-allowed border border-white/5"
                                    : "bg-gradient-to-r from-[#FFB800] to-[#FF8A00] text-[#0B0E14] hover:shadow-[0_0_30px_rgba(255,184,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Розрахунок...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={20} fill="currentColor" />
                                    <span>Сформувати розподілення</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Feedback Message */}
                    <AnimatePresence>
                        {lastRunResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xs font-mono text-emerald-400 flex items-center gap-1.5"
                            >
                                <CheckCircle2 size={12} />
                                {lastRunResult}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- RESULTS TABLE --- */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="bg-[#141829]/50 border border-white/5 rounded-2xl h-full flex flex-col overflow-hidden">

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/[0.02] text-[10px] uppercase font-bold tracking-widest text-white/40">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-5">Товар</div>
                        <div className="col-span-4">Магазин</div>
                        <div className="col-span-2 text-right">К-ть</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {resultsLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
                                <Loader2 size={32} className="animate-spin text-[#FFB800]" />
                                <span className="text-xs tracking-widest">Завантаження даних...</span>
                            </div>
                        ) : !Array.isArray(resultsData) || resultsData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <ShoppingBag size={32} />
                                </div>
                                <span className="text-xs uppercase tracking-widest font-bold">Розподіл ще не сформовано</span>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {resultsData.map((row, idx) => (
                                    <motion.div
                                        key={`${row.product_name}-${row.spot_name}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="grid grid-cols-12 gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 items-center group"
                                    >
                                        <div className="col-span-1 text-center text-white/20 font-mono text-xs">{idx + 1}</div>
                                        <div className="col-span-5 font-medium text-white/90 text-sm group-hover:text-[#FFB800] transition-colors line-clamp-1" title={row.product_name}>
                                            {row.product_name}
                                        </div>
                                        <div className="col-span-4 text-xs text-white/60 line-clamp-1" title={row.spot_name}>
                                            {row.spot_name}
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded bg-[#FFB800]/10 text-[#FFB800] text-xs font-black font-mono border border-[#FFB800]/20 min-w-[3rem]">
                                                {row.quantity_to_ship}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="p-3 border-t border-white/5 bg-[#0B0E14]/50 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest font-mono">
                        <div>Всього позицій: {resultsData?.length || 0}</div>
                        <div className="flex items-center gap-2">
                            <span>Останнє оновлення: {new Date().toLocaleTimeString()}</span>
                            <button onClick={() => refreshResults()} className="hover:text-white transition-colors">
                                <RefreshCw size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
