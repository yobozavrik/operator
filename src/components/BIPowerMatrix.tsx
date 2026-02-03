'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Package } from 'lucide-react';
import { ProductionTask, PriorityKey, SKUCategory, PriorityHierarchy, CategoryGroup } from '@/types/bi';
import { cn } from '@/lib/utils';
import { UI_TOKENS } from '@/lib/design-tokens';
import { useStore } from '@/context/StoreContext';
import { StoreSpecificView } from './StoreSpecificView';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { ShareOptionsModal } from './ShareOptionsModal';
import { OrderItem, SharePlatform } from '@/types/order';

const CATEGORY_EMOJI: Record<string, string> = {
  'ВАРЕНИКИ': '🥟',
  'ПЕЛЬМЕНІ': '🥢',
  'ХІНКАЛІ': '🥡',
  'ЧЕБУРЕКИ': '🌯',
  'КОВБАСКИ': '🌭',
  'ГОЛУБЦІ': '🥬',
  'КОТЛЕТИ': '🥩',
  'СИРНИКИ': '🥞',
  'ФРИКАДЕЛЬКИ': '🧆',
  'ЗРАЗИ': '🥔',
  'ПЕРЕЦЬ ФАРШИРОВАНИЙ': '🫑',
  'МЛИНЦІ': '🥞',
  'БЕНДЕРИКИ': '🌮'
};

const getEmoji = (category: string) => CATEGORY_EMOJI[category.toUpperCase()] || '📦';

interface Props {
  deficitQueue: ProductionTask[];
  allProductsQueue: ProductionTask[];
}

