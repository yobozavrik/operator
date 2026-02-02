'use client';

import React, { useState, useMemo } from 'react';
import { SKU, STORES } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, Info } from 'lucide-react';

const Sparkline = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return (
        <div className="flex items-end gap-0.5 h-6 w-16">
            {data.map((val, i) => (
                <div
                    key={i}
                    className="w-1.5 bg-brand-primary/40 rounded-t-sm"
                    style={{ height: `${((val - min) / range) * 100}%`, minHeight: '2px' }}
                />
            ))}
        </div>
    );
};

export const MatrixTable = ({ skus }: { skus: SKU[] }) => {
    const [onlyCritical, setOnlyCritical] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Все');

    const filteredSkus = useMemo(() => {
        return skus.filter(sku => {
            const matchesSearch = sku.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'Все' || sku.category === selectedCategory;
            const matchesCritical = !onlyCritical || sku.outOfStockStores > 0;
            return matchesSearch && matchesCategory && matchesCritical;
        });
    }, [skus, searchQuery, selectedCategory, onlyCritical]);

    const categories = ['Все', ...Array.from(new Set(skus.map(s => s.category)))];

    const getCellColor = (stock: number, threshold: number) => {
        if (stock === 0) return 'bg-status-high/20 text-status-high font-black border border-status-high/30';
        if (stock < threshold / 6) return 'bg-status-medium/10 text-status-medium font-bold border border-status-medium/20';
        return 'bg-white/5 text-slate-300 font-medium border border-white/5';
    };

    return (
        <div className="space-y-6">
            {/* Фильтры */}
            <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setOnlyCritical(!onlyCritical)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
                            onlyCritical
                                ? "bg-status-high/10 border-status-high/30 text-status-high shadow-lg shadow-status-high/10"
                                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        )}
                    >
                        Только критические (Out of Stock)
                    </button>

                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-brand-primary appearance-none cursor-pointer"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Найти SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-brand-primary transition-colors"
                    />
                </div>
            </div>

            {/* Тепловая карта */}
            <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="w-64 px-6 py-5 text-[10px] uppercase tracking-widest font-black text-slate-500 border-r border-white/5">
                                    Товар / Категория
                                </th>
                                {STORES.map(store => (
                                    <th key={store} className="px-3 py-5 text-[10px] uppercase tracking-widest font-black text-slate-500 text-center">
                                        {store}
                                    </th>
                                ))}
                                <th className="w-40 px-6 py-5 text-[10px] uppercase tracking-widest font-black text-slate-500 text-right border-l border-white/5">
                                    Всего (КГ)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSkus.map((sku) => (
                                <tr key={sku.id} className="group hover:bg-white/5 transition-colors duration-150">
                                    <td className="px-6 py-4 border-r border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white truncate">{sku.name}</span>
                                            <span className="text-[10px] text-slate-500 font-medium">{sku.category}</span>
                                        </div>
                                    </td>

                                    {STORES.map(store => {
                                        const stock = sku.storeStocks[store];
                                        const threshold = sku.minStockThresholdKg;
                                        return (
                                            <td key={store} className="px-2 py-3">
                                                <div className={cn(
                                                    "h-10 flex items-center justify-center rounded-lg text-xs transition-all duration-300",
                                                    getCellColor(stock, threshold)
                                                )}>
                                                    {stock > 0 ? `${stock} кг` : '0.0 кг'}
                                                </div>
                                            </td>
                                        );
                                    })}

                                    <td className="px-6 py-4 border-l border-white/5 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm font-black text-brand-primary leading-none">
                                                {sku.totalStockKg}
                                            </span>
                                            <Sparkline data={sku.salesTrendKg} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredSkus.length === 0 && (
                    <div className="p-20 text-center text-slate-500 font-medium italic">
                        Товары не найдены по выбранным фильтрам
                    </div>
                )}
            </div>
        </div>
    );
};
