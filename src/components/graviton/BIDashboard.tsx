'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { ProductionTask, BI_Metrics, SupabaseDeficitRow } from '@/types/bi';
import { transformDeficitData, GRAVITON_SHOPS } from '@/lib/transformers';
import { SyncOverlay } from '@/components/SyncOverlay';
import { cn } from '@/lib/utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BackToHome } from '@/components/BackToHome';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BIPowerMatrix } from '@/components/BIPowerMatrix';
import { StoreSpecificView } from '@/components/StoreSpecificView';
import { PersonnelView } from '@/components/PersonnelView';
import { useStore } from '@/context/StoreContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useToast, AlertBanner } from '@/components/ui';

import { authedFetcher } from '@/lib/authed-fetcher';
const fetcher = authedFetcher;

const normalizeName = (value: string): string => {
    if (!value) return '';
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

import {
    MapPin,
    ArrowLeft,
    BarChart2,
    RefreshCw,
    Users,
    Truck,
    Activity,
    AlertTriangle,
    Info,
    TrendingUp,
    ChevronRight,
    Package,
    ClipboardList,
    LogOut,
    AlertCircle
} from 'lucide-react';

export const BIDashboard = () => {
    // Get store context
    const { selectedStore, setSelectedStore, currentCapacity } = useStore();
    const router = useRouter();
    const toast = useToast();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [realtimeEnabled, setRealtimeEnabled] = React.useState(true);
    const refreshInterval = realtimeEnabled ? 0 : 30000;

    const { data: deficitData, error: deficitError, mutate: mutateDeficit } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/deficit',
        fetcher,
        { refreshInterval }
    );

    const { data: metrics, error: metricsError, mutate: mutateMetrics } = useSWR<BI_Metrics>(
        '/api/graviton/metrics',
        fetcher,
        { refreshInterval }
    );

    const { data: allProductsData, error: allProductsError, mutate: mutateAllProducts } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/all-products',
        fetcher,
        { refreshInterval }
    );

    React.useEffect(() => {
        const channel = supabase
            .channel('dashboard-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'dashboard_deficit' },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                (payload) => {
                    mutateDeficit();
                    mutateMetrics();
                    mutateAllProducts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [mutateDeficit, mutateMetrics, mutateAllProducts]);

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
    const [dynamicMetrics, setDynamicMetrics] = React.useState<{
        totalKg: number;
        criticalWeight: number;
        reserveWeight: number;
        criticalSKU: number;
        reserveSKU: number;
    } | null>(null);

    const [planningDays, setPlanningDays] = React.useState(1);
    const [lastManualRefresh, setLastManualRefresh] = React.useState<number | null>(null);
    const [posterData, setPosterData] = React.useState<any[] | null>(null);
    const [posterManufactures, setPosterManufactures] = React.useState<any[] | null>(null);
    const [posterCatalog, setPosterCatalog] = React.useState<any[] | null>(null);
    const [posterShops, setPosterShops] = React.useState<any[] | null>(null);
    const [lastLiveSyncAt, setLastLiveSyncAt] = React.useState<string | null>(null);
    const [manufacturesWarning, setManufacturesWarning] = React.useState(false);
    const [productionSummary, setProductionSummary] = React.useState<{
        total_kg: number;
        storage_id: number;
        items_count: number;
    } | null>(null);

    const normalizeName = (value: string): string => {
        if (!value) return '';
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    };

    const syncMatchStats = useMemo(() => {
        if (!allProductsData || !posterData || !posterShops) return null;

        const shopBySpotId = new Map(posterShops.map(s => [s.spot_id, s]));
        const liveStocksByStorageAndName = new Map(
            posterData.map(s => [`${s.storage_id}::${s.ingredient_name_normalized}`, s])
        );

        let totalExpected = 0;
        let totalMatched = 0;
        const shopStats = new Map<number, { expected: number, matched: number, name: string }>();

        allProductsData.forEach(row => {
            const shop = shopBySpotId.get(row.код_магазину);
            if (!shop) return;

            if (!shopStats.has(shop.storage_id)) {
                shopStats.set(shop.storage_id, { expected: 0, matched: 0, name: shop.spot_name });
            }
            const stats = shopStats.get(shop.storage_id)!;
            stats.expected++;
            totalExpected++;

            const key = `${shop.storage_id}::${normalizeName(row.назва_продукту)}`;
            if (liveStocksByStorageAndName.has(key)) {
                stats.matched++;
                totalMatched++;
            }
        });

        return {
            totalExpected,
            totalMatched,
            percent: totalExpected > 0 ? (totalMatched / totalExpected) * 100 : 0,
            shopStats: Array.from(shopStats.entries()).map(([id, s]) => ({
                id,
                ...s,
                percent: s.expected > 0 ? (s.matched / s.expected) * 100 : 0
            }))
        };
    }, [allProductsData, posterData, posterShops]);


    const totalProductionKg = productionSummary?.total_kg || 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [showBreakdownModal, setShowBreakdownModal] = React.useState(false); // Legacy modal state kept for backward compat if needed

    React.useEffect(() => {
        const saved = localStorage.getItem('lastManualRefresh');
        if (saved) setLastManualRefresh(parseInt(saved, 10));
    }, []);

    const minutesSinceLastRefresh = useMemo(() => {
        if (!currentTime || !lastManualRefresh) return 0;
        return Math.floor((currentTime.getTime() - lastManualRefresh) / 60000);
    }, [currentTime, lastManualRefresh]);

    const refreshUrgency = useMemo(() => {
        if (!lastManualRefresh || minutesSinceLastRefresh < 45) return 'normal';
        if (minutesSinceLastRefresh < 60) return 'warning';
        return 'critical';
    }, [lastManualRefresh, minutesSinceLastRefresh]);

    React.useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = useMemo(() => {
        if (!currentTime) return '';
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const parts = new Intl.DateTimeFormat('uk-UA', options).formatToParts(currentTime);
        const weekday = parts.find(p => p.type === 'weekday')?.value || '';
        const day = parts.find(p => p.type === 'day')?.value || '';
        const month = parts.find(p => p.type === 'month')?.value || '';
        const year = parts.find(p => p.type === 'year')?.value || '';
        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1); // Saturday, 14 February 2026
        return `${capitalize(weekday)}, ${day} ${capitalize(month)} ${year}`;
    }, [currentTime]);

    const formattedTime = currentTime?.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '00:00:00';

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            const response = await fetch('/api/graviton/sync-stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setPosterData(result.live_stocks || []);
                setPosterManufactures(result.manufactures || []);
                setPosterCatalog(result.catalog || []);
                setPosterShops(result.shops || []);
                setLastLiveSyncAt(result.timestamp);
                setManufacturesWarning(!!result.manufactures_warning);
                setProductionSummary(result.production_summary || null);

                const now = Date.now();
                setLastManualRefresh(now);
                localStorage.setItem('lastManualRefresh', now.toString());

                // Revalidate UI data
                await Promise.all([mutateDeficit(), mutateMetrics(), mutateAllProducts()]);

                if (result.partial_sync) {
                    const failedNames = (result.failed_storages || [])
                        .map((id: number) => result.shops?.find((s: any) => s.storage_id === id)?.spot_name || `ID ${id}`)
                        .join(', ');
                    toast.warning('Часткова синхронізація', `Не вдалося отримати live дані для: ${failedNames}. Використовуються застарілі залишки.`);
                } else if (result.manufactures_warning) {
                    toast.warning('Залишки оновлено', 'Виробництво за сьогодні недоступне, показано live залишки без корекції цеху');
                } else {
                    toast.success('Дані оновлено', 'Залишки синхронізовано з Poster');
                }
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (err: any) {
            console.error('Refresh error:', err);
            toast.error('Помилка оновлення', `Не вдалося отримати live залишки з Poster: ${err.message}`);
        } finally {
            setIsRefreshing(false);
        }
    };

    const mergedDeficitData = useMemo(() => {
        if (!deficitData || !Array.isArray(deficitData)) return [];
        if (!posterData || !posterShops) return deficitData;

        // Step 10: Build lookup maps
        const shopBySpotId = new Map(posterShops.map(s => [s.spot_id, s]));
        const liveStocksByStorageAndName = new Map(
            posterData.map(s => [`${s.storage_id}::${s.ingredient_name_normalized}`, s])
        );
        const manufacturedQtyByStorageAndName = new Map();
        if (posterManufactures) {
            posterManufactures.forEach(m => {
                const key = `${m.storage_id}::${m.product_name_normalized}`;
                manufacturedQtyByStorageAndName.set(key, (manufacturedQtyByStorageAndName.get(key) || 0) + m.quantity);
            });
        }

        return deficitData.map(row => {
            const spotId = row.код_магазину;
            const shop = shopBySpotId.get(spotId);
            const storageId = shop?.storage_id;
            const normalizedName = normalizeName(row.назва_продукту);

            let updatedStock = row.current_stock;
            let liveStockEntry = null;
            if (storageId) {
                const stockKey = `${storageId}::${normalizedName}`;
                liveStockEntry = liveStocksByStorageAndName.get(stockKey);
                if (liveStockEntry) {
                    updatedStock = liveStockEntry.stock_left;
                }
            }

            // --- Graviton specific logic (dynamic hub flag) ---
            if (shop?.is_production_hub && storageId) {
                const prodKey = `${storageId}::${normalizedName}`;
                const manufacturedToday = manufacturedQtyByStorageAndName.get(prodKey) || 0;
                updatedStock = updatedStock - manufacturedToday;
            }

            return {
                ...row,
                current_stock: updatedStock,
                is_live: !!liveStockEntry
            };
        });
    }, [deficitData, posterData, posterManufactures, posterShops]);

    const mergedAllProductsData = useMemo(() => {
        if (!allProductsData || !Array.isArray(allProductsData)) return [];
        if (!posterData || !posterShops) return allProductsData;

        const shopBySpotId = new Map(posterShops.map(s => [s.spot_id, s]));
        const liveStocksByStorageAndName = new Map(
            posterData.map(s => [`${s.storage_id}::${s.ingredient_name_normalized}`, s])
        );
        const manufacturedQtyByStorageAndName = new Map();
        if (posterManufactures) {
            posterManufactures.forEach(m => {
                const key = `${m.storage_id}::${m.product_name_normalized}`;
                manufacturedQtyByStorageAndName.set(key, (manufacturedQtyByStorageAndName.get(key) || 0) + m.quantity);
            });
        }

        return allProductsData.map(row => {
            const spotId = row.код_магазину;
            const shop = shopBySpotId.get(spotId);
            const storageId = shop?.storage_id;
            const normalizedName = normalizeName(row.назва_продукту);

            let updatedStock = row.current_stock;
            let liveStockEntry = null;
            if (storageId) {
                const stockKey = `${storageId}::${normalizedName}`;
                liveStockEntry = liveStocksByStorageAndName.get(stockKey);
                if (liveStockEntry) {
                    updatedStock = liveStockEntry.stock_left;
                }
            }

            if (shop?.is_production_hub && storageId) {
                const prodKey = `${storageId}::${normalizedName}`;
                const manufacturedToday = manufacturedQtyByStorageAndName.get(prodKey) || 0;
                updatedStock = updatedStock - manufacturedToday;
            }

            return {
                ...row,
                current_stock: updatedStock,
                is_live: !!liveStockEntry
            };
        });
    }, [allProductsData, posterData, posterManufactures, posterShops]);

    const deficitQueue = useMemo((): ProductionTask[] => {
        if (!mergedDeficitData) return [];
        const transformed = transformDeficitData(mergedDeficitData);

        if (posterManufactures && posterShops) {
            const manufacturedQtyByStorageAndName = new Map();
            posterManufactures.forEach(m => {
                const key = `${m.storage_id}::${m.product_name_normalized}`;
                manufacturedQtyByStorageAndName.set(key, (manufacturedQtyByStorageAndName.get(key) || 0) + m.quantity);
            });

            const productionHubStorageId = posterShops.find(s => s.is_production_hub)?.storage_id;

            if (productionHubStorageId) {
                return transformed.map(task => {
                    const prodKey = `${productionHubStorageId}::${normalizeName(task.name)}`;
                    const manufacturedToday = manufacturedQtyByStorageAndName.get(prodKey) || 0;
                    return { ...task, todayProduction: manufacturedToday };
                });
            }
        }
        return transformed;
    }, [mergedDeficitData, posterManufactures, posterShops]);

    const allProductsQueue = useMemo((): ProductionTask[] => {
        if (!mergedAllProductsData) return [];
        const transformed = transformDeficitData(mergedAllProductsData);

        if (posterManufactures && posterShops) {
            const manufacturedQtyByStorageAndName = new Map();
            posterManufactures.forEach(m => {
                const key = `${m.storage_id}::${m.product_name_normalized}`;
                manufacturedQtyByStorageAndName.set(key, (manufacturedQtyByStorageAndName.get(key) || 0) + m.quantity);
            });

            const productionHubStorageId = posterShops.find(s => s.is_production_hub)?.storage_id;

            if (productionHubStorageId) {
                return transformed.map(task => {
                    const prodKey = `${productionHubStorageId}::${normalizeName(task.name)}`;
                    const manufacturedToday = manufacturedQtyByStorageAndName.get(prodKey) || 0;
                    return { ...task, todayProduction: manufacturedToday };
                });
            }
        }
        return transformed;
    }, [mergedAllProductsData, posterManufactures, posterShops]);

    const dynamicStores = useMemo(() => {
        if (!deficitQueue || !Array.isArray(deficitQueue)) return [{ id: 'Усі', name: 'УСІ' }];

        const storeMap = new Map<string, boolean>();
        deficitQueue.forEach(task => {
            task.stores.forEach(s => {
                if (s.storeName && s.storeName !== 'Остаток на Складе') {
                    storeMap.set(s.storeName, true);
                }
            });
        });

        const storeNames = Array.from(storeMap.keys()).sort();

        return [
            { id: 'Усі', name: 'УСІ', icon: MapPin },
            ...storeNames.map(name => {
                const cleanName = name.replace('Магазин "', '').replace('"', '');
                return {
                    id: name,
                    name: `МАГАЗИН "${cleanName.toUpperCase()}"`,
                    icon: null
                };
            })
        ];
    }, [deficitQueue]);

    const handleStoreClick = (id: string) => {
        if (id === 'logistics') {
            router.push('/graviton/delivery');
        } else if (id === 'Планування') {
            router.push('/production/graviton/plan');
        } else {
            setSelectedStore(id);
        }
    };

    // Aggregate Product Deficits
    const aggregatedProducts = useMemo(() => {
        return deficitQueue
            .map(task => {
                const totalDeficit = task.stores.reduce((sum, store) => sum + (store.deficitKg || 0), 0);
                return { name: task.name, deficit: totalDeficit };
            })
            .filter(p => p.deficit > 0)
            .sort((a, b) => b.deficit - a.deficit);
    }, [deficitQueue]);

    const isSpecificStore = selectedStore !== 'Усі' && selectedStore !== 'Персонал' && selectedStore !== 'Планування';
    const storeSpecificQueue = useMemo(() => {
        if (!isSpecificStore) return [];
        return deficitQueue
            .map(task => {
                const storeData = task.stores.find(s => s.storeName === selectedStore);
                if (!storeData || (!storeData.deficitKg && !storeData.recommendedKg)) return null;
                return {
                    ...task,
                    stores: [storeData],
                    recommendedQtyKg: storeData.deficitKg > 0 ? storeData.deficitKg : storeData.recommendedKg, // Prioritize urgent deficit explicitly
                } as ProductionTask;
            })
            .filter((item): item is ProductionTask => item !== null);
    }, [deficitQueue, selectedStore, isSpecificStore]);

    if (deficitError || metricsError || allProductsError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0B0F19] text-[#E74856] font-bold uppercase tracking-widest font-display" role="alert">
                <AlertCircle size={48} className="mb-4 animate-pulse" />
                <span className="block text-center">Помилка даних | Supabase Offline</span>
            </div>
        );
    }

    if (!deficitData || !metrics || !allProductsData) {
        return (
            <div className="min-h-screen bg-[#0B0F19] p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#00D4FF] border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-[#00D4FF] font-display tracking-widest animate-pulse">ЗАВАНТАЖЕННЯ СИСТЕМИ...</div>
                </div>
            </div>
        );
    }

    const displayTotalKg = dynamicMetrics ? dynamicMetrics.totalKg : Math.round(metrics.shopLoad);
    const displayCriticalSKU = dynamicMetrics ? dynamicMetrics.criticalSKU : metrics.criticalSKU;
    const recommendedLoad = currentCapacity || 0;
    const loadPercent = recommendedLoad > 0 ? Math.round((displayTotalKg / recommendedLoad) * 100) : 0;

    return (
        <div className="bg-bg-primary text-text-primary antialiased overflow-hidden h-screen flex font-sans">
            {/* Fonts Injection */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />

            <SyncOverlay isVisible={isRefreshing} />

            {/* Sidebar */}
            <aside className="w-64 h-full flex flex-col border-r border-panel-border bg-panel-bg z-20 relative flex-shrink-0 shadow-[var(--panel-shadow)]">
                <div className="p-6 mb-4">
                    <div className="bg-bg-primary/50 border border-panel-border p-4 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center space-x-3 relative z-10">
                            <div className="p-2 bg-accent-primary/20 rounded-xl">
                                <MapPin className="text-accent-primary" size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] text-accent-primary tracking-widest font-display font-medium">АНАЛІТИЧНА СИСТЕМА</div>
                                <div className="text-xl font-bold text-text-primary font-display tracking-wide">ГАЛЯ</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar">
                    {/* Navigation Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 pl-2">Навігація</h3>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => router.push('/production/graviton')}
                                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden bg-gradient-to-r from-[#00D4FF]/20 to-transparent border-[#00D4FF] text-white shadow-neon-cyan"
                                >
                                    <span className="absolute inset-0 bg-[#00D4FF]/10 animate-pulse pointer-events-none"></span>
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-[#00D4FF]/20 text-[#00D4FF]">
                                            <BarChart2 size={16} />
                                        </div>
                                        <span className="text-sm font-medium tracking-wide font-display text-white">
                                            Дашборд
                                        </span>
                                    </div>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => router.push('/graviton/delivery')}
                                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                >
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                                            <Truck size={16} />
                                        </div>
                                        <span className="text-sm font-medium tracking-wide font-display group-hover:text-white transition-colors">
                                            Логістика
                                        </span>
                                    </div>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => router.push('/graviton/stores/sadgora')}
                                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                >
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-[#00D4FF]/10 text-[#00D4FF] group-hover:bg-[#00D4FF]/20 transition-colors">
                                            <MapPin size={16} />
                                        </div>
                                        <span className="text-sm font-medium tracking-wide font-display text-slate-400 group-hover:text-white transition-colors">
                                            СадгораТест
                                        </span>
                                    </div>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleStoreClick('Планування')}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden",
                                        selectedStore === 'Планування'
                                            ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border-[#00D4FF] text-white shadow-neon-cyan"
                                            : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                    )}
                                >
                                    {selectedStore === 'Планування' && <span className="absolute inset-0 bg-[#00D4FF]/10 animate-pulse pointer-events-none"></span>}
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className={cn("w-6 h-6 rounded flex items-center justify-center transition-colors", selectedStore === 'Планування' ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-white/5 text-slate-400 group-hover:text-white")}>
                                            <ClipboardList size={16} />
                                        </div>
                                        <span className={cn("text-sm font-medium tracking-wide font-display transition-colors", selectedStore === 'Планування' ? "text-white" : "group-hover:text-white")}>
                                            Планування
                                        </span>
                                    </div>
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 pl-2">Магазини</h3>
                        <ul className="space-y-2">
                            {dynamicStores.map((store) => {
                                const isActive = selectedStore === store.id;
                                return (
                                    <li key={store.id}>
                                        <button
                                            onClick={() => handleStoreClick(store.id)}
                                            className={cn(
                                                "w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden",
                                                isActive
                                                    ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border-[#00D4FF] text-white shadow-neon-cyan"
                                                    : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                            )}
                                        >
                                            {isActive && (
                                                <span className="absolute inset-0 bg-[#00D4FF]/10 animate-pulse pointer-events-none"></span>
                                            )}
                                            <span className={cn("relative z-10 text-sm font-medium tracking-wide font-display", isActive ? "text-white" : "")}>
                                                {store.name}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 group-hover:border-[#00D4FF] transition-colors">
                            <ArrowLeft size={16} className="text-white" />
                        </div>
                        <div className="flex items-center text-slate-400 group-hover:text-[#00D4FF] transition-colors">
                            <span className="text-sm font-medium uppercase tracking-wider font-display">ГОЛОВНЕ МЕНЮ</span>
                        </div>
                    </button>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 group-hover:border-red-500 transition-colors">
                            <LogOut size={16} className="text-slate-400 group-hover:text-red-500" />
                        </div>
                        <div className="flex items-center text-slate-400 group-hover:text-red-500 transition-colors">
                            <span className="text-sm font-medium uppercase tracking-wider font-display">ВИХІД</span>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-transparent">
                <div className="flex-1 flex flex-col p-6 space-y-6 relative z-10 overflow-y-auto custom-scrollbar">

                    {/* Header Panel */}
                    <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border p-6 flex justify-between items-center shrink-0 rounded-2xl">
                        <div className="flex items-center space-x-6">
                            <button onClick={() => router.push('/')} className="text-text-muted hover:text-text-primary transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <div className="h-8 w-[1px] bg-panel-border"></div>
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-accent-primary/10 rounded-xl border border-accent-primary/20">
                                    <BarChart2 className="text-accent-primary" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-text-primary tracking-wider font-display">ГАЛЯ БАЛУВАНА</h1>
                                    <p className="text-xs text-text-secondary uppercase tracking-widest font-display">ВИРОБНИЧИЙ КОНТРОЛЬ • GRAVITON</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-text-muted font-medium mb-1 font-display">{formattedDate}</div>
                            <div className="text-3xl font-bold text-accent-primary font-display tabular-nums">
                                {formattedTime}
                            </div>
                        </div>
                    </div>

                    {/* Stats & Actions Grid */}
                    <div className="grid grid-cols-12 gap-6 shrink-0">
                        <div className="col-span-12 lg:col-span-8 flex space-x-4">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="bg-panel-bg shadow-[var(--panel-shadow)] flex-1 py-4 px-6 flex items-center space-x-4 group border border-panel-border border-l-4 border-l-accent-primary/50 hover:border-l-accent-primary relative overflow-hidden transition-all hover:bg-bg-primary/50 active:scale-[0.98] rounded-2xl"
                            >
                                <RefreshCw className={cn("text-accent-primary", isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} size={24} />
                                <div className="text-left">
                                    <div className="text-[10px] text-accent-primary uppercase font-bold tracking-widest font-display">{isRefreshing ? 'СИНХРОНІЗАЦІЯ...' : 'СИНХРОНІЗАЦІЯ'}</div>
                                    <div className="text-text-primary font-bold font-display text-lg leading-none">ОНОВИТИ<br />ЗАЛИШКИ</div>
                                    {lastLiveSyncAt && (
                                        <div className="flex flex-col mt-1">
                                            <div className="text-[9px] text-text-muted uppercase tracking-tighter">
                                                Live: {new Date(lastLiveSyncAt).toLocaleTimeString('uk-UA')}
                                            </div>
                                            {syncMatchStats && (
                                                <div className="mt-2 space-y-1 border-t border-accent-primary/10 pt-2">
                                                    <div className={cn(
                                                        "text-[9px] uppercase font-bold tracking-tighter",
                                                        syncMatchStats.percent < 95 ? "text-orange-500" : "text-status-success/70"
                                                    )}>
                                                        Загалом: {syncMatchStats.totalMatched}/{syncMatchStats.totalExpected} ({Math.round(syncMatchStats.percent)}%)
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 max-h-20 overflow-y-auto custom-scrollbar pr-1">
                                                        {syncMatchStats.shopStats.map(shop => (
                                                            <div key={shop.id} className="flex justify-between items-center text-[8px] border-b border-white/5 pb-0.5">
                                                                <span className="text-text-muted truncate max-w-[50px]">{shop.name}</span>
                                                                <span className={cn(
                                                                    "font-mono font-bold",
                                                                    shop.percent < 95 ? "text-orange-400" : "text-status-success/90"
                                                                )}>
                                                                    {Math.round(shop.percent)}%
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedStore('Персонал')}
                                className={cn(
                                    "bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl flex-1 py-4 px-6 flex items-center space-x-4 group active:scale-[0.98] transition-all hover:bg-bg-primary/50",
                                    selectedStore === 'Персонал' ? "border-accent-primary bg-accent-primary/5" : ""
                                )}
                            >
                                <Users size={24} className={cn("group-hover:text-accent-primary transition-colors", selectedStore === 'Персонал' ? "text-accent-primary" : "text-text-muted")} />
                                <div className="text-left">
                                    <div className="text-[10px] text-text-secondary uppercase font-bold tracking-widest group-hover:text-text-muted font-display">УПРАВЛІННЯ</div>
                                    <div className={cn("font-bold font-display text-lg", selectedStore === 'Персонал' ? "text-accent-primary" : "text-text-primary")}>ПЕРСОНАЛ</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push('/graviton/delivery')}
                                className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl flex-1 py-4 px-6 flex items-center space-x-4 group active:scale-[0.98] transition-all hover:bg-bg-primary/50"
                            >
                                <Truck size={24} className="text-text-muted group-hover:text-accent-primary transition-colors" />
                                <div className="text-left">
                                    <div className="text-[10px] text-text-secondary uppercase font-bold tracking-widest group-hover:text-text-muted font-display">ЛОГІСТИКА</div>
                                    <div className="flex items-center gap-1.5">
                                        <Truck className="w-5 h-5 text-accent-primary" />
                                        <span className="text-xl font-black tracking-widest text-text-primary uppercase font-display">РОЗПОДІЛ</span>
                                        {totalProductionKg > 0 && !manufacturesWarning && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-status-ok/20 border border-status-ok/30 rounded-full text-[10px] font-black text-status-ok animate-pulse">
                                                +{totalProductionKg} кг
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div className="col-span-12 lg:col-span-4 grid grid-cols-3 gap-4">
                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl p-3 flex flex-col justify-center items-center">
                                <Activity size={24} className="text-status-success mb-1" />
                                <div className="text-[9px] text-text-secondary uppercase text-center font-display tracking-wider">ЗАГАЛОМ КГ</div>
                                <div className="text-2xl font-bold text-text-primary font-display">{Math.round(displayTotalKg)}</div>
                            </div>
                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-status-critical/30 rounded-2xl p-3 flex flex-col justify-center items-center">
                                <AlertTriangle size={24} className="text-status-critical mb-1" />
                                <div className="text-[9px] text-status-critical uppercase text-center font-display tracking-wider">КРИТИЧНІ SKU</div>
                                <div className="text-2xl font-bold text-status-critical font-display">{displayCriticalSKU}</div>
                            </div>
                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl p-3 flex flex-col justify-center items-center relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <div className={cn("w-12 h-12 border-4 border-accent-primary rounded-full border-t-transparent", isRefreshing ? "animate-spin" : "")}></div>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-panel-border flex items-center justify-center mb-1 text-[10px] text-accent-primary font-bold font-display">
                                    {loadPercent}%
                                </div>
                                <div className="text-[9px] text-text-secondary uppercase text-center leading-tight font-display tracking-wider">
                                    ЗАВАНТАЖЕННЯ<br /><span className="text-text-primary font-bold">{Math.round(displayTotalKg)}</span> / {recommendedLoad} кг
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Critical Alert Banner */}
                    {displayCriticalSKU > 0 && selectedStore !== 'Персонал' && (
                        <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-status-critical/50 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden shrink-0">
                            <div className="flex items-center space-x-4 relative z-10">
                                <div className="p-2 rounded-full bg-status-critical/20 text-status-critical animate-pulse">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-status-critical font-bold font-display text-lg tracking-wide uppercase">КРИТИЧНИЙ ДЕФІЦИТ: {displayCriticalSKU} позицій</h3>
                                    <p className="text-text-secondary text-sm font-sans">Потрібне термінове виробництво для запобігання втраті продажів</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBreakdownModal(true)} className="relative z-10 bg-bg-primary hover:bg-bg-primary/80 border border-panel-border text-text-primary shadow-sm text-sm py-2 px-4 rounded-xl flex items-center transition-colors font-display tracking-wider">
                                Переглянути список
                                <ChevronRight size={16} className="ml-1" />
                            </button>
                        </div>
                    )}

                    {/* Content Columns */}
                    <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                        {/* Main Interaction Area */}
                        <div className="col-span-12 flex flex-col h-full min-h-[400px] bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl overflow-hidden">
                            <ErrorBoundary>
                                {selectedStore === 'Персонал' ? (
                                    <PersonnelView />
                                ) : isSpecificStore ? (
                                    <StoreSpecificView queue={storeSpecificQueue} storeName={selectedStore} />
                                ) : (
                                    <BIPowerMatrix
                                        deficitQueue={deficitQueue}
                                        allProductsQueue={allProductsQueue}
                                        refreshUrgency={refreshUrgency}
                                        onMetricsUpdate={setDynamicMetrics}
                                        onManualRefresh={handleRefresh}
                                        planningDays={planningDays}
                                        onPlanningDaysChange={setPlanningDays}
                                    />
                                )}
                            </ErrorBoundary>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.2);
                }
                .font-display {
                    font-family: 'Rajdhani', sans-serif;
                }
                .font-body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </div>
    );
};

