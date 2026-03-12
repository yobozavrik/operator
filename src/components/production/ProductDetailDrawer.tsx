import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product: any | null; // Product with computed stats
}

export function ProductDetailDrawer({ isOpen, onClose, product }: DrawerProps) {
    if (!isOpen || !product) {
        return null; // Don't render if not open or no product
    }

    const { stores = [] } = product;
    const unit: 'шт' | 'кг' = product.unit === 'кг' ? 'кг' : 'шт';

    // Handle closing when clicking outside the panel (optional, but good UX)
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity p-4 lg:p-8"
            onClick={handleBackdropClick}
        >
            <div
                className="w-full max-w-[1400px] h-auto max-h-[90vh] rounded-2xl overflow-hidden bg-[#112240]/95 backdrop-blur-md border border-[#00E0FF]/20 shadow-[0_0_30px_rgba(0,224,255,0.15)] flex flex-col transform transition-transform animate-in zoom-in-95 duration-200"
            >
                {/* HEAD */}
                <div className="flex items-start justify-between p-5 px-8 border-b border-[#00E0FF]/10 shrink-0">
                    <div className="flex items-center gap-12">
                        <div className="flex flex-col justify-center">
                            <div className="text-[10px] text-[#00E0FF] font-bold uppercase tracking-[0.2em] flex items-center gap-2 font-[family-name:var(--font-jetbrains)]">
                                <span>Деталі товару</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white uppercase tracking-wider leading-none mt-2 font-[family-name:var(--font-chakra)]">
                                {product.name}
                            </h2>
                        </div>

                        {/* Summary Metrics Inline with Title */}
                        <div className="flex items-center gap-8 mt-2">
                            <div className="flex flex-col justify-end">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-2 font-[family-name:var(--font-jetbrains)]">Факт Залишок</div>
                                <div className={cn(
                                    "text-3xl font-mono font-black leading-none flex items-baseline gap-1 font-[family-name:var(--font-jetbrains)]",
                                    product.computed.totalUrgentDeficit > 0 ? "text-status-critical drop-shadow-[0_0_8px_rgba(255,42,85,0.5)]" : "text-status-success drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                )}>
                                    {product.computed.totalStock.toFixed(0)} <span className="text-[11px] font-bold text-slate-500 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">{unit}</span>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/10 hidden md:block"></div>
                            <div className="flex flex-col justify-end">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-2 font-[family-name:var(--font-jetbrains)]">Треба (Ціль)</div>
                                <div className="text-3xl font-mono font-black text-[#00E0FF] leading-none flex items-baseline gap-1 font-[family-name:var(--font-jetbrains)] drop-shadow-[0_0_8px_rgba(0,224,255,0.4)]">
                                    {product.computed.totalRecommended.toFixed(0)} <span className="text-[11px] font-bold text-[#00E0FF]/50 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">{unit}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-3 rounded-xl bg-panel-border/30 text-text-muted hover:text-text-primary hover:bg-panel-border/50 transition-colors mt-2"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* SHOPS GRID */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {stores.map((store: any, index: number) => {
                            const isLowStock = store.computed.stock < store.computed.minStock;

                            return (
                                <div
                                    key={store.storeName || index}
                                    className={cn(
                                        "rounded-xl p-4 flex flex-col gap-2 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,224,255,0.15)]",
                                        isLowStock
                                            ? "bg-status-critical/5 border border-status-critical/30 shadow-[0_0_15px_rgba(255,42,85,0.1)] hover:border-status-critical/50"
                                            : "bg-[#0A1931]/60 border border-[#00E0FF]/10 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:border-[#00E0FF]/30"
                                    )}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>
                                    {/* Store Name */}
                                    <div
                                        className="text-sm font-semibold text-white uppercase tracking-wider truncate text-center font-[family-name:var(--font-chakra)]"
                                        title={store.storeName}
                                    >
                                        {store.storeName.replace('Магазин ', '')}
                                    </div>

                                    {/* Metrics Row */}
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 mb-1 uppercase font-[family-name:var(--font-jetbrains)]">Факт</span>
                                            <span className={cn(
                                                "text-lg font-bold font-[family-name:var(--font-jetbrains)] leading-none",
                                                isLowStock ? "text-status-critical drop-shadow-[0_0_8px_rgba(255,42,85,0.5)]" : "text-status-success drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                            )}>
                                                {store.computed.stock.toFixed(0)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 mb-1 uppercase font-[family-name:var(--font-jetbrains)]">Мін</span>
                                            <span className="text-lg font-bold font-[family-name:var(--font-jetbrains)] leading-none text-slate-300">
                                                {store.computed.minStock.toFixed(0)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 mb-1 uppercase font-[family-name:var(--font-jetbrains)]">Сер</span>
                                            <span className="text-lg font-bold font-[family-name:var(--font-jetbrains)] leading-none text-[#00E0FF]">
                                                {store.computed.avg.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
