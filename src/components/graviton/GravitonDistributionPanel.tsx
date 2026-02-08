import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Loader2, RefreshCw, ShoppingBag, Truck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateDistributionExcel } from '@/lib/distribution-export';

interface GravitonResult {
    "Название продукта": string;
    "Магазин": string;
    "Количество": number;
    "Время расчета"?: string;
}

export const GravitonDistributionPanel = () => {
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState<GravitonResult[]>([]);
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
            // Call the new API endpoint instead of direct RPC
            const response = await fetch('/api/graviton/distribution/run', {
                method: 'POST',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || 'Unknown error');
            }

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
        <div className="flex flex-col h-full bg-[#0B0E14] overflow-hidden font-sans rounded-2xl relative">

            {/* Header / Controls */}
            <div className="p-6 border-b border-white/5 bg-[#141829]/30 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Title */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center shrink-0">
                        <Truck size={24} className="text-[#00D4FF]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wide">Гравітон: Логістика</h2>
                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">
                            Автоматичний розподіл продукції
                        </div>
                    </div>
                </div>



                {/* Actions */}
                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={handleRunDistribution}
                            disabled={loading}
                            className={cn(
                                "relative overflow-hidden h-12 px-6 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl flex-1 md:flex-none justify-center",
                                loading
                                    ? "bg-[#1A1F3A] text-white/50 cursor-not-allowed border border-white/5"
                                    : "bg-gradient-to-r from-[#00D4FF] to-[#0088FF] text-[#0B0E14] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Рахуємо...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={18} fill="currentColor" />
                                    <span>Сформувати</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleExport}
                            disabled={tableData.length === 0 || loading}
                            className={cn(
                                "relative overflow-hidden h-12 px-6 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl flex-1 md:flex-none justify-center border",
                                tableData.length === 0 || loading
                                    ? "bg-[#1A1F3A] border-white/5 text-white/20 cursor-not-allowed"
                                    : "bg-[#1A1F3A] border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 hover:border-[#00D4FF] hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] active:scale-[0.98]"
                            )}
                        >
                            <Truck size={18} />
                            <span>Відправити</span>
                        </button>
                    </div>

                    <AnimatePresence>
                        {lastRunMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={cn(
                                    "text-xs font-mono flex items-center gap-1.5",
                                    lastRunMessage.startsWith('Помилка') ? "text-red-400" : "text-emerald-400"
                                )}
                            >
                                {lastRunMessage.startsWith('Помилка') ? null : <CheckCircle2 size={12} />}
                                {lastRunMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="bg-[#141829]/50 border border-white/5 rounded-2xl h-full flex flex-col overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/[0.02] text-[10px] uppercase font-bold tracking-widest text-white/40">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-5">Назва продукту</div>
                        <div className="col-span-4">Магазин</div>
                        <div className="col-span-2 text-right">Кількість</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {tableLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
                                <Loader2 size={32} className="animate-spin text-[#00D4FF]" />
                                <span className="text-xs tracking-widest">Завантаження даних...</span>
                            </div>
                        ) : tableData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <ShoppingBag size={32} />
                                </div>
                                <span className="text-xs uppercase tracking-widest font-bold">Розподіл ще не сформовано</span>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {tableData.map((row, idx) => (
                                    <motion.div
                                        key={`${row['Название продукта']}-${row['Магазин']}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="grid grid-cols-12 gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 items-center group"
                                    >
                                        <div className="col-span-1 text-center text-white/20 font-mono text-xs">{idx + 1}</div>
                                        <div className="col-span-5 font-medium text-white/90 text-sm group-hover:text-[#00D4FF] transition-colors">{row['Название продукта']}</div>
                                        <div className="col-span-4 text-xs text-white/60">{row['Магазин']}</div>
                                        <div className="col-span-2 text-right">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded bg-[#00D4FF]/10 text-[#00D4FF] text-xs font-black font-mono border border-[#00D4FF]/20 min-w-[3rem]">
                                                {row['Количество']}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/5 bg-[#0B0E14]/50 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest font-mono">
                        <div>Всього позицій: {tableData.length}</div>
                        <button onClick={fetchTableData} className="hover:text-white transition-colors">
                            <RefreshCw size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
