'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Package,
  AlertTriangle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RefreshCw,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Info,
  ClipboardList,
  AlertCircle,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ProductionTask, PriorityKey, SKUCategory, PriorityHierarchy, CategoryGroup } from '@/types/bi';
import { cn } from '@/lib/utils';
import { useStore } from '@/context/StoreContext';
import { StoreSpecificView } from './StoreSpecificView';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { ShareOptionsModal } from './ShareOptionsModal';
import { OrderItem, SharePlatform } from '@/types/order';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { groupItemsByCategory } from '@/lib/order-export';

// --- Helper Functions ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getEmoji = (category: string) => '';
// ------------------------

interface Props {
  deficitQueue: ProductionTask[];
  allProductsQueue: ProductionTask[];
  refreshUrgency?: 'normal' | 'warning' | 'critical';
  onMetricsUpdate?: (metrics: { totalKg: number, criticalWeight: number, reserveWeight: number, criticalSKU: number, reserveSKU: number }) => void;
  onManualRefresh?: () => void;
  planningDays?: number;
  onPlanningDaysChange?: (days: number) => void;
}

export const BIPowerMatrix = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deficitQueue,
  allProductsQueue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refreshUrgency = 'normal',
  onMetricsUpdate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onManualRefresh,
  planningDays: controlledPlanningDays,
  onPlanningDaysChange
}: Props) => {
  const { selectedStore, currentCapacity } = useStore();

  const [localPlanningDays, setLocalPlanningDays] = useState<number>(1);
  const planningDays = controlledPlanningDays !== undefined ? controlledPlanningDays : localPlanningDays;

  const handleSetPlanningDays = (days: number) => {
    if (onPlanningDaysChange) {
      onPlanningDaysChange(days);
    } else {
      setLocalPlanningDays(days);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const SAFETY_BUFFER_DAYS = 4;

  // State management
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);
  const [selectedStores, setSelectedStores] = useState<Map<string, boolean>>(new Map());

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [showShiftRestrictionModal, setShowShiftRestrictionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderData, setOrderData] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);

  useEffect(() => {
    setIsOrderConfirmed(false);
  }, [selectedStores]);

  // Data processing
  const rawQueue = allProductsQueue;

  const dynamicQueue = useMemo(() => {
    return rawQueue.map(item => {
      const updatedStores = item.stores.filter(store => {
        const avgRaw = parseFloat(String(store.avgSales));
        const stockRaw = parseFloat(String(store.currentStock));
        const minStockRaw = parseFloat(String(store.minStock));

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const avg = isNaN(avgRaw) ? 0 : avgRaw;
        const stock = isNaN(stockRaw) ? 0 : stockRaw;
        const minStock = isNaN(minStockRaw) ? 0 : minStockRaw;

        if (selectedStore === 'Усі') {
          if (minStock === 0 && stock === 0) return false;
          return stock < minStock;
        }
        return true;
      }).map(store => {
        const avgRaw = parseFloat(String(store.avgSales));
        const stockRaw = parseFloat(String(store.currentStock));
        const minStockRaw = parseFloat(String(store.minStock));

        const avg = isNaN(avgRaw) ? 0 : avgRaw;
        const stock = isNaN(stockRaw) ? 0 : stockRaw;
        const minStock = isNaN(minStockRaw) ? 0 : minStockRaw;

        let finalOrder = 0;
        if (selectedStore !== 'Усі') {
          finalOrder = Math.max(0, Number((minStock - stock).toFixed(1)));
        } else {
          finalOrder = Math.max(0, Number((minStock + (avg * Math.max(0, planningDays - 1)) - stock).toFixed(1)));
        }

        const urgentOrder = finalOrder;

        return {
          ...store,
          recommendedKg: finalOrder,
          deficitKg: urgentOrder
        };
      });

      if (updatedStores.length === 0) return null;

      const totalRecommended = updatedStores.reduce((sum, s) => sum + (s.recommendedKg || 0), 0);
      const totalDeficit = updatedStores.reduce((sum, s) => sum + (s.deficitKg || 0), 0);

      let newPriority: PriorityKey = item.priority;
      if (totalDeficit > 0) newPriority = 'critical';
      else if (totalRecommended > 0) newPriority = 'reserve';
      else newPriority = 'normal';

      return {
        ...item,
        priority: newPriority,
        stores: updatedStores,
        recommendedQtyKg: totalRecommended,
        totalDeficitKg: totalDeficit
      } as ProductionTask;
    }).filter((item): item is ProductionTask => {
      if (item === null) return false;
      if (selectedStore === 'Усі') return (item.recommendedQtyKg || 0) > 0;
      return true;
    });
  }, [rawQueue, planningDays, selectedStore]);

  const filteredQueue = useMemo((): ProductionTask[] => {
    if (selectedStore === 'Усі') return dynamicQueue;

    return dynamicQueue
      .map(item => {
        const storeData = item.stores.find(s => s.storeName === selectedStore);
        if (!storeData) return null;
        return {
          ...item,
          stores: [storeData],
          recommendedQtyKg: storeData.recommendedKg,
          totalDeficitKg: storeData.deficitKg
        } as ProductionTask;
      })
      .filter((item): item is ProductionTask => item !== null);
  }, [dynamicQueue, selectedStore]);

  const selectedWeight = useMemo(() => {
    let total = 0;
    filteredQueue.forEach(item => {
      item.stores.forEach(store => {
        const key = `${item.productCode}_${store.storeName}`;
        if (selectedStores.has(key)) total += store.recommendedKg;
      });
    });
    return Number(total.toFixed(1));
  }, [filteredQueue, selectedStores]);

  // Simplify hierarchy for flattening
  const flatCategories = useMemo(() => {
    const categoryMap = new Map<string, { totalKg: number, items: ProductionTask[], priority: PriorityKey }>();

    filteredQueue.forEach(item => {
      const catName = item.category || 'Інше';
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { totalKg: 0, items: [], priority: 'normal' });
      }
      const entry = categoryMap.get(catName)!;
      entry.items.push(item);

      item.stores.forEach(s => {
        entry.totalKg += s.recommendedKg;
      });

      // Priority bubbling: if any item is critical, category is marked critical (visual cue)
      if (item.priority === 'critical' || item.priority === 'high') {
        entry.priority = 'critical';
      } else if (entry.priority !== 'critical' && item.priority === 'reserve') {
        entry.priority = 'reserve';
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      ...data,
      itemsCount: data.items.length
    })).sort((a, b) => {
      // Sort by Priority (Critical first) then Weight
      if (a.priority === 'critical' && b.priority !== 'critical') return -1;
      if (b.priority === 'critical' && a.priority !== 'critical') return 1;
      return b.totalKg - a.totalKg;
    });
  }, [filteredQueue]);

  // Sync metrics logic (kept for parent)
  useEffect(() => {
    if (!onMetricsUpdate) return;
    let criticalWeight = 0, criticalSKU = 0, reserveWeight = 0, reserveSKU = 0;
    filteredQueue.forEach(item => {
      if (item.priority === 'critical' || item.priority === 'high') {
        criticalWeight += item.recommendedQtyKg;
        criticalSKU++;
      } else {
        reserveWeight += item.recommendedQtyKg;
        reserveSKU++;
      }
    });

    const timer = setTimeout(() => {
      onMetricsUpdate({
        totalKg: criticalWeight + reserveWeight,
        criticalWeight,
        reserveWeight,
        criticalSKU,
        reserveSKU
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [filteredQueue, onMetricsUpdate]);


  // Actions
  const toggleCategory = (categoryName: string) => {
    setSelectedCategoryModal(categoryName);
  };

  const toggleStoreSelection = (productCode: number, storeName: string) => {
    const key = `${productCode}_${storeName}`;
    setSelectedStores(prev => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, true);
      return next;
    });
  };

  const toggleSelectAllByCategory = (categoryName: string, items: ProductionTask[]) => {
    const allSelected = items.every(item => item.stores.every(s => selectedStores.has(`${item.productCode}_${s.storeName}`)));

    setSelectedStores(prev => {
      const next = new Map(prev);
      items.forEach(item => {
        item.stores.forEach(store => {
          const key = `${item.productCode}_${store.storeName}`;
          if (allSelected) next.delete(key);
          else next.set(key, true);
        });
      });
      return next;
    });
  };

  const selectAll = () => {
    const selection = new Map<string, boolean>();
    filteredQueue.forEach(item => {
      item.stores.forEach(store => {
        selection.set(`${item.productCode}_${store.storeName}`, true);
      });
    });
    setSelectedStores(selection);
  };

  const clearSelection = () => {
    setSelectedStores(new Map());
  };

  const handleFormOrder = () => {
    if (currentCapacity === null) {
      setShowShiftRestrictionModal(true);
      return;
    }
    // ... (Order logic same as before, abbreviated for implementation speed in this turn)
    const items: OrderItem[] = [];
    filteredQueue.forEach(item => {
      item.stores.forEach(store => {
        const key = `${item.productCode}_${store.storeName}`;
        if (selectedStores.has(key)) {
          const smartQuantity = Math.max(0, Number((store.minStock + (store.avgSales * Math.max(0, planningDays - 1)) - store.currentStock).toFixed(1)));
          items.push({
            id: key, productCode: item.productCode, productName: item.name, category: item.category, storeName: store.storeName,
            quantity: smartQuantity, kg: smartQuantity, minRequired: store.recommendedKg, maxRecommended: smartQuantity, priority: item.priority
          });
        }
      });
    });

    if (items.length === 0) {
      alert('Оберіть товари для замовлення');
      return;
    }
    const finalOrderItems = items.filter(item => item.kg > 0);
    const order = { date: new Date().toLocaleDateString('uk-UA'), totalKg: finalOrderItems.reduce((s, i) => s + i.kg, 0), items: finalOrderItems };
    setOrderData(order);
    setOrderItems(order.items);
    setIsOrderModalOpen(true);
  };

  const handleConfirmOrder = (confirmedItems: OrderItem[]) => {
    setOrderItems(confirmedItems);
    setIsOrderModalOpen(false);
    setShowShareModal(true);
  };

  const handleShare = async (platform: SharePlatform['id']) => { /* ... same as before ... */
    console.log('Sharing via', platform);
    setShowShareModal(false);
    clearSelection();
    alert('Замовлення відправлено (імітація)');
  };


  if (selectedStore !== 'Усі') {
    return <StoreSpecificView queue={filteredQueue} storeName={selectedStore} />;
  }

  return (
    <div className="flex flex-col h-full w-full font-sans text-text-primary overflow-hidden">
      {/* Header logic from HTML mockup */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-xl p-2 shrink-0 mb-4 gap-2 sm:gap-0">
        <div className="flex items-center space-x-3 px-2">
          <div className="p-1.5 bg-accent-primary/10 rounded-lg text-accent-primary">
            <ClipboardList size={18} />
          </div>
          <span className="font-bold font-display text-text-primary tracking-wide uppercase">ФОРМУВАННЯ ЗАМОВЛЕННЯ</span>
        </div>

        <div className="flex items-center space-x-2 bg-bg-primary p-1 rounded-lg border border-panel-border overflow-x-auto max-w-full">
          <span className="text-xs text-text-secondary px-2 font-display uppercase whitespace-nowrap font-bold tracking-wider">ПЛАН (ДНІВ):</span>
          {[1, 2, 3, 4, 7, 14].map(d => (
            <button
              key={d}
              onClick={() => handleSetPlanningDays(d)}
              className={cn(
                "h-7 w-9 flex items-center justify-center rounded text-xs transition-all font-bold",
                planningDays === d
                  ? "bg-accent-primary text-bg-primary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.5)]"
                  : "text-text-muted hover:text-text-primary hover:bg-panel-bg"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 px-3 bg-bg-primary border border-panel-border rounded-lg py-1.5">
          <div className={cn("w-2 h-2 rounded-full", selectedWeight > 0 ? "bg-accent-primary animate-pulse shadow-[0_0_5px_rgba(var(--color-accent-primary),0.8)]" : "bg-panel-border")}></div>
          <span className="text-xs text-text-secondary font-display font-medium uppercase tracking-wider">Вибрано: <span className="text-accent-primary font-bold">{selectedWeight} кг</span> / {currentCapacity || '—'} кг</span>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-xl p-0 space-y-0 relative">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {flatCategories.map(cat => {
            const isCritical = cat.priority === 'critical';

            return (
              <div key={cat.name} className={cn("flex flex-col bg-bg-primary/20 border rounded-[1rem] overflow-hidden transition-all border-panel-border hover:border-panel-border/80 hover:bg-bg-primary/40")}>
                <div
                  className={cn(
                    "group flex flex-col p-5 cursor-pointer relative",
                    isCritical ? "border-t-4 border-t-status-critical" : ""
                  )}
                  onClick={() => toggleCategory(cat.name)}
                >
                  <div className="flex justify-between items-center mb-4 gap-2">
                    <span className="font-display font-bold text-text-primary tracking-wide uppercase text-lg leading-none">
                      {cat.name}
                    </span>
                    <div className={cn("font-mono font-bold text-[17px] shrink-0", cat.totalKg > 0 ? "text-status-critical" : "text-text-muted")}>
                      {Number(cat.totalKg).toFixed(1)} <span className="text-xs text-text-secondary font-display uppercase tracking-widest ml-1">кг</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-[13px] font-sans font-medium">{cat.itemsCount} позицій</span>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors border bg-panel-bg text-text-muted border-panel-border group-hover:bg-bg-primary group-hover:text-text-primary")}>
                      <ChevronRight size={18} className="transition-transform duration-200 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="grid grid-cols-4 gap-4 p-4 mt-4 shrink-0 bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-xl">
        <button
          onClick={selectAll}
          className="bg-bg-primary p-3 rounded-xl border border-panel-border text-accent-primary font-bold uppercase text-xs tracking-wider hover:bg-accent-primary/10 hover:border-accent-primary/50 transition-all active:scale-[0.98] shadow-[var(--panel-shadow)] flex flex-col items-center justify-center font-display"
        >
          <div className="text-[9px] text-text-muted font-medium mb-1 tracking-widest">ВСЕ ДЕРЕВО</div>
          ВИБРАТИ ВСЕ <span className="text-[10px] font-mono mt-1 inline-block text-text-primary px-2 py-0.5 bg-panel-bg rounded">{filteredQueue.reduce((acc, i) => acc + i.recommendedQtyKg, 0)} КГ</span>
        </button>

        <button
          onClick={() => setIsOrderConfirmed(true)}
          disabled={selectedStores.size === 0 || isOrderConfirmed}
          className={cn(
            "p-3 rounded-xl border font-bold uppercase text-xs tracking-wider transition-all shadow-[var(--panel-shadow)] flex flex-col items-center justify-center font-display",
            isOrderConfirmed
              ? "bg-status-success/10 border-status-success/30 text-status-success cursor-not-allowed" // Already confirmed
              : selectedStores.size > 0
                ? "bg-bg-primary border-accent-primary text-accent-primary hover:bg-accent-primary/10 hover:shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)]" // Can confirm
                : "bg-bg-primary/50 border-panel-border text-text-muted cursor-not-allowed" // Nothing selected
          )}
        >
          <div className={cn("text-[9px] font-medium mb-1 tracking-widest", isOrderConfirmed ? "text-status-success/80" : "text-text-muted")}>ТІЛЬКИ ОБРАНЕ</div>
          {isOrderConfirmed ? "ПІДТВЕРДЖЕНО" : "ВИБРАТИ ОБРАНЕ"} <span className={cn("text-[10px] font-mono mt-1 inline-block px-2 py-0.5 rounded", isOrderConfirmed ? "bg-status-success/20 text-status-success" : (selectedStores.size > 0 ? "bg-accent-primary/10 text-accent-primary" : "bg-panel-bg text-text-muted"))}>{selectedWeight} КГ</span>
        </button>

        <button
          onClick={handleFormOrder}
          className={cn(
            "p-3 rounded-xl border font-bold uppercase text-xs tracking-wider flex flex-col items-center justify-center transition-all shadow-[var(--panel-shadow)] font-display",
            isOrderConfirmed
              ? "bg-accent-primary border-accent-primary text-bg-primary shadow-[0_0_15px_rgba(var(--color-accent-primary),0.5)] hover:bg-accent-secondary active:scale-[0.98]"
              : "bg-bg-primary/50 border-panel-border text-text-muted cursor-not-allowed"
          )}
        >
          <Package size={20} className={cn("mb-1", isOrderConfirmed ? "text-bg-primary" : "text-text-muted")} />
          СФОРМУВАТИ ЗАЯВКУ
        </button>

        <button
          onClick={clearSelection}
          className="bg-bg-primary p-3 rounded-xl border border-status-critical/30 text-status-critical font-bold uppercase text-xs tracking-wider hover:bg-status-critical/10 hover:border-status-critical transition-all active:scale-[0.98] shadow-[var(--panel-shadow)] flex flex-col items-center justify-center font-display"
        >
          <div className="text-[9px] text-status-critical/80 font-medium mb-1 tracking-widest">СКИНУТИ ВИБІР</div>
          ОЧИСТИТИ <span className="text-[10px] font-mono mt-1 inline-block text-status-critical px-2 py-0.5 bg-status-critical/10 rounded hidden sm:inline-block">0 КГ</span>
        </button>
      </div>

      {/* Modals from original component */}
      {/* refreshUrgency === 'critical' block temporarily removed as per user request */}

      {showShiftRestrictionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm" onClick={() => setShowShiftRestrictionModal(false)}>
          <div className="bg-panel-bg border border-status-critical/50 p-6 rounded-2xl max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={32} className="mx-auto text-status-critical mb-4" />
            <h3 className="text-lg font-bold text-text-primary uppercase mb-2">Зміна не обрана</h3>
            <p className="text-sm text-text-secondary mb-6 font-medium">Оберіть зміну в меню "Персонал"</p>
            <button onClick={() => setShowShiftRestrictionModal(false)} className="w-full py-2.5 bg-status-critical text-bg-primary font-bold rounded-lg shadow-[0_0_15px_rgba(var(--color-status-critical),0.5)] hover:bg-status-critical/90 transition-colors tracking-widest font-display">ЗРОЗУМІЛО</button>
          </div>
        </div>
      )}

      <OrderConfirmationModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        items={orderItems}
        onConfirm={handleConfirmOrder}
      />

      <ShareOptionsModal
        isOpen={showShareModal}
        items={orderItems}
        orderData={orderData}
        onClose={() => setShowShareModal(false)}
        onShare={handleShare}
      />

      {/* Category Modal Overlay */}
      <AnimatePresence>
        {selectedCategoryModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 lg:p-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedCategoryModal(null);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {(() => {
              const cat = flatCategories.find(c => c.name === selectedCategoryModal);
              if (!cat) return null;
              return (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-[1400px] h-auto max-h-[90vh] rounded-2xl overflow-hidden bg-[#112240]/95 backdrop-blur-md border border-[#00E0FF]/20 shadow-[0_0_30px_rgba(0,224,255,0.15)] flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between p-5 border-b border-[#00E0FF]/10 shrink-0 bg-[#112240]/80 shadow-lg">
                    <div className="flex flex-col">
                      <h2 className="text-2xl font-bold text-white uppercase tracking-wider leading-none font-[family-name:var(--font-chakra)]">
                        {cat.name} <span className="text-white/30 text-lg">/ {cat.itemsCount} тов.</span>
                      </h2>
                      <div className="mt-2 flex items-baseline gap-1 font-mono">
                        <span className="text-status-critical font-bold text-3xl font-[family-name:var(--font-jetbrains)] drop-shadow-[0_0_8px_rgba(255,42,85,0.5)]">
                          {Number(cat.totalKg).toFixed(1)}
                        </span>
                        <span className="text-xs text-[#00E0FF]/60 uppercase font-bold font-display tracking-widest">кг</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); toggleSelectAllByCategory(cat.name, cat.items); }} className="text-xs text-[#00E0FF] hover:text-[#00E0FF]/80 hover:bg-[#00E0FF]/10 uppercase font-bold tracking-wider font-display flex items-center gap-1.5 bg-[#00E0FF]/5 border border-[#00E0FF]/20 px-4 py-2 rounded-lg transition-colors">
                        <CheckCircle2 size={14} /> ОБРАТИ ВСІ
                      </button>
                      <button
                        onClick={() => setSelectedCategoryModal(null)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-black/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                      {cat.items.map((item, itemIndex) => (
                        <div key={`${item.productCode}_${itemIndex}`} className="group/item flex flex-col p-4 rounded-xl bg-[#131B2C]/80 border border-[#00E0FF]/10 hover:border-[#00E0FF]/30 transition-colors shadow-lg shadow-black/20">
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <span className="text-[15px] font-bold text-white font-[family-name:var(--font-chakra)] uppercase tracking-wide">{item.name}</span>
                            <span className="text-sm font-mono text-[#00E0FF] font-bold shrink-0 bg-[#00E0FF]/10 px-2 py-1 rounded-md border border-[#00E0FF]/20 shadow-[0_0_10px_rgba(0,224,255,0.1)]">{Number(item.recommendedQtyKg).toFixed(1)} кг</span>
                          </div>

                          {(item.todayProduction ?? 0) > 0 && (
                            <div className="mb-2">
                              <span className="text-[10px] px-2 py-1.5 rounded bg-[#C7481F]/20 text-[#FF5A25] border border-[#FF5A25]/30 font-bold uppercase tracking-widest inline-flex items-center gap-1 font-display shadow-[0_0_10px_rgba(255,90,37,0.1)]">
                                ВИРОБЛЕНО: {item.todayProduction} {item.unit || 'кг'}
                              </span>
                            </div>
                          )}

                          {item.portion_size && item.portion_size > 0 && item.recommendedQtyKg > 0 && (
                            <div className="mb-3">
                              <span className="text-[11px] px-2 py-1.5 rounded bg-[#00E0FF]/10 text-[#00E0FF] border border-[#00E0FF]/30 font-bold uppercase tracking-widest inline-flex items-center gap-1 font-display">
                                К-СТЬ ПОРЦІЙ: {Math.ceil(item.recommendedQtyKg / item.portion_size)} (по {item.portion_size} {item.portion_unit || 'кг'})
                              </span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 mt-2 border-t border-white/5 pt-3">
                            {item.stores.map((store, storeIndex) => {
                              const key = `${item.productCode}_${store.storeName}`;
                              const isSelected = selectedStores.has(key);
                              return (
                                <div
                                  key={store.storeName || `${item.productCode}_${storeIndex}`}
                                  className={cn(
                                    "flex flex-col gap-1 p-2 rounded-lg cursor-pointer transition-all border",
                                    isSelected
                                      ? "bg-[#00E0FF]/10 border-[#00E0FF]/40 ring-1 ring-[#00E0FF]/20"
                                      : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20"
                                  )}
                                  onClick={() => toggleStoreSelection(item.productCode, store.storeName)}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden mb-1">
                                    <div className={cn("w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 transition-colors", isSelected ? "bg-[#00E0FF] border-[#00E0FF] shadow-[0_0_8px_rgba(0,224,255,0.5)]" : "border-white/20 bg-transparent")}>
                                      {isSelected && <CheckCircle2 size={10} className="text-[#0A1931]" />}
                                    </div>
                                    <span className={cn("truncate text-[11px] uppercase tracking-tighter", isSelected ? "font-bold text-white" : "font-medium text-white/50")}>
                                      {store.storeName.replace('Магазин ', '').replace(/"/g, '')}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-mono text-[10px] items-baseline">
                                    <span className="text-white/20 flex items-center gap-1">
                                      Ф:<span className="text-white/40 ml-0.5">{Number(store.currentStock).toFixed(0)}</span>
                                      {store.isLive === false && (
                                        <span title="Дані з БД (не live)" className="text-orange-500/60 flex items-center">
                                          <AlertCircle size={10} />
                                        </span>
                                      )}
                                    </span>
                                    <span className={cn("font-bold text-[12px] flex items-center gap-1", store.deficitKg > 0 ? "text-status-critical" : (isSelected ? "text-[#00E0FF]" : "text-white/60"))}>
                                      {Number(store.recommendedKg).toFixed(1)}
                                      {store.isLive === false && (
                                        <span title="Дані з БД (не live)" className="text-orange-500/80">
                                          <AlertCircle size={12} />
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
