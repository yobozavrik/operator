'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Package, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { ProductionTask, PriorityKey, SKUCategory, PriorityHierarchy, CategoryGroup } from '@/types/bi';
import { cn } from '@/lib/utils';
import { UI_TOKENS } from '@/lib/design-tokens';
import { useStore } from '@/context/StoreContext';
import { StoreSpecificView } from './StoreSpecificView';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { ShareOptionsModal } from './ShareOptionsModal';
import { OrderItem, SharePlatform } from '@/types/order';
import { generateExcel, groupItemsByCategory } from '@/lib/order-export';

const CATEGORY_EMOJI: Record<string, string> = {};

const getEmoji = (category: string) => '';

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
  deficitQueue,
  allProductsQueue,
  refreshUrgency = 'normal',
  onMetricsUpdate,
  onManualRefresh,
  planningDays: controlledPlanningDays,
  onPlanningDaysChange
}: Props) => {
  const { selectedStore, currentCapacity } = useStore();

  // Local state for fallback if not controlled
  const [localPlanningDays, setLocalPlanningDays] = useState<number>(3);

  // Use controlled value if present, else local
  const planningDays = controlledPlanningDays !== undefined ? controlledPlanningDays : localPlanningDays;

  // Handler to update both
  const handleSetPlanningDays = (days: number) => {
    if (onPlanningDaysChange) {
      onPlanningDaysChange(days);
    } else {
      setLocalPlanningDays(days);
    }
  };

  const SAFETY_BUFFER_DAYS = 4;

  const [expandedPriorities, setExpandedPriorities] = useState<Set<PriorityKey>>(
    new Set(['critical', 'high'] as PriorityKey[])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedStores, setSelectedStores] = useState<Map<string, boolean>>(new Map());

  // Independent state for RESERVE (Step 89)
  const [expandedReserve, setExpandedReserve] = useState(false);
  const [expandedReserveCategories, setExpandedReserveCategories] = useState<Set<string>>(new Set());
  const [expandedReserveProducts, setExpandedReserveProducts] = useState<Set<string>>(new Set());

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [showShiftRestrictionModal, setShowShiftRestrictionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);

  // Reset confirmation when selection changes
  useEffect(() => {
    setIsOrderConfirmed(false);
  }, [selectedStores]);

  // Вибираємо правильний датасет залежно від режиму
  // ⚠️ ALWAYS use allProductsQueue as base for dynamic calculation to catch items that will become deficit soon
  // previously: const rawQueue = selectedStore === 'Усі' ? deficitQueue : allProductsQueue;
  const rawQueue = allProductsQueue;

  // ⚡ DYNAMIC CALCULATION LOGIC
  const calculateMetrics = (avg: number, stock: number) => {
    // 1. Общий объем заказа
    const totalTarget = (avg * planningDays) + (avg * SAFETY_BUFFER_DAYS);
    const rawOrder = totalTarget - stock;
    const finalOrder = Math.ceil(Math.max(0, rawOrder));

    // 2. Срочная потребность (Needs to restore Safety Buffer)
    // REPURPOSED logic: "Deficit" now means "Urgent Stock Requirement"
    const urgentRequirement = (avg * SAFETY_BUFFER_DAYS) - stock;
    const urgentOrder = Math.ceil(Math.max(0, urgentRequirement));

    // 3. Плановая потребность
    const plannedOrder = Math.max(0, finalOrder - urgentOrder);

    return { finalOrder, urgentOrder, plannedOrder, totalTarget };
  };

  const dynamicQueue = useMemo(() => {
    return rawQueue.map(item => {
      // 1. Filter and Recalculate for each store
      const updatedStores = item.stores.filter(store => {
        // Force include if we are in "Store View" (selectedStore !== 'Усі')
        // Otherwise apply Visibility Logic: stock < (avg * (planningDays + Buffer))

        const avgRaw = parseFloat(String(store.avgSales));
        const stockRaw = parseFloat(String(store.currentStock));

        const avg = isNaN(avgRaw) ? 0 : avgRaw;
        const stock = isNaN(stockRaw) ? 0 : stockRaw;

        // VISIBILITY LOGIC
        if (selectedStore === 'Усі') {
          // If avg sales is 0, we generally don't need to produce it unless we want to hold buffer.
          // Let's strictly follow the formula.
          const visibilityThreshold = avg * (planningDays + SAFETY_BUFFER_DAYS);

          // Debugging safety
          if (visibilityThreshold === 0 && stock === 0) return false;

          return stock < visibilityThreshold;
        }

        // In specific store view, we show everything for that store (filtering by store happens in filteredQueue)
        return true;
      }).map(store => {
        const avgRaw = parseFloat(String(store.avgSales));
        const stockRaw = parseFloat(String(store.currentStock));
        const avg = isNaN(avgRaw) ? 0 : avgRaw;
        const stock = isNaN(stockRaw) ? 0 : stockRaw;

        const { finalOrder, urgentOrder } = calculateMetrics(avg, stock);

        return {
          ...store,
          recommendedKg: finalOrder,
          deficitKg: urgentOrder
        };
      });

      if (updatedStores.length === 0) return null;

      // Recalculate aggregated values for the item
      // Recalculate aggregated values for the item
      const totalRecommended = updatedStores.reduce((sum, s) => sum + (s.recommendedKg || 0), 0);
      const totalDeficit = updatedStores.reduce((sum, s) => sum + (s.deficitKg || 0), 0);

      // Recalculate Priority based on dynamic values
      let newPriority: PriorityKey = item.priority;

      if (totalDeficit > 0) {
        newPriority = 'critical';
      } else if (totalRecommended > 0) {
        newPriority = 'reserve';
      } else {
        newPriority = 'normal'; // Should typically be filtered out by visibility logic anyway
      }

      return {
        ...item,
        priority: newPriority,
        stores: updatedStores,
        recommendedQtyKg: totalRecommended,
        totalDeficitKg: totalDeficit
      } as ProductionTask;
    }).filter((item): item is ProductionTask => {
      if (item === null) return false;
      // Final Safety Filter: If we are in "All Stores", show only if "finalOrder" > 0
      if (selectedStore === 'Усі') {
        return (item.recommendedQtyKg || 0) > 0;
      }
      return true;
    });
  }, [rawQueue, planningDays, selectedStore]);

  // Фільтруємо чергу залежно від обраного магазину
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

  // ДОДАЙ ЦЕЙ CONSOLE.LOG (Step 93):
  console.log('📊 Статистика filteredQueue:', {
    total: filteredQueue.length,
    critical: filteredQueue.filter(i => i.priority === 'critical').length,
    high: filteredQueue.filter(i => i.priority === 'high').length,
    reserve: filteredQueue.filter(i => i.priority === 'reserve').length,
    sample: filteredQueue.slice(0, 3).map(i => ({ name: i.name, priority: i.priority }))
  });

  console.log('🔄 BIPowerMatrix Render | Planning Days:', planningDays);

  // ============================================================================
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY (Rules of Hooks)
  // ============================================================================

  // Підрахунок обраної ваги
  const selectedWeight = useMemo(() => {
    let total = 0;
    filteredQueue.forEach(item => {
      item.stores.forEach(store => {
        const key = `${item.productCode}_${store.storeName}`;
        if (selectedStores.has(key)) {
          total += store.recommendedKg;
        }
      });
    });
    return Math.round(total);
  }, [filteredQueue, selectedStores]);

  const hierarchy = useMemo((): PriorityHierarchy[] => {
    const priorityMap = new Map<PriorityKey, Map<SKUCategory, Map<string, ProductionTask[]>>>();

    filteredQueue.forEach(item => {
      // Step 98: Merge high into critical
      let priorityLabel = item.priority || 'reserve';
      if (priorityLabel === 'high') priorityLabel = 'critical';

      const categoryName = item.category || 'Інше';
      const productId = item.productCode.toString();

      if (!priorityMap.has(priorityLabel)) {
        priorityMap.set(priorityLabel, new Map());
      }

      const categoryMap = priorityMap.get(priorityLabel)!;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, new Map());
      }

      const productMap = categoryMap.get(categoryName)!;

      if (!productMap.has(productId)) {
        productMap.set(productId, []);
      }
      productMap.get(productId)!.push(item);
    });

    const priorityConfigs = [
      {
        key: 'critical',
        label: 'ТЕРМІНОВО (Stock < Buffer)',
        emoji: '🔥',
        color: '#E74856',
        colorDark: '#C41E3A',
        glow: '#FF6B6B'
      },
      {
        key: 'reserve',
        label: 'ПЛАНОВЕ ПОПОВНЕННЯ',
        emoji: '📅',
        color: '#007BA7',
        colorDark: '#005F8C',
        glow: '#00BCF2'
      }
    ] as const;

    return priorityConfigs.map(config => {
      const categoryMap = priorityMap.get(config.key as PriorityKey);
      if (!categoryMap || categoryMap.size === 0) return null;

      const categories: CategoryGroup[] = [];
      let totalKg = 0;

      categoryMap.forEach((productMap, categoryName) => {
        let categoryKg = 0;
        const products: ProductionTask[] = [];

        productMap.forEach((occurrences) => {
          const base = occurrences[0];
          const combinedStores = occurrences.flatMap(curr => curr.stores);
          const combinedRecommended = combinedStores.reduce((sum, s) => sum + s.recommendedKg, 0);
          const totalFactDeficit = combinedStores.reduce((sum, s) => sum + s.deficitKg, 0);

          products.push({
            ...base,
            stores: combinedStores,
            recommendedQtyKg: Math.round(combinedRecommended),
            totalDeficitKg: Math.round(totalFactDeficit)
          } as ProductionTask);

          categoryKg += combinedRecommended;
        });

        categories.push({
          categoryName,
          emoji: getEmoji(categoryName),
          totalKg: Math.round(categoryKg),
          itemsCount: products.length,
          items: products.sort((a, b) => b.recommendedQtyKg - a.recommendedQtyKg)
        });

        totalKg += categoryKg;
      });

      return {
        key: config.key,
        label: config.label,
        emoji: config.emoji,
        color: config.color,
        colorDark: config.colorDark,
        glow: config.glow,
        totalKg: Math.round(totalKg),
        categoriesCount: categories.length,
        categories: categories.sort((a, b) => b.totalKg - a.totalKg)
      } as PriorityHierarchy;
    }).filter((p): p is PriorityHierarchy => p !== null);
  }, [filteredQueue]);

  // 🔥 SYNC METRICS WITH PARENT (page.tsx)
  useEffect(() => {
    if (!onMetricsUpdate) return;

    let criticalWeight = 0, criticalSKU = 0;
    let reserveWeight = 0, reserveSKU = 0;

    hierarchy.forEach(p => {
      if (p.key === 'critical' || p.key === 'high') {
        criticalWeight += p.totalKg;
        criticalSKU += p.categories.reduce((acc, cat) => acc + cat.itemsCount, 0);
      } else if (p.key === 'reserve') {
        reserveWeight += p.totalKg;
        reserveSKU += p.categories.reduce((acc, cat) => acc + cat.itemsCount, 0);
      }
    });

    const totalKg = criticalWeight + reserveWeight;

    // Use a timeout to avoid render-cycle conflicts if parent updates state immediately
    const timer = setTimeout(() => {
      onMetricsUpdate({
        totalKg,
        criticalWeight,
        reserveWeight,
        criticalSKU,
        reserveSKU
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [hierarchy, onMetricsUpdate]);

  // Calculate stats for local usage (Footer)
  const stats = useMemo(() => {
    const criticalPriority = hierarchy.find(p => p.key === 'critical');
    const recommendedWeight = Math.round(criticalPriority?.totalKg || 0);
    // Reserve is needed for total
    const reservePriority = hierarchy.find(p => p.key === 'reserve');
    const totalAllWeight = Math.round(recommendedWeight + (reservePriority?.totalKg || 0));

    return {
      recommendedWeight,
      totalAllWeight
    };
  }, [hierarchy]);

  const { recommendedWeight, totalAllWeight } = stats;

  const togglePriority = (key: PriorityKey) => {
    setExpandedPriorities((prev: Set<PriorityKey>) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategory = (priorityKey: PriorityKey, categoryName: SKUCategory) => {
    const key = `${priorityKey}_${categoryName}`;
    setExpandedCategories((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleProduct = (productCode: number) => {
    const key = productCode.toString();
    setExpandedProducts((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleStoreSelection = (productCode: number, storeName: string) => {
    const key = `${productCode}_${storeName}`;
    setSelectedStores(prev => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, true);
      }
      return next;
    });
  };

  const toggleAllStoresForProduct = (item: ProductionTask) => {
    const allSelected = item.stores.every(store => {
      const key = `${item.productCode}_${store.storeName}`;
      return selectedStores.has(key);
    });

    setSelectedStores(prev => {
      const next = new Map(prev);
      item.stores.forEach(store => {
        const key = `${item.productCode}_${store.storeName}`;
        if (allSelected) {
          next.delete(key);
        } else {
          next.set(key, true);
        }
      });
      return next;
    });
  };

  const toggleSelectAllByCategory = (category: CategoryGroup) => {
    // Check if ALL items in this category are fully selected
    const allItemsSelected = category.items.every(item =>
      item.stores.every(store => {
        const key = `${item.productCode}_${store.storeName}`;
        return selectedStores.has(key);
      })
    );

    setSelectedStores(prev => {
      const next = new Map(prev);

      category.items.forEach(item => {
        item.stores.forEach(store => {
          const key = `${item.productCode}_${store.storeName}`;
          if (allItemsSelected) {
            // Deselect all
            next.delete(key);
          } else {
            // Select all
            next.set(key, true);
          }
        });
      });

      return next;
    });
  };

  const selectRecommended = () => {
    const selection = new Map<string, boolean>();

    hierarchy.forEach((priority: PriorityHierarchy) => {
      // Note: 'critical' now includes 'high' due to merge
      if (priority.key === 'critical') {
        priority.categories.forEach((category: CategoryGroup) => {
          category.items.forEach((item: ProductionTask) => {
            item.stores.forEach(store => {
              const key = `${item.productCode}_${store.storeName}`;
              selection.set(key, true);
            });
          });
        });
      }
    });

    setSelectedStores(selection);
  };

  const selectAll = () => {
    const selection = new Map<string, boolean>();

    // Select ALL items from ALL priorities
    hierarchy.forEach((priority: PriorityHierarchy) => {
      priority.categories.forEach((category: CategoryGroup) => {
        category.items.forEach((item: ProductionTask) => {
          item.stores.forEach(store => {
            const key = `${item.productCode}_${store.storeName}`;
            selection.set(key, true);
          });
        });
      });
    });

    // Also include reserve (which is handled separately in safeReserve)
    const reserveItems = filteredQueue.filter(i => i.priority === 'reserve');
    reserveItems.forEach(item => {
      item.stores.forEach(store => {
        const key = `${item.productCode}_${store.storeName}`;
        selection.set(key, true);
      });
    });

    setSelectedStores(selection);
  };

  const clearSelection = () => {
    setSelectedStores(new Map());
  };

  // 2. Формування замовлення (Step 44-50)
  const handleFormOrder = () => {
    // If no shift selected, show restriction modal
    if (currentCapacity === null) {
      setShowShiftRestrictionModal(true);
      return;
    }

    const items: OrderItem[] = [];
    let currentTotal = 0;
    hierarchy.forEach((priority: PriorityHierarchy) => {
      priority.categories.forEach((category: CategoryGroup) => {
        category.items.forEach((item: ProductionTask) => {
          item.stores.forEach((store) => {
            const key = `${item.productCode}_${store.storeName}`;
            if (selectedStores.has(key)) {
              items.push({
                id: key,
                productCode: item.productCode,
                productName: item.name,
                category: item.category,
                storeName: store.storeName,
                quantity: store.recommendedKg,
                kg: store.recommendedKg,
                minRequired: store.deficitKg,
                maxRecommended: store.recommendedKg,
                priority: item.priority
              });
            }
          });
        });
      });
    });

    if (items.length === 0) {
      alert('Оберіть товари для замовлення');
      return;
    }

    const order = {
      date: new Date().toLocaleDateString('uk-UA'),
      totalKg: selectedWeight,
      items: items.filter(item => item.kg > 0)
    };

    setOrderData(order);
    setOrderItems(order.items); // Keep for compatibility with existing modals
    setIsOrderModalOpen(true);
  };

  const handleConfirmOrder = (confirmedItems: OrderItem[]) => {
    setOrderItems(confirmedItems);
    setIsOrderModalOpen(false);
    setShowShareModal(true);
  };

  const handleShare = async (platform: SharePlatform['id']) => {
    try {
      const response = await fetch('/api/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: orderItems, platform })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Замовлення успішно відправлено через ${platform}!`);
        setShowShareModal(false);
        clearSelection();
      } else {
        alert(`❌ Помилка: ${data.error || 'Не вдалося відправити'}`);
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('❌ Помилка мережі');
    }
  };

  // Группировка по категориям
  const groupedByCategory = useMemo(() => {
    const groups = groupItemsByCategory(orderData?.items || []);
    // Добавляем эмодзи для UI
    const groupsWithEmoji: Record<string, any> = {};
    Object.entries(groups).forEach(([cat, data]) => {
      groupsWithEmoji[cat] = {
        ...data,
        emoji: getEmoji(cat)
      };
    });
    return groupsWithEmoji;
  }, [orderData]);

  // ============================================================================
  // CONDITIONAL RENDERING (after all hooks are called)
  // ============================================================================

  if (selectedStore !== 'Усі') {
    return <StoreSpecificView queue={filteredQueue} storeName={selectedStore} />;
  }

  return (
    <div className="flex flex-col h-full w-full font-sans overflow-hidden">
      {/* Header with weight counter */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-[#3e4362] bg-gradient-to-r from-[#1a1f3a] to-[#0a0e27] z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-[14px] font-black uppercase tracking-tighter text-[var(--foreground)] flex items-center gap-2">
              📋 {selectedWeight > 0 ? `Замовлення на ${selectedWeight} кг` : 'Формування замовлення'}
            </h3>

            {/* PLANNING DAYS CONTROL */}
            <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-lg border border-white/10">
              <span className="text-[10px] font-bold px-2 text-white/40 uppercase tracking-wider">План (днів):</span>
              {[1, 2, 3, 4, 5, 6, 7, 14].map((d) => (
                <button
                  key={d}
                  onClick={() => handleSetPlanningDays(d)}
                  className={cn(
                    "w-8 h-6 flex items-center justify-center rounded text-[11px] font-bold transition-all",
                    planningDays === d
                      ? "bg-[#00D4FF] text-black shadow-[0_0_10px_rgba(0,212,255,0.4)]"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#52e8ff] animate-pulse"></div>
            <span className="text-[11px] text-[#8b949e]">
              Вибрано: <span className={`font-bold ${selectedWeight > (currentCapacity || 0) ? 'text-[#e74856]' : 'text-[#52e8ff]'}`}>
                {selectedWeight} кг
              </span> / {currentCapacity ?? '—'} кг
            </span>
          </div>
        </div>
      </header>

      {/* Main Content (scrollable) */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {hierarchy.map((priority: PriorityHierarchy) => {
          // Skip reserve in main loop (rendered separately at the end)
          if (priority.key === 'reserve') return null;

          const isPriorityExpanded = expandedPriorities.has(priority.key);

          return (
            <div key={priority.key} className="border-b border-[var(--border)]/50 last:border-0">
              {/* Priority Header */}
              <div
                className="priority-card w-[90%] mx-auto my-2 px-4 py-3 rounded-xl cursor-pointer flex flex-col transition-all duration-300 hover:translate-y-[-2px] border-b border-white/5 hover:shadow-[0_8px_24px_var(--priority-shadow)]"
                style={{
                  background: `linear-gradient(135deg, ${priority.color}66 0%, ${priority.colorDark}66 100%)`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderLeft: `4px solid ${priority.glow}`,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  //@ts-ignore
                  '--priority-shadow': `${priority.glow}50`
                }}
                onClick={() => togglePriority(priority.key)}
                role="button"
                aria-expanded={isPriorityExpanded}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && togglePriority(priority.key)}
              >
                <div className="relative flex items-center justify-center w-full">
                  {/* Left: Arrow */}
                  <div className="absolute left-0">
                    {isPriorityExpanded ?
                      <ChevronDown size={20} className="text-[var(--text-muted)]" /> :
                      <ChevronRight size={20} className="text-[var(--text-muted)]" />
                    }
                  </div>

                  {/* Center: Title & Description */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[20px] filter drop-shadow-md">{priority.emoji}</span>
                      <span className="text-[14px] font-black uppercase tracking-[0.15em] text-white"
                        style={{ textShadow: `0 0 20px ${priority.color}` }}>
                        {priority.label.split('(')[0]}
                      </span>
                    </div>

                    {/* Explicit Description based on priority key */}
                    <div className="text-[9px] font-extrabold text-[#ff6b6b] uppercase tracking-wider bg-black/30 px-3 py-0.5 rounded-full border border-[#ff6b6b]/20 mt-1 max-w-[95%] text-center whitespace-nowrap shadow-[0_0_10px_rgba(255,107,107,0.1)]">
                      {priority.key === 'critical' && "⛔️ ТЕРМІНОВО ПОПОВНИТИ"}
                    </div>
                  </div>

                  {/* Right: Category Count Badge */}
                  <div className="absolute right-0">
                    <div className="px-2 py-0.5 rounded-lg bg-black/20 border border-white/5 backdrop-blur-sm">
                      <span className="text-[10px] font-bold text-white/90">
                        {priority.categoriesCount} <span className="text-white/50 text-[8px] uppercase">кат.</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Статистика (внизу карточки) */}
                <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Вага:</span>
                    <span className="text-[13px] font-black text-[#52E8FF] tracking-wide" style={{ textShadow: '0 0 10px rgba(82,232,255,0.3)' }}>
                      {priority.totalKg} кг
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories */}
              {isPriorityExpanded && priority.categories.map((category: CategoryGroup) => {
                const categoryKey = `${priority.key}_${category.categoryName}`;
                const isCategoryExpanded = expandedCategories.has(categoryKey);

                return (
                  <div key={categoryKey} className="border-b border-[var(--border)]/10 last:border-0">
                    {/* Category Row */}
                    <div
                      className="mx-2 my-1 pl-8 pr-4 py-2.5 rounded-lg hover:bg-[#2a2f4a] cursor-pointer flex items-center justify-between transition-all duration-200 group"
                      onClick={() => toggleCategory(priority.key, category.categoryName as SKUCategory)}
                      role="button"
                      aria-expanded={isCategoryExpanded}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleCategory(priority.key, category.categoryName as SKUCategory)}
                    >
                      <div className="flex items-center gap-2">
                        {isCategoryExpanded ?
                          <ChevronDown size={14} className="text-[var(--text-muted)]" /> :
                          <ChevronRight size={14} className="text-[var(--text-muted)]" />
                        }

                        {/* Select All Category Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectAllByCategory(category);
                          }}
                          className={cn(
                            "ml-2 w-4 h-4 rounded border flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100",
                            category.items.every(item => item.stores.every(store => selectedStores.has(`${item.productCode}_${store.storeName}`)))
                              ? "bg-[var(--status-normal)] border-[var(--status-normal)] opacity-100"
                              : "border-[var(--text-muted)] hover:border-[var(--status-normal)]"
                          )}
                          title="Обрати всю категорію"
                        >
                          <CheckCircle2 size={10} className="text-white" />
                        </button>

                        <span className="text-[12px] font-bold text-[var(--foreground)]">
                          {category.categoryName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          ({category.itemsCount} поз.)
                        </span>
                      </div>
                      <span
                        className="text-[13px] font-black"
                        style={{
                          background: 'linear-gradient(135deg, #E74856 0%, #FF6B6B 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {category.totalKg} кг
                      </span>
                    </div>

                    {/* Products */}
                    {isCategoryExpanded && category.items.map((item: ProductionTask) => {
                      const isProductExpanded = expandedProducts.has(item.productCode.toString());
                      const allStoresSelected = item.stores.every(store => {
                        const key = `${item.productCode}_${store.storeName}`;
                        return selectedStores.has(key);
                      });

                      return (
                        <div key={item.productCode} className="border-b border-[var(--border)]/5 last:border-0">
                          {/* Product Row */}
                          <div className="pl-16 pr-6 py-2.5 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  onClick={() => toggleProduct(item.productCode)}
                                  className="p-0.5 hover:bg-white/5 rounded transition-colors"
                                  aria-label={isProductExpanded ? "Згорнути деталі товару" : "Розгорнути деталі товару"}
                                  aria-expanded={isProductExpanded}
                                >
                                  {isProductExpanded ?
                                    <ChevronDown size={12} className="text-[var(--text-muted)]" /> :
                                    <ChevronRight size={12} className="text-[var(--text-muted)]" />
                                  }
                                </button>
                                <button
                                  onClick={() => toggleAllStoresForProduct(item)}
                                  className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                    allStoresSelected
                                      ? "bg-[var(--status-normal)] border-[var(--status-normal)]"
                                      : "border-[var(--border)] hover:border-[var(--status-normal)]"
                                  )}
                                  aria-label={`Обрати всі магазини для товару ${item.name}`}
                                  aria-checked={allStoresSelected}
                                  role="checkbox"
                                >
                                  {allStoresSelected && <CheckCircle2 size={10} className="text-white" />}
                                </button>
                                <span className="text-[11px] font-semibold text-[var(--foreground)]">
                                  {item.name}
                                </span>
                                <span className="text-[9px] text-[var(--text-muted)]">
                                  ({item.stores.length} маг.)
                                </span>
                              </div>
                              <span className="text-[12px] font-black text-[var(--status-normal)]">
                                {(() => {
                                  // DYNAMIC CALCULATION FOR PRODUCT ROW (AGGREGATE)
                                  const totalDynamic = item.stores.reduce((sum, s) => {
                                    const avg = parseFloat(String(s.avgSales)) || 0;
                                    const stock = parseFloat(String(s.currentStock)) || 0;
                                    // Formula: (Avg * Days) + (Avg * 4) - Stock
                                    const needed = Math.ceil((avg * planningDays) + (avg * 4) - stock);
                                    return sum + (needed > 0 ? needed : 0);
                                  }, 0);
                                  return totalDynamic;
                                })()} кг
                              </span>
                            </div>
                          </div>

                          {/* Stores */}
                          {isProductExpanded && (
                            <div className="bg-[var(--background)] border-t border-[var(--border)]/10">
                              {item.stores.map(store => {
                                const storeKey = `${item.productCode}_${store.storeName}`;
                                const isSelected = selectedStores.has(storeKey);

                                return (
                                  <div
                                    key={storeKey}
                                    className="pl-24 pr-6 py-2 hover:bg-white/[0.02] transition-colors flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => toggleStoreSelection(item.productCode, store.storeName)}
                                        className={cn(
                                          "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all mt-0.5",
                                          isSelected
                                            ? "bg-[var(--status-normal)] border-[var(--status-normal)]"
                                            : "border-[var(--border)] hover:border-[var(--status-normal)]"
                                        )}
                                        aria-label={`Обрати магазин ${store.storeName}`}
                                        aria-checked={isSelected}
                                        role="checkbox"
                                      >
                                        {isSelected && <CheckCircle2 size={8} className="text-white" />}
                                      </button>

                                      <div>
                                        <div className="flex items-center justify-between text-[12px] mb-1">
                                          <span className="text-white/50">🏪 {store.storeName}</span>
                                          <div className="font-mono">
                                            <span className="text-white/60">факт:</span>{' '}
                                            <span className={store.currentStock < 0 ? 'text-[#FF6B6B]' : 'text-[#52E8FF]'}>
                                              {store.currentStock.toFixed(1)}
                                            </span>
                                            <span className="text-white/30 mx-1">→</span>
                                            <span className="text-white/60">мін:</span>{' '}
                                            <span className="text-[#FFB84D]">{store.minStock.toFixed(1)}</span>
                                            <span className="text-white/30 mx-1">→</span>
                                            <span className="text-white/60">треба:</span>{' '}
                                            <span className="text-[#3FB950] font-bold">{store.recommendedKg}</span> кг
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {store.deficitKg > 0 && (
                                        <span className="text-[10px] font-black text-[#FF6B6B] bg-[#FF6B6B]/10 px-1.5 py-0.5 rounded border border-[#FF6B6B]/20" title="Срочно пополнить буфер!">
                                          🔥 {store.deficitKg} кг
                                        </span>
                                      )}
                                      <span className="text-[11px] font-bold text-[#58a6ff]">
                                        {(() => {
                                          const avg = parseFloat(String(store.avgSales)) || 0;
                                          const stock = parseFloat(String(store.currentStock)) || 0;
                                          const dynamicOrder = Math.ceil((avg * planningDays) + (avg * 4) - stock);
                                          return dynamicOrder > 0 ? dynamicOrder : 0;
                                        })()} кг
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 🔵 РЕЗЕРВ КАРТОЧКА (Step 89/92) - Always Visible */}
        {(() => {
          const reserveFromHierarchy = hierarchy.find(h => h.key === 'reserve');
          const safeReserve = reserveFromHierarchy || {
            key: 'reserve',
            label: 'РЕКОМЕНДОВАНО (зробити наперед)',
            emoji: '🔵',
            color: '#007BA7',
            totalKg: 0,
            categoriesCount: 0,
            glow: '#00BCF2',
            categories: []
          } as PriorityHierarchy;

          return (
            <div className="mb-4">
              <div
                className="priority-card w-[90%] mx-auto my-2 px-4 py-3 rounded-xl cursor-pointer flex flex-col transition-all duration-300 hover:translate-y-[-2px] border-b border-white/5 hover:shadow-[0_8px_24px_rgba(0,188,242,0.3)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,123,167,0.4) 0%, rgba(0,95,140,0.4) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderLeft: '4px solid #00BCF2',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
                onClick={() => setExpandedReserve(!expandedReserve)}
              >
                <div className="relative flex items-center justify-center w-full">
                  {/* Left: Arrow */}
                  <div className="absolute left-0">
                    {expandedReserve ?
                      <ChevronDown size={20} className="text-white/70" /> :
                      <ChevronRight size={20} className="text-white/70" />
                    }
                  </div>

                  {/* Center: Title & Description */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[20px] filter drop-shadow-md">🔵</span>
                      <span className="text-[14px] font-black uppercase tracking-[0.15em] text-white"
                        style={{ textShadow: '0 0 20px #00BCF2' }}>
                        РЕЗЕРВ
                      </span>
                    </div>

                    {/* Explicit Description for Reserve */}
                    <div className="text-[9px] font-bold text-white/70 uppercase tracking-wide bg-black/20 px-2 py-0.5 rounded-full border border-white/5 mt-0.5 max-w-[95%] text-center whitespace-nowrap">
                      ТОВАРУ НИЖЧЕ МІНІМАЛЬНОГО
                    </div>
                  </div>

                  {/* Right: Category Count Badge */}
                  <div className="absolute right-0">
                    <div className="px-2 py-0.5 rounded-lg bg-black/20 border border-white/5 backdrop-blur-sm">
                      <span className="text-[10px] font-bold text-white/90">
                        {safeReserve.categoriesCount} <span className="text-white/50 text-[8px] uppercase">кат.</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Статистика */}
                <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Вага:</span>
                    <span className="text-[13px] font-black text-[#52E8FF] tracking-wide" style={{ textShadow: '0 0 10px rgba(82,232,255,0.3)' }}>
                      {safeReserve.totalKg} кг
                    </span>
                  </div>
                </div>
              </div>

              {/* РЕЗЕРВ РОЗГОРНУТО */}
              {expandedReserve && (
                <div className="mx-3 mb-4">
                  {safeReserve.categories.map((category) => {
                    const { categoryName, itemsCount, totalKg, items: products } = category;
                    const isCategoryExpanded = expandedReserveCategories.has(categoryName);

                    return (
                      <div key={categoryName} className="mb-2">
                        {/* Категорія */}
                        <div
                          className="px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-lg cursor-pointer transition-colors flex items-center justify-between border border-white/5 group"
                          onClick={() => {
                            const newSet = new Set(expandedReserveCategories);
                            if (newSet.has(categoryName)) {
                              newSet.delete(categoryName);
                            } else {
                              newSet.add(categoryName);
                            }
                            setExpandedReserveCategories(newSet);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {isCategoryExpanded ?
                              <ChevronDown size={14} className="text-white/50" /> :
                              <ChevronRight size={14} className="text-white/50" />
                            }

                            {/* Select All Reserve Category Checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectAllByCategory(category);
                              }}
                              className={cn(
                                "ml-2 w-4 h-4 rounded border flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100",
                                category.items.every(item => item.stores.every(store => selectedStores.has(`${item.productCode}_${store.storeName}`)))
                                  ? "bg-[#00BCF2] border-[#00BCF2] opacity-100 placeholder:shadow-[0_0_10px_rgba(0,188,242,0.5)]"
                                  : "border-white/20 hover:border-[#00BCF2]"
                              )}
                              title="Обрати всю категорію"
                            >
                              <CheckCircle2 size={10} className="text-white" />
                            </button>

                            <span className="text-[13px] font-semibold text-white/90">
                              {categoryName}
                            </span>
                            <span className="text-[10px] text-white/50">
                              ({itemsCount} поз.)
                            </span>
                          </div>
                          <span className="text-[12px] font-bold text-[#00BCF2]">
                            {Math.round(totalKg)} кг
                          </span>
                        </div>

                        {/* Товари категорії */}
                        {isCategoryExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {products.map(item => {
                              const productId = item.productCode.toString();
                              const isProductExpanded = expandedReserveProducts.has(productId);
                              const productTotalKg = item.stores.reduce((sum, s) => sum + s.recommendedKg, 0);

                              return (
                                <div key={productId}>
                                  {/* Товар */}
                                  <div
                                    className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] rounded cursor-pointer transition-colors flex items-center justify-between"
                                    onClick={() => {
                                      const newSet = new Set(expandedReserveProducts);
                                      if (newSet.has(productId)) {
                                        newSet.delete(productId);
                                      } else {
                                        newSet.add(productId);
                                      }
                                      setExpandedReserveProducts(newSet);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isProductExpanded ?
                                        <ChevronDown size={12} className="text-white/40" /> :
                                        <ChevronRight size={12} className="text-white/40" />
                                      }
                                      <span className="text-[11px] text-white/80">
                                        {item.name}
                                      </span>
                                      <span className="text-[9px] text-white/40">
                                        ({item.stores.length} маг.)
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-bold text-[#58a6ff]">
                                      {Math.round(productTotalKg)} кг
                                    </span>
                                  </div>

                                  {/* Магазини */}
                                  {isProductExpanded && (
                                    <div className="ml-6 mt-1 space-y-1">
                                      {item.stores.map(store => {
                                        const storeKey = `${item.productCode}_${store.storeName}`;
                                        const isSelected = selectedStores.has(storeKey);

                                        return (
                                          <div
                                            key={storeKey}
                                            className="px-4 py-2 bg-white/[0.01] hover:bg-white/[0.03] rounded transition-colors flex items-center justify-between"
                                          >
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleStoreSelection(item.productCode, store.storeName);
                                                }}
                                                className={cn(
                                                  "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
                                                  isSelected
                                                    ? "bg-[#3FB950] border-[#3FB950]"
                                                    : "border-[#3e3e42] hover:border-[#3FB950]"
                                                )}
                                              >
                                                {isSelected && <CheckCircle2 size={8} className="text-white" />}
                                              </button>

                                              <div className="flex items-center justify-between text-[10px] flex-1">
                                                <span className="text-white/50">🏪 {store.storeName}</span>
                                                <div className="font-mono">
                                                  <span className="text-white/60">факт:</span>{' '}
                                                  <span className={store.currentStock < 0 ? 'text-[#FF6B6B]' : 'text-[#52E8FF]'}>
                                                    {store.currentStock.toFixed(1)}
                                                  </span>
                                                  <span className="text-white/30 mx-1">→</span>
                                                  <span className="text-white/60">мін:</span>{' '}
                                                  <span className="text-[#FFB84D]">{store.minStock.toFixed(1)}</span>
                                                  <span className="text-white/30 mx-1">→</span>
                                                  <span className="text-white/60">треба:</span>{' '}
                                                  <span className="text-[#3FB950] font-bold">{store.recommendedKg}</span> кг
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </main>

      <footer className="flex-shrink-0 px-4 py-5 border-t border-white/10 bg-[#0d1117]/90 backdrop-blur-xl">
        <div className="flex gap-3 items-center h-16 max-w-5xl mx-auto">
          {/* Button 1: SELECT ALL EVERYTHING */}
          <button
            onClick={selectAll}
            className="flex-1 h-full px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border border-[#52E8FF]/20 bg-[#52E8FF]/5 text-[#52E8FF] hover:bg-[#52E8FF]/10 hover:border-[#52E8FF]/40 flex flex-col items-center justify-center gap-1 group"
          >
            <span className="opacity-60 group-hover:opacity-100 italic">Все дерево</span>
            <span className="text-[13px]">Вибрати все</span>
            <span className="text-[10px] font-black opacity-80">{totalAllWeight} кг</span>
          </button>

          {/* Button 2: CONFIRM MANUAL PICK (ВИБРАТИ ОБРАНЕ) */}
          <button
            onClick={() => setIsOrderConfirmed(true)}
            disabled={selectedStores.size === 0 || isOrderConfirmed}
            className={cn(
              "flex-1 h-full px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-1 group",
              selectedStores.size > 0 && !isOrderConfirmed
                ? "border-[#3FB950]/50 bg-[#3FB950]/10 text-[#3FB950] hover:bg-[#3FB950]/20 shadow-[0_0_20px_rgba(63,185,80,0.1)]"
                : isOrderConfirmed
                  ? "border-[#3FB950] bg-[#3FB950] text-[#0d1117] shadow-[0_0_30px_rgba(63,185,80,0.3)]"
                  : "border-white/5 bg-white/5 text-white/10 cursor-not-allowed"
            )}
          >
            <span className={cn("text-[9px] italic", isOrderConfirmed ? "opacity-90" : "opacity-60")}>
              {isOrderConfirmed ? "ВИБІР ПІДТВЕРДЖЕНО" : "ТІЛЬКИ ОБРАНЕ"}
            </span>
            <span className="text-[13px]">Вибрати обране</span>
            <span className="text-[10px] font-black">{selectedWeight} кг</span>
          </button>

          {/* Button 3: FORM REQUEST (PRIMARY) */}
          <button
            onClick={handleFormOrder}
            disabled={!isOrderConfirmed}
            className={cn(
              "flex-[1.5] h-full px-6 rounded-xl font-black text-[14px] uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group",
              isOrderConfirmed
                ? "bg-gradient-to-r from-[#00D4FF] to-[#0099FF] text-white shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_50px_rgba(0,212,255,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                : "bg-white/5 text-white/5 cursor-not-allowed border border-white/5"
            )}
          >
            {isOrderConfirmed && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
            )}
            <Package size={22} className={cn(isOrderConfirmed ? "text-white animate-bounce" : "text-white/5")} />
            <span className="drop-shadow-md text-center">Сформувати заявку</span>
          </button>

          {/* Button 4: CLEAR */}
          <button
            onClick={clearSelection}
            className="flex-1 h-full px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border border-[#F85149]/20 bg-[#F85149]/5 text-[#F85149] hover:bg-[#F85149]/10 hover:border-[#F85149]/40 flex flex-col items-center justify-center gap-1 group"
          >
            <span className="opacity-60 group-hover:opacity-100 italic">Скинути вибір</span>
            <span className="text-[13px]">Очистити</span>
            <span className="text-[10px] font-black opacity-80">{selectedWeight} кг</span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      {/* Data Outdated Modal - NOW WITH BUTTON */}
      {refreshUrgency === 'critical' && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            background: 'rgba(5, 5, 10, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="relative w-full max-w-md bg-[#161b22] border border-[#f85149]/30 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(248,81,73,0.3)]">

            {/* Pulse Effect */}
            <div className="absolute inset-0 bg-[#f85149]/5 animate-pulse pointer-events-none" />

            <div className="w-20 h-20 bg-[#f85149]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#f85149]/20">
              <AlertTriangle size={40} className="text-[#f85149]" />
            </div>

            <h3 className="text-2xl font-black text-white uppercase mb-2">
              Дані застаріли
            </h3>

            <p className="text-[#8b949e] mb-8 leading-relaxed">
              Інформація не оновлювалась більше 15 хвилин.
              <br />
              Для продовження роботи необхідно оновити дані.
            </p>

            {/* DIRECT ACTION BUTTON */}
            {onManualRefresh ? (
              <button
                onClick={onManualRefresh}
                className="mx-auto px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-white bg-[#f85149] hover:bg-[#da3633] transition-all shadow-[0_0_20px_rgba(248,81,73,0.4)] hover:scale-105 active:scale-95 flex items-center gap-3 justify-center"
              >
                <RefreshCw size={20} className="animate-spin-slow" />
                Оновити дані зараз
              </button>
            ) : (
              <div className="animate-bounce">
                <span className="text-[#f85149] text-xs font-bold uppercase tracking-widest">
                  ☝️ Натисніть "Оновити" в меню зліва
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shift Restriction Modal */}
      {showShiftRestrictionModal && refreshUrgency !== 'critical' && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowShiftRestrictionModal(false)}
        >
          <div
            className="w-[400px] bg-[#161b22] border border-[#f85149]/30 rounded-2xl shadow-[0_0_50px_rgba(248,81,73,0.15)] p-6 space-y-4 animate-in zoom-in duration-300 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f85149]/5 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

            {/* Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#f85149]/10 flex items-center justify-center border border-[#f85149]/20 shadow-[0_0_20px_rgba(248,81,73,0.1)]">
                <AlertTriangle size={32} className="text-[#f85149] animate-pulse" />
              </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-2 relative z-10">
              <h3 className="text-xl font-black text-[#e6edf3] uppercase tracking-wide">
                Зміна не обрана
              </h3>
              <p className="text-[13px] text-[#8b949e] leading-relaxed">
                Неможливо сформувати замовлення без активної зміни.
                <br />
                Будь ласка, натисніть кнопку <span className="text-[#00D4FF] font-bold">Персонал</span> у верхній панелі керування (поруч із оновленням залишків) та оберіть зміну.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 relative z-10">
              <button
                onClick={() => setShowShiftRestrictionModal(false)}
                className="w-full py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-[0.98]"
              >
                ЗРОЗУМІЛО
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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
    </div >
  );
};
