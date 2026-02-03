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
import { generateExcel, groupItemsByCategory } from '@/lib/order-export';

const CATEGORY_EMOJI: Record<string, string> = {};

const getEmoji = (category: string) => '';

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
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
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

    const priorityConfigs = [
      {
        key: 'critical',
        label: 'КРИТИЧНО (товару немає)',
        emoji: '🔴',
        color: '#E74856',
        colorDark: '#C41E3A',
        glow: '#FF6B6B'
      },
      {
        key: 'high',
        label: 'ВАЖЛИВО (ходовий товар)',
        emoji: '🟠',
        color: '#FFC000',
        colorDark: '#FF8C00',
        glow: '#FFD700'
      },
      {
        key: 'reserve',
        label: 'РЕКОМЕНДОВАНО (зробити наперед)',
        emoji: '🔵',
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
  const handleFormOrder = () => {
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
                kg: store.recommendedKg, // For user's Step 4
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

  const recommendedWeight = useMemo(() => {
    let total = 0;
    hierarchy.forEach((priority: PriorityHierarchy) => {
      if (priority.key === 'critical') {
        total += priority.totalKg;
      }
    });
    return Math.round(total);
  }, [hierarchy]);

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
          <h3 className="text-[14px] font-black uppercase tracking-tighter text-[var(--foreground)] flex items-center gap-2">
            📋 {selectedWeight > 0 ? `Замовлення на ${selectedWeight} кг` : 'Формування замовлення'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#52e8ff] animate-pulse"></div>
            <span className="text-[11px] text-[#8b949e]">
              Вибрано: <span className={`font-bold ${selectedWeight > 450 ? 'text-[#e74856]' : 'text-[#52e8ff]'}`}>
                {selectedWeight} кг
              </span> / 450 кг
            </span>
          </div>
        </div>
      </header>

      {/* Main Content (scrollable) */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {hierarchy.map((priority: PriorityHierarchy) => {
          const isPriorityExpanded = expandedPriorities.has(priority.key);

          return (
            <div key={priority.key} className="border-b border-[var(--border)]/50 last:border-0">
              {/* Priority Header */}
              <div
                className="priority-card m-3 px-5 py-4 rounded-xl cursor-pointer flex flex-col transition-all duration-300 hover:translate-y-[-2px] border-b border-white/5 hover:shadow-[0_8px_24px_var(--priority-shadow)]"
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
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {isPriorityExpanded ?
                      <ChevronDown size={20} className="text-[var(--text-muted)]" /> :
                      <ChevronRight size={20} className="text-[var(--text-muted)]" />
                    }

                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">{priority.emoji}</span>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-white">
                          {priority.label.split('(')[0]}
                        </div>
                        <div className="text-[9px] text-white/70 mt-0.5">
                          {priority.label.match(/\((.*?)\)/)?.[1] || ''}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-[var(--text-muted)] font-semibold ml-2">
                      ({priority.categoriesCount} кат.)
                    </span>
                  </div>
                  {/* Weight removed from top right as it is now in stats */}
                </div>

                {/* Статистика (внизу карточки) */}
                <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/60 uppercase tracking-wide">Вага:</span>
                    <span className="text-[14px] font-bold text-white">{priority.totalKg} кг</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/60 uppercase tracking-wide">Категорії:</span>
                    <span className="text-[12px] font-semibold text-white">{priority.categoriesCount}</span>
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
                      className="mx-2 my-1 pl-8 pr-4 py-2.5 rounded-lg hover:bg-[#2a2f4a] cursor-pointer flex items-center justify-between transition-all duration-200"
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
                                      <span className="text-[11px] font-bold text-[#58a6ff]">
                                        {store.recommendedKg} кг
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
      </main>

      {/* Footer (Fixed) */}
      <footer className="flex-shrink-0 px-6 py-4 border-t border-[var(--border)] bg-[var(--background)]/80">
        <div className="flex gap-2">
          <button
            onClick={selectRecommended}
            className="flex-1 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              background: 'rgba(63, 185, 80, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(63, 185, 80, 0.4)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              color: '#3FB950'
            }}
          >
            <CheckCircle2 size={14} />
            ВИБРАТИ КРИТИЧНІ
            <span className="font-bold ml-1">{recommendedWeight} КГ</span>
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
            onClick={handleFormOrder}
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
      </footer>

      {/* Modals */}
      {
        isOrderModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setIsOrderModalOpen(false)}
          >
            {/* Модальное окно */}
            <div
              className="relative w-[90vw] max-w-[600px] max-h-[80vh] flex flex-col rounded-2xl"
              style={{
                background: 'rgba(26, 31, 58, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header (фиксированный) */}
              <div className="flex-shrink-0 p-6 pb-4">
                <h2 className="text-[20px] font-bold text-white mb-2">
                  ✓ Підтвердження замовлення
                </h2>
                <p className="text-[12px] text-white/60">
                  Перевірте деталі перед відправкою в виробництво
                </p>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
                {/* Информация о заказе */}
                <div className="mb-6 p-4 rounded-xl" style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-white/60 uppercase">Дата:</span>
                    <span className="text-[13px] font-semibold text-white">{orderData?.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/60 uppercase">Загальна вага:</span>
                    <span className="text-[16px] font-bold text-[#52E8FF]">{orderData?.totalKg} кг</span>
                  </div>
                </div>

                {/* Список товаров */}
                <div className="mb-6">
                  <h3 className="text-[12px] font-semibold text-white/80 uppercase mb-3">
                    Товари до виробництва:
                  </h3>

                  {/* Группировка по категориям */}
                  {Object.entries(groupedByCategory).map(([categoryName, categoryData]: any) => (
                    <div key={categoryName} className="mb-4">
                      {/* Категория + общий вес */}
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                        <div className="text-[13px] font-bold text-white">
                          {categoryData.emoji} {categoryName}
                        </div>
                        <div className="text-[14px] font-bold text-[#52E8FF]">
                          {categoryData.totalKg} кг
                        </div>
                      </div>

                      {/* Товары внутри категории */}
                      <div className="ml-4 space-y-2">
                        {categoryData.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-1.5 text-[11px]">
                            <span className="text-white/70">• {item.productName}</span>
                            <span className="font-semibold text-[#52E8FF]">{item.kg} кг</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer (фиксированный) */}
              <div className="flex-shrink-0 p-8 border-t border-white/10">
                <div className="flex items-center gap-3">
                  {/* Кнопка СКАСУВАТИ */}
                  <button
                    className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:bg-white/[0.1]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff'
                    }}
                    onClick={() => setIsOrderModalOpen(false)}
                  >
                    ✕ СКАСУВАТИ
                  </button>

                  {/* Кнопка ПІДТВЕРДИТИ */}
                  <button
                    className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #3FB950 0%, #2EA043 100%)',
                      border: '1px solid rgba(63, 185, 80, 0.3)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(63, 185, 80, 0.3)'
                    }}
                    onClick={() => {
                      console.log('Заказ подтверждён:', orderData);
                      handleConfirmOrder(orderData?.items || []);
                    }}
                  >
                    ✓ ПІДТВЕРДИТИ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

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
