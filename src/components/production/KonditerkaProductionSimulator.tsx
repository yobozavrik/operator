'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Settings2, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface PlanItem {
    plan_day: number;
    product_name: string;
    quantity: number;
    risk_index: number;
    prod_rank: number;
    plan_metadata: {
        deficit: number;
        avg_sales: number;
        was_inflated: boolean;
    };
}

export default function KonditerkaProductionSimulator() {
    const [days, setDays] = useState<number>(3);
    const [planData, setPlanData] = useState<PlanItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchPlan = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Виклик RPC-функції Supabase для Кондитерки
                const { data, error } = await supabase.rpc('f_generate_production_plan_konditerka', {
                    p_days: days
                });

                if (error) throw error;

                if (data) {
                    // Map the response fields back to the PlanItem interface
                    // f_generate_production_plan_konditerka returns: plan_day, product_name, quantity, predicted_risk
                    setPlanData(data as PlanItem[]);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                console.error('Error fetching plan:', err);
                setError(err.message);
                // У разі помилки можна очистити дані або показати попередні
                setPlanData([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Дебаунс 600мс для зменшення кількості запитів при перетягуванні повзунка
        const timer = setTimeout(() => {
            fetchPlan();
        }, 600);

        return () => clearTimeout(timer);
    }, [capacity, days]);

    // Групування по днях та категоріях
    const groupedPlan = useMemo(() => {
        const groups: Record<number, { desserts: PlanItem[], morozivo: PlanItem[] }> = {};

        for (let i = 1; i <= days; i++) {
            groups[i] = { desserts: [], morozivo: [] };
        }

        planData.forEach(row => {
            if (!groups[row.plan_day]) return;
            const category = (row.plan_metadata as any)?.category;
            if (category === 'Морозиво') {
                groups[row.plan_day].morozivo.push(row);
            } else {
                groups[row.plan_day].desserts.push(row);
            }
        });

        return groups;
    }, [planData, days]);

    return (
        <div className="h-full bg-bg-primary p-4 md:p-8 font-sans text-text-primary overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Панель управління потужністю */}
                <div className="bg-panel-bg border border-panel-border rounded-2xl shadow-[var(--panel-shadow)] p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 font-[family-name:var(--font-chakra)] uppercase tracking-wide">
                                <Settings2 className="w-6 h-6 text-[#00E0FF]" />
                                Симулятор Виробництва (План на {days} дні)
                            </h2>
                            <p className="text-sm text-text-secondary mt-1 font-[family-name:var(--font-jetbrains)]">
                                Налаштуйте ліміт, щоб побачити перерахунок автозамовлення для Десертів та Морозива
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <span className="text-4xl font-black text-[#00E0FF] font-[family-name:var(--font-chakra)] drop-shadow-[0_0_10px_rgba(0,224,255,0.3)]">
                                {capacity} <span className="text-lg text-text-secondary font-medium font-sans">од.</span>
                            </span>
                        </div>
                    </div>

                    <div className="relative pt-2">
                        <input
                            type="range"
                            min="100"
                            max="600"
                            step="20"
                            value={capacity}
                            onChange={(e) => setCapacity(Number(e.target.value))}
                            className="w-full h-2 bg-panel-border rounded-full appearance-none cursor-pointer accent-[#00E0FF] focus:outline-none focus:ring-2 focus:ring-[#00E0FF]"
                        />
                        <div className="flex justify-between text-[11px] text-text-secondary mt-3 font-bold px-1 uppercase tracking-widest font-[family-name:var(--font-jetbrains)]">
                            <span>100 (Мін)</span>
                            <span className="text-[#00E0FF] font-black drop-shadow-[0_0_5px_rgba(0,224,255,0.5)]">320 (Норма)</span>
                            <span>600 (Макс)</span>
                        </div>
                    </div>

                    {/* Horizon Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-5 border-t border-panel-border mt-5">
                        <span className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2 font-[family-name:var(--font-jetbrains)]">
                            <TrendingUp size={16} className="text-[#00E0FF]" />
                            Горизонт планування:
                        </span>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDays(d)}
                                    className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all border tracking-widest font-[family-name:var(--font-jetbrains)] ${days === d
                                        ? 'bg-[#00E0FF]/10 border-[#00E0FF]/50 text-[#00E0FF] shadow-[0_0_10px_rgba(0,224,255,0.2)]'
                                        : 'bg-bg-primary border-panel-border text-text-secondary hover:text-text-primary hover:border-text-muted hover:bg-panel-border/30'
                                        }`}
                                >
                                    {d} {d === 1 ? 'ДЕНЬ' : 'ДНІ'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Помилка */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 font-[family-name:var(--font-jetbrains)] backdrop-blur-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold text-sm">Помилка: {error}</span>
                    </div>
                )}

                {/* Результати (Таблиці по днях) */}
                <div className="space-y-8 relative min-h-[400px]">
                    {/* Індикатор завантаження */}
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-bg-primary/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center transition-all duration-300">
                            <div className="flex flex-col items-center gap-3 text-orange-500 bg-panel-bg px-8 py-6 rounded-2xl shadow-[var(--panel-shadow)] border border-panel-border">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-xs font-bold tracking-widest uppercase font-[family-name:var(--font-jetbrains)] text-text-primary">Перерахунок плану...</span>
                            </div>
                        </div>
                    )}

                    <div className="w-7 h-7 rounded-lg bg-[#00E0FF]/10 text-[#00E0FF] border border-[#00E0FF]/30 flex items-center justify-center font-bold text-sm shadow-[0_0_8px_rgba(0,224,255,0.15)]">
                        Д{day}
                    </div>
                    Зміна {day}
                </h3>
                <div className="text-sm font-black text-[#00E0FF] bg-[#00E0FF]/10 px-3 py-1 rounded-full border border-[#00E0FF]/20 shadow-[0_0_10px_rgba(0,224,255,0.1)] font-[family-name:var(--font-jetbrains)]">
                    {totalForDay > 0 ? `${totalForDay} шт.` : '—'}
                </div>
            </div>
            <div className="flex-1 p-2 overflow-y-auto max-h-[600px] custom-scrollbar">
                {morozivoPlan.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center h-32 text-text-muted text-xs uppercase tracking-widest font-[family-name:var(--font-jetbrains)] font-bold">Немає даних</div>
                ) : (
                    <ul className="space-y-1">
                        {morozivoPlan.map((row, idx) => (
                            <li key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-primary transition-colors border border-transparent hover:border-panel-border group">
                                <div className="flex flex-col">
                                    <span className="font-bold text-text-primary text-sm group-hover:text-[#00E0FF] transition-colors leading-tight">{row.product_name}</span>
                                    <div className="flex items-center gap-2 mt-2 leading-none">
                                        <span className="text-[10px] text-text-secondary font-mono tracking-wide px-1.5 py-0.5 rounded bg-panel-border/30 border border-panel-border">R: {row.risk_index}</span>
                                    </div>
                                </div>
                                <div className="text-right pl-3 flex-shrink-0">
                                    <span className="text-lg font-black text-[#00E0FF] tabular-nums font-[family-name:var(--font-chakra)] p-2">{row.quantity}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
})}
                        </div >
                    </div >
                </div >

            </div >
        </div >
    );
}