export const BIPowerMatrix = ({ deficitQueue, allProductsQueue }: Props) => {
  const { selectedStore } = useStore();
  const [expandedPriorities, setExpandedPriorities] = useState<Set<PriorityKey>>(
    new Set(['critical', 'high'] as PriorityKey[])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedStores, setSelectedStores] = useState<Map<string, boolean>>(new Map());

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Вибираємо правильний датасет залежно від режиму
  const queue = selectedStore === 'Усі' ? deficitQueue : allProductsQueue;

  // Фільтруємо чергу залежно від обраного магазину
  const filteredQueue = useMemo((): ProductionTask[] => {
    if (selectedStore === 'Усі') return queue;

    return queue
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
  }, [queue, selectedStore]);

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
      const priorityLabel = item.priority || 'reserve';
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

    const priorityConfigs: { key: PriorityKey; label: string }[] = [
      { key: 'critical', label: 'Критично (товару немає)' },
      { key: 'high', label: 'Важливо (ходовий товар)' },
      { key: 'reserve', label: 'Рекомендовано (зробити наперед)' }
    ];

    return priorityConfigs.map(config => {
      const categoryMap = priorityMap.get(config.key);
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
        emoji: '',
        color: String(UI_TOKENS.colors.priority[config.key] || '#8B949E'),
        totalKg: Math.round(totalKg),
        categoriesCount: categories.length,
        categories: categories.sort((a, b) => b.totalKg - a.totalKg)
      } as PriorityHierarchy;
    }).filter((p): p is PriorityHierarchy => p !== null);
  }, [filteredQueue]);

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

  const selectRecommended = () => {
    const selection = new Map<string, boolean>();

    hierarchy.forEach((priority: PriorityHierarchy) => {
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

  const clearSelection = () => {
    setSelectedStores(new Map());
  };

  // 5. Функція відправки
  const submitOrder = () => {
    const items: OrderItem[] = [];

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

    setOrderItems(items);
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = (confirmedItems: OrderItem[]) => {
    setOrderItems(confirmedItems);
    setShowConfirmModal(false);
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

  const recommendedWeight = useMemo(() => {
    let total = 0;
    hierarchy.forEach((priority: PriorityHierarchy) => {
      if (priority.key === 'critical') {
        total += priority.totalKg;
      }
    });
    return Math.round(total);
  }, [hierarchy]);

  // ============================================================================
  // CONDITIONAL RENDERING (after all hooks are called)
  // ============================================================================

  if (selectedStore !== 'Усі') {
    return <StoreSpecificView queue={filteredQueue} storeName={selectedStore} />;
  }

  return (
    <div className="flex flex-col h-full bg-[#0F1F19]/40 rounded-xl border border-[var(--border)] overflow-hidden font-sans">
      {/* Header with weight counter */}
      <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--background)]/80">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-black uppercase tracking-tighter text-[var(--foreground)] flex items-center gap-2">
            📋 {selectedWeight > 0 ? `Замовлення на ${selectedWeight} кг` : 'Формування замовлення'}
          </h3>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest leading-none mb-1">Вибрано до виробництва</span>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-lg font-black leading-none",
                selectedWeight > 0 ? "text-[var(--status-normal)]" : "text-[var(--text-muted)]"
              )}>
                {selectedWeight}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold">кг</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--background)]/20">
        {hierarchy.map((priority: PriorityHierarchy) => {
          const isPriorityExpanded = expandedPriorities.has(priority.key);

          return (
            <div key={priority.key} className="border-b border-[var(--border)]/50 last:border-0">
              {/* Priority Header */}
              <div
                className="px-6 py-4 bg-[var(--panel)]/50 hover:bg-[var(--panel)] cursor-pointer flex items-center justify-between transition-colors border-b border-[var(--border)]/30"
                onClick={() => togglePriority(priority.key)}
                role="button"
                aria-expanded={isPriorityExpanded}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && togglePriority(priority.key)}
              >
                <div className="flex items-center gap-3">
                  {isPriorityExpanded ?
                    <ChevronDown size={16} className="text-[var(--text-muted)]" /> :
                    <ChevronRight size={16} className="text-[var(--text-muted)]" />
                  }
                  <span
                    className="text-[12px] font-black uppercase tracking-wider"
                    style={{ color: priority.color }}
                  >
                    {priority.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                    ({priority.categoriesCount} кат.)
                  </span>
                </div>
                <span className="text-[14px] font-black text-[var(--foreground)]">
                  {priority.totalKg} кг
                </span>
              </div>

              {/* Categories */}
              {isPriorityExpanded && priority.categories.map((category: CategoryGroup) => {
                const categoryKey = `${priority.key}_${category.categoryName}`;
                const isCategoryExpanded = expandedCategories.has(categoryKey);

                return (
                  <div key={categoryKey} className="border-b border-[var(--border)]/10 last:border-0">
                    {/* Category Row */}
                    <div
                      className="pl-10 pr-6 py-3 hover:bg-[var(--panel)] cursor-pointer flex items-center justify-between transition-colors"
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
                        <span className="text-[14px]">{category.emoji}</span>
                        <span className="text-[12px] font-bold text-[var(--foreground)]">
                          {category.categoryName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          ({category.itemsCount} поз.)
                        </span>
                      </div>
                      <span className="text-[13px] font-black text-[var(--status-normal)]">
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
                                {item.recommendedQtyKg} кг
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
                                          "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
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
                                      <span className="text-[10px] text-[var(--text-muted)]">
                                        {store.storeName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[9px] text-[var(--status-critical)]">
                                        -{store.deficitKg.toFixed(1)} кг
                                      </span>
                                      <span className="text-[11px] font-bold text-[var(--status-normal)]">
                                        {store.recommendedKg.toFixed(1)} кг
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
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)]/80">
        <div className="flex gap-2">
          <button
            onClick={selectRecommended}
            className="flex-1 px-4 py-2.5 bg-[#238636] hover:bg-[#2EA043] text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
          >
            <CheckCircle2 size={14} />
            Вибрати КРИТИЧНІ
            <span className="text-white font-bold ml-1">{recommendedWeight} кг</span>
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2.5 bg-black/20 border border-[var(--border)] hover:bg-black/30 text-[var(--text-muted)] hover:text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
          >
            Очистити
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={submitOrder}
            disabled={selectedStores.size === 0}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
              selectedStores.size > 0
                ? "bg-[var(--status-normal)] hover:brightness-110 text-white shadow-lg shadow-emerald-500/20"
                : "bg-[#252526] text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            <Package size={14} />
            Сформувати
          </button>
        </div>
      </div>

      {/* Modals */}
      <OrderConfirmationModal
        isOpen={showConfirmModal}
        items={orderItems}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmOrder}
      />

      <ShareOptionsModal
        isOpen={showShareModal}
        items={orderItems}
        onClose={() => setShowShareModal(false)}
        onShare={handleShare}
      />
    </div>
  );
};
