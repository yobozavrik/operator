'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

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

const getEmoji = (category: string) => CATEGORY_EMOJI[category] || '📦';

interface Props {
  queue: any[];
}

export const BIPowerMatrix = ({ queue }: Props) => {
  const [expandedPriorities, setExpandedPriorities] = useState<Set<string>>(
    new Set(['critical', 'high'])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Построение иерархии: приоритет → категория
  const hierarchy = useMemo(() => {
    // Map: priority_label → category_name → items[]
    const priorityMap = new Map<string, Map<string, any[]>>();

    queue.forEach(item => {
      // Используем актуальные поля из ProductionTask
      const priorityLabel = item['priority'] || 'reserve';
      const categoryName = item['category'] || 'Інше';

      if (!priorityMap.has(priorityLabel)) {
        priorityMap.set(priorityLabel, new Map());
      }

      const categoryMap = priorityMap.get(priorityLabel)!;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }

      categoryMap.get(categoryName)!.push(item);
    });

    // Преобразование в структуру
    const priorityConfigs = [
      { key: 'critical', label: 'КРИТИЧНО (товару немає)', emoji: '🔴', color: '#e74856' },
      { key: 'high', label: 'ВАЖЛИВО (ходовий товар)', emoji: '🟠', color: '#ffc000' },
      { key: 'reserve', label: 'РЕКОМЕНДОВАНО (зробити наперед)', emoji: '🔵', color: '#00bcf2' }
    ];

    return priorityConfigs.map(config => {
      const categoryMap = priorityMap.get(config.key);
      if (!categoryMap || categoryMap.size === 0) return null;

      const categories: any[] = [];
      let totalKg = 0;

      categoryMap.forEach((items, categoryName) => {
        const categoryKg = items.reduce((sum, item) => sum + Number(item['recommendedQtyKg'] || 0), 0);

        categories.push({
          categoryName,
          emoji: getEmoji(categoryName),
          totalKg: Math.round(categoryKg),
          itemsCount: items.length,
          items
        });

        totalKg += categoryKg;
      });

      return {
        key: config.key,
        label: config.label,
        emoji: config.emoji,
        color: config.color,
        totalKg: Math.round(totalKg),
        categoriesCount: categories.length,
        categories: categories.sort((a, b) => b.totalKg - a.totalKg) // Сортируем категории по весу
      };
    }).filter(Boolean);
  }, [queue]);

  const togglePriority = (key: string) => {
    setExpandedPriorities(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCategory = (priorityKey: string, categoryName: string) => {
    const key = `${priorityKey}_${categoryName}`;
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-[#252526] rounded border border-[#3e3e42] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3e3e42] bg-[#1e1e1e]">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-white">
          📋 Формування замовлення
        </h3>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[#1e1e1e]">
        {hierarchy.map(priority => {
          if (!priority) return null;
          const isPriorityExpanded = expandedPriorities.has(priority.key);

          return (
            <div key={priority.key} className="border-b border-[#3e3e42]/50">
              {/* УРОВЕНЬ 1: Приоритет */}
              <div
                className="px-4 py-3 bg-[#2d1f1f] hover:bg-[#352323] cursor-pointer flex items-center justify-between transition-colors"
                onClick={() => togglePriority(priority.key)}
              >
                <div className="flex items-center gap-2">
                  {isPriorityExpanded ?
                    <ChevronDown size={14} className="text-white" /> :
                    <ChevronRight size={14} className="text-white" />
                  }
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: priority.color }}
                  >
                    {priority.emoji} {priority.label}
                  </span>
                  <span className="text-[9px] text-slate-600">
                    ({priority.categoriesCount} кат.)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-white">
                  {priority.totalKg} кг
                </span>
              </div>

              {/* УРОВЕНЬ 2: Категории */}
              {isPriorityExpanded && priority.categories.map(category => {
                const categoryKey = `${priority.key}_${category.categoryName}`;
                const isCategoryExpanded = expandedCategories.has(categoryKey);

                return (
                  <div key={categoryKey} className="border-b border-[#3e3e42]/10 last:border-0">
                    {/* Category Row */}
                    <div
                      className="pl-8 pr-4 py-2.5 hover:bg-[#2d2d30] cursor-pointer flex items-center justify-between transition-colors"
                      onClick={() => toggleCategory(priority.key, category.categoryName)}
                    >
                      <div className="flex items-center gap-2">
                        {isCategoryExpanded ?
                          <ChevronDown size={12} className="text-white" /> :
                          <ChevronRight size={12} className="text-white" />
                        }
                        <span className="text-[12px] font-semibold text-white">
                          {category.emoji} {category.categoryName}
                        </span>
                        <span className="text-[9px] text-slate-600">
                          ({category.itemsCount} поз.)
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#00bcf2]">
                        {category.totalKg} кг
                      </span>
                    </div>

                    {/* Placeholder для товаров */}
                    {isCategoryExpanded && (
                      <div className="pl-12 py-4 text-center text-slate-500 text-[10px]">
                        (Тут будуть товари)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
