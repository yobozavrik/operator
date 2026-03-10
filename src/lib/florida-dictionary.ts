/**
 * Helper file to define unit formats for Florida products
 * By default, products will show as "шт.", but we map specific ones to "кг" or "г".
 */

export function getFloridaUnit(productName: string): 'шт' | 'кг' {
    const normName = productName.toLowerCase().trim();

    // Florida mostly produces semi-finished goods (Вареники, Пельмені, Млинці).
    // Some are sold by weight, some by piece. 
    // Let's assume standard ones that might be measured in kg or g.
    if (normName.includes('вагова') || normName.includes('ваговий')) {
        return 'кг';
    }

    // Add any specific metric lookups here based on your database specifics.
    // E.g., if "Вареники з картоплею" is measured in kg:
    // if (normName.includes('вареники')) return 'кг';

    // Default to units "шт" 
    return 'шт';
}
