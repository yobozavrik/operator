export type SKUCategory =
  | 'ВАРЕНИКИ' | 'ПЕЛЬМЕНІ' | 'ХІНКАЛІ' | 'ЧЕБУРЕКИ'
  | 'КОВБАСКИ' | 'ГОЛУБЦІ' | 'КОТЛЕТИ' | 'СИРНИКИ'
  | 'ФРИКАДЕЛЬКИ' | 'ЗРАЗИ' | 'ПЕРЕЦЬ' | 'МЛИНЦІ' | 'БЕНДЕРИКИ';

export const STORES = [
  'Кварц', 'Садгора', 'Хотинська',
  'Білоруська', 'Руська', 'Компас'
];

export interface SKU {
  id: string;
  name: string;
  category: SKUCategory;
  totalStockKg: number;
  dailyForecastKg: number;
  minStockThresholdKg: number;
  outOfStockStores: number;
  salesTrendKg: number[];
  storeStocks: Record<string, number>;
}

export interface ProductionTask extends SKU {
  recommendedQtyKg: number;
  priority: 'critical' | 'high' | 'reserve' | 'normal';
  priorityReason: string;
  storeName?: string;
  status: 'pending' | 'in-progress' | 'completed';
  timeStarted?: number;
}

const CATEGORIES: SKUCategory[] = [
  'ВАРЕНИКИ', 'ПЕЛЬМЕНІ', 'ХІНКАЛІ', 'ЧЕБУРЕКИ',
  'КОВБАСКИ', 'ГОЛУБЦІ', 'КОТЛЕТИ', 'СИРНИКИ',
  'ФРИКАДЕЛЬКИ', 'ЗРАЗИ', 'ПЕРЕЦЬ', 'МЛИНЦІ', 'БЕНДЕРИКИ'
];

const CATEGORY_NAMES: Record<SKUCategory, string[]> = {
  'ВАРЕНИКИ': ['Вареники з картоплею', 'Вареники з сиром', 'Вареники з вишнею', 'Вареники з капустою'],
  'ПЕЛЬМЕНІ': ['Пельмені Свино-яловичі', 'Пельмені Курячі', 'Пельмені Сибірські'],
  'ХІНКАЛІ': ['Хінкалі Класичні', 'Хінкалі з бараниною'],
  'ЧЕБУРЕКИ': ['Чебуреки з м’ясом', 'Чебуреки з сиром'],
  'КОВБАСКИ': ['Ковбаски Мисливські', 'Ковбаски Гриль'],
  'ГОЛУБЦІ': ['Голубці Домашні', 'Голубці з грибами'],
  'КОТЛЕТИ': ['Котлети По-київськи', 'Котлети Свинячі'],
  'СИРНИКИ': ['Сирники Класичні', 'Сирники з изюмом'],
  'ФРИКАДЕЛЬКИ': ['Фрикадельки Курячі', 'Фрикадельки Яловичі'],
  'ЗРАЗИ': ['Зрази з грибами', 'Зрази з м’ясом'],
  'ПЕРЕЦЬ': ['Перець Фарширований'],
  'МЛИНЦІ': ['Млинці з сиром', 'Млинці з м’ясом', 'Млинці з маком'],
  'БЕНДЕРИКИ': ['Бендерики з м’ясом', 'Бендерики з грибами']
};

// Простая детерминированная функция для предотвращения Hydration Mismatch
let seed = 12345;
const deterministicRandom = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

