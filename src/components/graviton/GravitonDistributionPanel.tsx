import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Loader2, RefreshCw, ShoppingBag, Truck, CheckCircle2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateDistributionExcel } from '@/lib/distribution-export';
import { ShopSelector } from '../ShopSelector';

interface GravitonResult {
    "Название продукта": string;
    "Магазин": string;
    "Количество": number;
    "Факт. залишок"?: number | null;
    "Мін. залишок"?: number | null;
    "Сер. продажі"?: number | null;
    "Время расчета"?: string;
}

interface GravitonShop {
    spot_id: number;
    storage_id: number;
    spot_name: string;
}

interface DistributionResultRow {
    product_id: string;
    product_name: string;
    spot_name: string;
    quantity_to_ship: number;
    calculation_batch_id: string;
    business_date: string;
}

export const GravitonDistributionPanel = () => {
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState<GravitonResult[]>([]);
    const [shops, setShops] = useState<GravitonShop[]>([]);
    const [shopsLoading, setShopsLoading] = useState(true);
    const [selectedShops, setSelectedShops] = useState<number[]>([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [lastRunMessage, setLastRunMessage] = useState<string | null>(null);
    const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
    const [currentBatchMeta, setCurrentBatchMeta] = useState<{
        batch_id: string;
        business_date: string;
        full_run: boolean;
        selected_shop_ids: number[] | null;
        products_processed: number;
        total_kg: number;
        live_sync?: {
            stocks_rows: number;
            manufactures_rows: number;
            partial_sync: boolean;
            failed_storages: number[];
        };
    } | null>(null);

    // Fetch Shops
    const fetchShops = async () => {
        setShopsLoading(true);
        try {
            const res = await fetch('/api/graviton/shops');
            const data = await res.json();
            if (data.success) {
                const fetchedShops = data.shops || [];
                setShops(fetchedShops);
                // Auto-select all shops initially
                setSelectedShops(fetchedShops.map((s: GravitonShop) => s.spot_id));
            } else {
                throw new Error(data.error || 'Failed to fetch shops');
            }
        } catch (err) {
            console.error('Error fetching shops:', err);
            setLastRunMessage('Помилка завантаження магазинів');
        } finally {
            setShopsLoading(false);
        }
    };

    // Fetch Public Historical Data
    const fetchPublicTableData = async () => {
        setTableLoading(true);
        try {
            const { data, error } = await supabase
                .from('v_graviton_results_public')
                .select('*')
                .order('Название продукта', { ascending: true });

            if (error) throw error;
            setTableData(data || []);
        } catch (err) {
            console.error('Error fetching public graviton results:', err);
        } finally {
            setTableLoading(false);
        }
    };

    // Fetch Specific Batch Data
    const fetchBatchTableData = async (batchId: string) => {
        setTableLoading(true);
        try {
            const { data, error } = await supabase
                .schema('graviton')
                .from('distribution_results')
                .select('product_id, product_name, spot_name, quantity_to_ship, calculation_batch_id, business_date')
                .eq('calculation_batch_id', batchId)
                .order('product_name', { ascending: true })
                .order('spot_name', { ascending: true });

            if (error) throw error;

            const batchRows = data as DistributionResultRow[] || [];
            if (batchRows.length === 0) {
                setTableData([]);
                return;
            }

            const businessDate = batchRows[0].business_date;

            // Fetch production snapshot to calculate remaining stock
            const { data: prodData, error: prodError } = await supabase
                .schema('graviton')
                .from('distribution_input_production')
                .select('product_id, product_name, quantity')
                .eq('batch_id', batchId);

            if (prodError) {
                console.error("Error fetching production snapshot:", {
                    message: prodError?.message,
                    details: prodError?.details,
                    hint: prodError?.hint,
                    code: prodError?.code
                });
            }

            const uniqueProductIds = Array.from(new Set(batchRows.map(r => r.product_id)));

            // Map spot names to spot ids using the shops state
            const normalizeStoreName = (name: string) => name.toLowerCase().replace(/магазин\s*/g, '').replace(/["'«»]/g, '').trim();
            const spotNameToId: Record<string, number> = {};
            shops.forEach(s => {
                spotNameToId[normalizeStoreName(s.spot_name)] = s.spot_id;
            });

            const uniqueSpotIds = Array.from(new Set(
                batchRows
                    .filter(row => row.spot_name !== 'Остаток на Складе')
                    .map(row => spotNameToId[normalizeStoreName(row.spot_name)])
                    .filter(id => id !== undefined)
            ));

            // Fetch actual stock from snapshot
            const { data: stockData, error: stockError } = await supabase
                .schema('graviton')
                .from('distribution_input_stocks')
                .select('spot_id, product_id, stock_left')
                .eq('batch_id', batchId);

            if (stockError) console.error("Error fetching stock snapshot:", stockError);

            // Fetch avg sales from distribution_base
            let salesDataRaw: any[] = [];
            if (uniqueSpotIds.length > 0 && uniqueProductIds.length > 0) {
                const { data: salesDataResult, error: salesError } = await supabase
                    .schema('graviton')
                    .from('distribution_base')
                    .select('*')
                    .in('код_продукту', uniqueProductIds)
                    .in('код_магазину', uniqueSpotIds);

                if (salesError) console.error("Error fetching sales data:", salesError);
                salesDataRaw = salesDataResult || [];
            }

            const stockMap: Record<string, number> = {};
            (stockData || []).forEach(row => {
                stockMap[`${row.spot_id}_${row.product_id}`] = row.stock_left;
            });

            const salesMap: Record<string, number> = {};
            const minStockMap: Record<string, number> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (salesDataRaw as any[] || []).forEach(row => {
                const key = `${row.код_магазину}_${row.код_продукту}`;
                salesMap[key] = row.avg_sales_day;
                minStockMap[key] = row.min_stock;
            });

            const mappedData: GravitonResult[] = batchRows
                .filter(row => row.spot_name !== 'Остаток на Складе') // Exclude any lingering DB warehouse rows
                .map(row => {
                    const sId = spotNameToId[normalizeStoreName(row.spot_name)];
                    const pId = row.product_id;
                    const stock = sId && pId ? stockMap[`${sId}_${pId}`] : null;
                    const minStock = sId && pId ? minStockMap[`${sId}_${pId}`] : null;
                    const sales = sId && pId ? salesMap[`${sId}_${pId}`] : null;

                    return {
                        "Название продукта": row.product_name,
                        "Магазин": row.spot_name,
                        "Факт. залишок": stock !== undefined ? stock : null,
                        "Мін. залишок": minStock !== undefined ? minStock : null,
                        "Сер. продажі": sales !== undefined ? sales : null,
                        "Количество": row.quantity_to_ship,
                        "Время расчета": row.business_date
                    };
                });

            // Aggregate LOCAL distributed quantity by product_id
            const distributedMap: Record<string, number> = {};
            batchRows.forEach(row => {
                if (row.spot_name !== 'Остаток на Складе') {
                    distributedMap[row.product_id] = (distributedMap[row.product_id] || 0) + row.quantity_to_ship;
                }
            });

            // Aggregate production quantity and map names by product_id
            const productionMap: Record<string, number> = {};
            const productNamesMap: Record<string, string> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (prodData as any[] || []).forEach(row => {
                if (row.product_id) {
                    productionMap[row.product_id] = (productionMap[row.product_id] || 0) + row.quantity;
                    productNamesMap[row.product_id] = row.product_name;
                }
            });

            // Calculate remainders using product_id
            const remainderRows: GravitonResult[] = [];
            for (const [prodId, prodQty] of Object.entries(productionMap)) {
                const distributed = distributedMap[prodId] || 0;
                const remaining = Math.floor(prodQty) - distributed;
                if (remaining > 0) {
                    remainderRows.push({
                        "Название продукта": productNamesMap[prodId] || 'Невідомий продукт',
                        "Магазин": "Вільні залишки на складі",
                        "Количество": remaining,
                        "Время расчета": businessDate
                    });
                }
            }

            // Combine and sort
            const finalData = [...mappedData, ...remainderRows].sort((a, b) => {
                const nameA = a["Название продукта"];
                const nameB = b["Название продукта"];
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return a["Магазин"].localeCompare(b["Магазин"]);
            });

            setTableData(finalData);
        } catch (err) {
            console.error(`Error fetching batch results for ${batchId}:`, err);
        } finally {
            setTableLoading(false);
        }
    };

    // Global Refresh logic
    const handleRefresh = () => {
        if (currentBatchId) {
            fetchBatchTableData(currentBatchId);
        } else {
            fetchPublicTableData();
        }
    };

    // Initial Load
    useEffect(() => {
        fetchShops();
        fetchPublicTableData();
    }, []);

    // Run Algorithm
    const handleRunDistribution = async () => {
        if (loading || shopsLoading || shops.length === 0) return;

        setLoading(true);
        setLastRunMessage(null);
        try {
            if (selectedShops.length === 0) {
                throw new Error('Оберіть хоча б один магазин!');
            }

            const allSelected = selectedShops.length === shops.length;

            const res = await fetch('/api/graviton/distribution/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop_ids: allSelected ? null : selectedShops })
            });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Помилка виконання розподілу');
            }

            let msg = `Batch: ${data.batch_id?.slice(0, 8)} | Позицій: ${data.products_processed} | Вага: ${data.total_kg} кг`;
            if (data.live_sync?.partial_sync) {
                msg += ` (Увага: Часткова синхронізація)`;
            }

            setLastRunMessage(msg);
            setCurrentBatchId(data.batch_id);
            setCurrentBatchMeta(data);
            await fetchBatchTableData(data.batch_id);
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
                    {!shopsLoading && (
                        <ShopSelector shops={shops} selectedShops={selectedShops} setSelectedShops={setSelectedShops} />
                    )}

                    <button
                        onClick={handleRunDistribution}
                        disabled={loading || shopsLoading || shops.length === 0}
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
                {/* Batch Metadata Header */}
                {currentBatchMeta && (
                    <div className="bg-accent-primary/5 border-b border-accent-primary/20 p-4 shrink-0 shadow-inner">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border",
                                    currentBatchMeta.full_run
                                        ? "bg-status-ok/20 text-status-ok border-status-ok/30"
                                        : "bg-status-warning/20 text-status-warning border-status-warning/30"
                                )}>
                                    {currentBatchMeta.full_run ? 'Full Run' : 'Partial Run'}
                                </div>
                                <div className="text-sm font-mono text-text-secondary">
                                    <span className="text-text-primary/50">Batch:</span> {currentBatchMeta.batch_id.slice(0, 8)}
                                </div>
                                <div className="text-sm font-mono text-text-secondary border-l border-panel-border pl-3">
                                    <span className="text-text-primary/50">Дата:</span> {currentBatchMeta.business_date}
                                </div>
                                <div className="text-sm font-mono text-text-secondary border-l border-panel-border pl-3">
                                    <span className="text-text-primary/50">Позицій:</span> <span className="text-text-primary font-bold">{currentBatchMeta.products_processed}</span>
                                </div>
                                <div className="text-sm font-mono text-text-secondary border-l border-panel-border pl-3">
                                    <span className="text-text-primary/50">Вага:</span> <span className="text-text-primary font-bold">{currentBatchMeta.total_kg} кг</span>
                                </div>
                                {!currentBatchMeta.full_run && currentBatchMeta.selected_shop_ids && (
                                    <div className="text-sm font-sans text-text-secondary border-l border-panel-border pl-3">
                                        <span className="text-text-primary/50">Обрано магазинів:</span> <span className="text-text-primary font-bold">{currentBatchMeta.selected_shop_ids.length}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setCurrentBatchId(null);
                                    setCurrentBatchMeta(null);
                                    fetchPublicTableData();
                                }}
                                className="text-xs font-semibold tracking-wide text-text-secondary hover:text-text-primary underline decoration-text-secondary/30 hover:decoration-text-primary transition-colors whitespace-nowrap"
                            >
                                Повернутись до загальної вітрини
                            </button>
                        </div>
                    </div>
                )}
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
                                    <th className="py-4 px-6 text-[10px] font-black tracking-widest text-text-secondary uppercase text-right">Факт. залишок</th>
                                    <th className="py-4 px-6 text-[10px] font-black tracking-widest text-text-secondary uppercase text-right">Мін. залишок</th>
                                    <th className="py-4 px-6 text-[10px] font-black tracking-widest text-text-secondary uppercase text-right">Сер. продажі</th>
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
                                        <td className="py-3 px-6 text-right text-xs font-mono text-text-secondary">
                                            {row['Факт. залишок'] != null ? Number(row['Факт. залишок']).toFixed(2) : '-'}
                                        </td>
                                        <td className="py-3 px-6 text-right text-xs font-mono text-text-secondary">
                                            {row['Мін. залишок'] != null ? Number(row['Мін. залишок']).toFixed(0) : '-'}
                                        </td>
                                        <td className="py-3 px-6 text-right text-xs font-mono text-text-secondary">
                                            {row['Сер. продажі'] != null ? Number(row['Сер. продажі']).toFixed(2) : '-'}
                                        </td>
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
                        onClick={handleRefresh}
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
