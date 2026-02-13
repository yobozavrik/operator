'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { ProductionTask } from '@/types/bi';
import { cn } from '@/lib/utils';
import { generateProductionPlanExcel } from '@/lib/order-export';
import { Activity, Percent, TrendingUp, Calculator, Package, AlertTriangle, ChevronDown, FileSpreadsheet, Loader2 } from 'lucide-react';

interface Props {
    data: ProductionTask[];
    onRefresh: () => void;
}

export const ProductionOpsTable = ({ data, onRefresh }: Props) => {
    // 2. State
    const [days, setDays] = useState(1);
    const [isShiftMode, setIsShiftMode] = useState(false);
    const [selectedPizza, setSelectedPizza] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    // 3. Execution State
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isCalculated, setIsCalculated] = useState(false);
    const [planData, setPlanData] = useState<any[]>([]);

    // 4. Shop Stats
    const { data: shopStats } = useSWR<any[]>(
        selectedPizza ? `/api/pizza/shop-stats?pizza=${encodeURIComponent(selectedPizza)}` : null,
        (url: string) => fetch(url).then(r => r.json())
    );

    const handleGenerateOrder = async () => {
        setIsLoading(true);
        setPlanData([]);
        setIsCalculated(false);
        setSelectedPizza(null);

        try {
            const queryParams = new URLSearchParams({
                days: isShiftMode ? '3' : days.toString()
            });

            const response = await fetch(`/api/pizza/order-plan?${queryParams}`);

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            setPlanData(data);
            setIsCalculated(true);

        } catch (error) {
            console.error("Calculation failed:", error);
            alert("Помилка розрахунку");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportExcel = async () => {
        if (planData.length === 0) return;
        setIsExporting(true);
        try {
            await generateProductionPlanExcel(planData, isShiftMode ? 3 : days);
            setNotification('Файл успішно збережено!');
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Помилка експорту');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0B0E14] overflow-hidden font-sans">
            {/* 1. MANAGEMENT BLOCK (Control Panel) */}
            <div className="px-8 py-6 bg-[#0F1220]/80 border-b border-white/5 shrink-0 relative flex items-center gap-10 backdrop-blur-xl z-20 shadow-2xl transition-all">

                {/* Notification Toast */}
                {notification && (
                    <div className="absolute top-2 right-8 bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 z-30 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                        {notification}
                    </div>
                )}

                {/* Days Input Group */}
                <div className="flex items-center gap-4 group/input">
                    <div className="flex flex-col">
                        <label className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 transition-colors",
                            isShiftMode ? "text-white/20" : "text-white/40 group-hover/input:text-[#FFB800]"
                        )}>
                            Планування
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={isShiftMode ? 3 : days}
                                disabled={isShiftMode}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) setDays(Math.max(1, val));
                                }}
                                className={cn(
                                    "w-24 h-12 bg-black/40 border-2 rounded-xl text-center font-mono font-black text-xl text-white focus:outline-none transition-all duration-300",
                                    isShiftMode
                                        ? "border-transparent text-white/10 opacity-30 cursor-not-allowed"
                                        : "border-white/5 focus:border-[#FFB800] focus:shadow-[0_0_20px_rgba(255,184,0,0.15)] group-hover/input:border-white/10"
                                )}
                            />
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-widest",
                                "text-white/30"
                            )}>Днів</span>
                        </div>
                    </div>
                </div>

                <div className="h-10 w-px bg-white/5" />

                {/* 3x3 Toggle Segment */}
                <div className="flex flex-col">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-white/40">
                        Режим роботи
                    </label>
                    <div
                        onClick={() => setIsShiftMode(!isShiftMode)}
                        className="flex items-center gap-4 cursor-pointer group select-none bg-black/40 border-2 border-white/5 hover:border-white/10 px-4 py-2 rounded-xl transition-all h-12"
                    >
                        <div className={cn(
                            "relative w-12 h-6 rounded-full transition-all duration-500",
                            isShiftMode ? "bg-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.3)]" : "bg-white/10"
                        )}>
                            <div className={cn(
                                "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-500 shadow-xl",
                                isShiftMode ? "translate-x-6" : "translate-x-0"
                            )} />
                        </div>
                        <span className={cn(
                            "text-xs font-black uppercase tracking-widest transition-colors",
                            isShiftMode ? "text-white" : "text-white/40 group-hover:text-white"
                        )}>
                            Режим 3х3
                        </span>
                    </div>
                </div>

                <div className="flex-1" />

                {/* EXPORT BUTTON */}
                {isCalculated && (
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className={cn(
                            "flex items-center gap-3 px-6 py-4 bg-[#10B981]/10 border border-[#10B981]/20 hover:bg-[#10B981]/20 active:scale-95 text-[#10B981] font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all mr-4 disabled:opacity-50 disabled:cursor-not-allowed",
                            isExporting && "animate-pulse"
                        )}
                    >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={18} strokeWidth={2.5} />}
                        {isExporting ? "Експорт..." : "Excel звір"}
                    </button>
                )}

                {/* Action Button */}
                <button
                    onClick={handleGenerateOrder}
                    disabled={isLoading}
                    className={cn(
                        "flex items-center gap-4 px-10 py-4 bg-gradient-to-r from-[#00D4FF] to-[#0088FF] hover:to-[#00D4FF] active:scale-95 text-[#0B0E14] font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all shadow-[0_10px_30px_rgba(0,212,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,212,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed",
                        isLoading && "animate-pulse"
                    )}
                >
                    <Calculator size={20} strokeWidth={3} />
                    {isLoading ? "Розрахунок..." : "Розрахувати"}
                </button>
            </div>

            {/* 2. RESULTS GRID */}
            <div className="flex-1 overflow-auto bg-[#0B0E14] relative text-white px-8 py-6 custom-scrollbar">

                {/* LOADING / EMPTY STATES */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0B0E14]/90 z-30 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 blur-2xl bg-[#FFB800]/20 animate-pulse rounded-full" />
                                <Calculator className="animate-[spin_3s_linear_infinite] text-[#FFB800] relative z-10" size={64} />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xl font-black uppercase tracking-[0.3em] text-white">Аналіз даних</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-2">Формування оптимального замовлення</span>
                            </div>
                        </div>
                    </div>
                )}

                {!isCalculated && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
                            <Activity size={40} className="animate-pulse" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-[0.2em] mb-2 text-white">Готовий до розрахунку</h3>
                        <p className="text-xs font-medium text-white/40 tracking-wider">Оберіть дні та натисніть кнопку "Розрахувати"</p>
                    </div>
                )}

                {/* RESULTS - HORIZONTAL TAPE + FULL GRID LAYOUT */}
                {isCalculated && !isLoading && (
                    <div className="flex flex-col gap-10 pb-10">
                        {Object.entries(planData.reduce((acc, item) => {
                            (acc[item.p_day] = acc[item.p_day] || []).push(item);
                            return acc;
                        }, {} as Record<number, any[]>))
                            .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
                            .map(([day, items]: [string, any]) => (
                                <div key={day} className="flex flex-col gap-4">
                                    {/* DAY HEADER */}
                                    <div className="flex items-center gap-6 px-2 mb-2">
                                        <div className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-black uppercase tracking-[0.3em] shadow-lg">
                                            День <span className="text-[#00D4FF] ml-1">{day}</span>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-white/10 via-transparent to-transparent flex-1" />
                                        <div className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">
                                            {items.length} ПРЕДМЕТІВ
                                        </div>
                                    </div>

                                    {/* HORIZONTAL TAPE OF CARDS */}
                                    <div className="flex gap-4 overflow-x-auto pb-6 px-1 custom-scrollbar snap-x">
                                        {items.sort((a: any, b: any) => (Number(b.p_avg) || 0) - (Number(a.p_avg) || 0)).map((item: any, idx: number) => {
                                            const isSelected = selectedPizza === item.p_name;
                                            const pStock = Number(item.p_stock);
                                            const pOrder = Number(item.p_order);
                                            const target = pStock + pOrder;
                                            const percentage = target === 0 ? 100 : Math.min(100, (pStock / target) * 100);

                                            const isCritical = percentage < 60;
                                            const isWarning = percentage >= 60 && percentage < 90;

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedPizza(prev => prev === item.p_name ? null : item.p_name)}
                                                    className={cn(
                                                        "min-w-[280px] snap-start bg-[#141829]/40 border rounded-2xl transition-all duration-500 cursor-pointer select-none group/card relative backdrop-blur-sm",
                                                        isSelected
                                                            ? "ring-2 ring-[#00D4FF] border-[#00D4FF]/20 shadow-[0_15px_40px_rgba(0,212,255,0.2)] bg-[#141829]/80 scale-[1.02]"
                                                            : "border-white/5 hover:border-white/20 hover:bg-[#141829]/60"
                                                    )}
                                                >
                                                    {/* Status Indicator Bar */}
                                                    <div className={cn(
                                                        "h-1 w-full rounded-t-2xl",
                                                        isCritical ? "bg-red-500 shadow-[0_0_10px_#ef4444]" :
                                                            isWarning ? "bg-amber-500 shadow-[0_0_10px_#f59e0b]" :
                                                                "bg-emerald-500 shadow-[0_0_10px_#10b981]"
                                                    )} />

                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between gap-3 mb-4">
                                                            <h4 className="text-[11px] font-black text-white/90 leading-tight tracking-tight uppercase group-hover/card:text-white transition-colors truncate" title={item.p_name}>
                                                                {item.p_name}
                                                            </h4>
                                                            {isCritical && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                                                        </div>

                                                        <div className="flex items-end justify-between mb-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] mb-0.5">ЗАМОВЛЕННЯ</span>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className={cn(
                                                                        "text-3xl font-black font-mono leading-none tracking-tighter",
                                                                        pOrder > 0 ? "text-[#00D4FF]" : "text-white/10"
                                                                    )}>
                                                                        {pOrder.toFixed(0)}
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-white/20 uppercase">шт</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] mb-0.5">ФАКТ</span>
                                                                <span className={cn(
                                                                    "text-lg font-black font-mono leading-none",
                                                                    isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-500"
                                                                )}>
                                                                    {pStock.toFixed(0)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="relative h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 mb-3">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-1000",
                                                                    isCritical ? "bg-red-500" :
                                                                        isWarning ? "bg-amber-500" :
                                                                            "bg-emerald-500"
                                                                )}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest pt-1 border-t border-white/5">
                                                            <div className="flex gap-3">
                                                                <span>Мін <span className="text-white/80 font-mono ml-0.5">{Number(item.p_min).toFixed(0)}</span></span>
                                                                <span>Сер <span className="text-white/80 font-mono ml-0.5">{Number(item.p_avg).toFixed(1)}</span></span>
                                                            </div>
                                                            <ChevronDown size={12} className={cn("transition-transform duration-500", isSelected && "rotate-180 text-[#00D4FF]")} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* FULL GRID ANALYTICS (Appears when a pizza is selected) */}
                                    {selectedPizza && items.some((i: any) => i.p_name === selectedPizza) && (
                                        <div className="mt-2 bg-[#0F1220]/60 border border-white/5 rounded-3xl p-8 animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-md shadow-2xl">
                                            <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-2 h-8 bg-[#00D4FF] rounded-full shadow-[0_0_15px_rgba(0,212,255,0.4)]" />
                                                    <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white">
                                                        Аналітика: <span className="text-[#00D4FF]">{selectedPizza}</span>
                                                    </h3>
                                                </div>
                                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                                    {shopStats?.length || 0} ТОЧОК ПРОДАЖУ ТА ПРІОРИТЕТІВ
                                                </div>
                                            </div>

                                            {!shopStats ? (
                                                <div className="py-20 flex flex-col items-center gap-6">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 blur-2xl bg-[#00D4FF]/20 animate-pulse rounded-full" />
                                                        <Activity className="animate-spin text-[#00D4FF] relative z-10" size={48} />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-[0.3em] text-white/20">Отримання даних по магазинах...</span>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                                    {[...shopStats]
                                                        .sort((a, b) => (b.avg_sales_day || 0) - (a.avg_sales_day || 0))
                                                        .map((stat, sIdx) => {
                                                            const isDeficit = (stat.stock_now || 0) <= (stat.min_stock || 0);
                                                            const need = Math.max(0, Math.ceil((stat.avg_sales_day * days) + (stat.min_stock || 0) - (stat.stock_now || 0)));

                                                            return (
                                                                <div key={sIdx} className={cn(
                                                                    "rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between group/shop relative overflow-hidden",
                                                                    isDeficit
                                                                        ? "bg-red-500/10 border-red-500/20 shadow-[0_10px_30px_rgba(239,68,68,0.05)]"
                                                                        : "bg-black/30 border-white/5 hover:border-white/20"
                                                                )}>
                                                                    <div className="flex flex-col mb-4">
                                                                        <h5 className="text-xs font-black uppercase tracking-tight text-white/80 group-hover/shop:text-white transition-colors mb-2 truncate" title={stat.spot_name}>
                                                                            {stat.spot_name}
                                                                        </h5>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">СЕР.ПРОДАЖІ:</span>
                                                                            <span className="text-sm font-mono font-black text-[#00D4FF]">
                                                                                {Number(stat.avg_sales_day || 0).toFixed(1)}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-end justify-between pt-4 border-t border-white/5">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[8px] font-black text-white/20 uppercase mb-1">ФАКТ</span>
                                                                            <span className={cn("text-xl font-mono font-black leading-none", isDeficit ? "text-red-400" : "text-emerald-400")}>
                                                                                {stat.stock_now || 0}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-[8px] font-black text-[#58A6FF] uppercase mb-1 drop-shadow-[0_0_8px_rgba(88,166,255,0.3)]">ТРЕБА</span>
                                                                            <span className="text-2xl font-mono font-black text-[#58A6FF] leading-none">
                                                                                {need.toFixed(0)}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {isDeficit && (
                                                                        <div className="absolute top-2 right-2">
                                                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};