export const mockSKUs: SKU[] = Array.from({ length: 80 }).map((_, i) => {
  const category = CATEGORIES[i % CATEGORIES.length];
  const namesForCat = CATEGORY_NAMES[category];
  const name = namesForCat[i % namesForCat.length] + (i >= namesForCat.length ? ` #${Math.floor(i / namesForCat.length)}` : '');

  const dailyForecastKg = Number((deterministicRandom() * 30 + 10).toFixed(1));
  const storeStocks: Record<string, number> = {};
  let outOfStockCount = 0;
  let totalStock = 0;

  STORES.forEach(store => {
    // Детерминированный выбор: пусто или нет
    const isOutOfStock = deterministicRandom() < 0.25;
    const stock = isOutOfStock ? 0 : Number((deterministicRandom() * 15).toFixed(1));
    storeStocks[store] = stock;
    if (stock === 0) outOfStockCount++;
    totalStock += stock;
  });

  return {
    id: `sku-${i}`,
    name,
    category,
    totalStockKg: Number(totalStock.toFixed(1)),
    dailyForecastKg,
    minStockThresholdKg: Number((dailyForecastKg * 0.5).toFixed(1)),
    outOfStockStores: outOfStockCount,
    salesTrendKg: Array.from({ length: 10 }).map(() => Number((deterministicRandom() * 15 + 5).toFixed(1))),
    storeStocks,
  };
});

export function getProductionQueue(skus: SKU[]): ProductionTask[] {
  return skus
    .map(sku => {
      let priority: 'critical' | 'high' | 'normal' = 'normal';
      let reason = '';

      if (sku.outOfStockStores >= 3) {
        priority = 'critical';
        reason = `КРИТИЧНИЙ ДЕФІЦИТ: ${sku.outOfStockStores} ТОЧОК`;
      } else if (sku.totalStockKg < sku.minStockThresholdKg) {
        priority = 'high';
        reason = 'НИЗЬКИЙ ЗАЛИШОК';
      } else {
        reason = 'В НОРМІ';
      }

      const recommendedQtyKg = Math.max(0, Number((sku.dailyForecastKg * 1.5 - sku.totalStockKg).toFixed(0)));

      return {
        ...sku,
        recommendedQtyKg: Math.round(recommendedQtyKg / 10) * 10 || 20, // Округление до 10кг для реального производства
        priority,
        priorityReason: reason,
        status: 'pending' as const,
      };
    })
    .sort((a, b) => {
      const priorityMap = { critical: 0, high: 1, reserve: 2, normal: 3 };
      return priorityMap[a.priority as keyof typeof priorityMap] - priorityMap[b.priority as keyof typeof priorityMap];
    });
}

export interface SupabaseRow {
  код_магазину: number;
  назва_магазину: string;
  код_продукту: number;
  назва_продукту: string;
  category_name: string;
  current_stock: number;
  min_stock: number;
  deficit_kg: number;
  avg_sales_day: number;
  deficit_percent: number;
  priority: number;
}

export function transformSupabaseData(rows: SupabaseRow[]): ProductionTask[] {
  if (!rows || !Array.isArray(rows)) return [];

  const productMap = new Map<number, ProductionTask>();

  rows.forEach(row => {
    if (!productMap.has(row.код_продукту)) {
      productMap.set(row.код_продукту, {
        id: row.код_продукту.toString(),
        name: row.назва_продукту,
        category: row.category_name as SKUCategory,
        totalStockKg: 0,
        dailyForecastKg: 0,
        minStockThresholdKg: 0,
        outOfStockStores: 0,
        salesTrendKg: [],
        storeStocks: {},
        recommendedQtyKg: 0,
        priority: row.priority === 1 ? 'critical' : row.priority <= 3 ? 'high' : 'normal',
        priorityReason: row.priority === 1 ? 'КРИТИЧНИЙ ДЕФІЦИТ' : 'ПОТРЕБА ПЛАНУ',
        status: 'pending',
      });
    }

    const task = productMap.get(row.код_продукту)!;
    task.totalStockKg += Number(row.current_stock);
    task.dailyForecastKg += Number(row.avg_sales_day);
    task.minStockThresholdKg += Number(row.min_stock);
    task.recommendedQtyKg += Number(row.deficit_kg);
    task.storeStocks[row.назва_магазину] = Number(row.current_stock);
    if (Number(row.current_stock) === 0) task.outOfStockStores++;

    // Custom field for deficit_percent to use in UI
    (task as any).deficitPercent = row.deficit_percent;
  });

  return Array.from(productMap.values()).sort((a, b) => {
    const pMap = { critical: 0, high: 1, reserve: 2, normal: 3 };
    return pMap[a.priority as keyof typeof pMap] - pMap[b.priority as keyof typeof pMap];
  });
}
