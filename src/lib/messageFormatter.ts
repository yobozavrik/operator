import { OrderItem, SavedOrder } from '@/types/order';
import { SKUCategory } from '@/types/bi';

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

interface CategoryGroup {
    category: SKUCategory;
    emoji: string;
    totalKg: number;
    items: OrderItem[];
}

function groupByCategory(items: OrderItem[]): CategoryGroup[] {
    const groups = new Map<SKUCategory, OrderItem[]>();

    items.forEach(item => {
        if (!groups.has(item.category)) {
            groups.set(item.category, []);
        }
        groups.get(item.category)!.push(item);
    });

    return Array.from(groups.entries())
        .map(([category, items]) => ({
            category,
            emoji: getEmoji(category),
            totalKg: items.reduce((sum, item) => sum + item.quantity, 0),
            items: items.sort((a, b) => a.productName.localeCompare(b.productName))
        }))
        .sort((a, b) => b.totalKg - a.totalKg);
}

export function formatOrderMessage(items: OrderItem[], date: string = new Date().toISOString()): string {
    const lines: string[] = [];

    // Header
    lines.push('📋 ЗАМОВЛЕННЯ НА ВИРОБНИЦТВО');
    lines.push('═'.repeat(40));
    lines.push(`📅 Дата: ${new Date(date).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`);
    lines.push('');

    // Group by category
    const byCategory = groupByCategory(items);

    byCategory.forEach(({ category, emoji, totalKg, items }) => {
        lines.push(`${emoji} ${category}: ${totalKg.toFixed(1)} кг`);
        lines.push('─'.repeat(40));

        items.forEach(item => {
            lines.push(`  • ${item.productName}`);
            lines.push(`    ${item.storeName}: ${item.quantity.toFixed(1)} кг`);
        });

        lines.push('');
    });

    // Footer
    const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0);
    lines.push('═'.repeat(40));
    lines.push(`⚖️ ВСЬОГО: ${totalWeight.toFixed(1)} кг`);
    lines.push(`📦 Позицій: ${items.length}`);

    return lines.join('\n');
}

export function formatOrderMessageHTML(items: OrderItem[], date: string = new Date().toISOString()): string {
    const lines: string[] = [];

    // Header
    lines.push('<b>📋 ЗАМОВЛЕННЯ НА ВИРОБНИЦТВО</b>');
    lines.push('═'.repeat(40));
    lines.push(`📅 Дата: ${new Date(date).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`);
    lines.push('');

    // Group by category
    const byCategory = groupByCategory(items);

    byCategory.forEach(({ category, emoji, totalKg, items }) => {
        lines.push(`<b>${emoji} ${category}: ${totalKg.toFixed(1)} кг</b>`);
        lines.push('─'.repeat(40));

        items.forEach(item => {
            lines.push(`  • ${item.productName}`);
            lines.push(`    <i>${item.storeName}</i>: ${item.quantity.toFixed(1)} кг`);
        });

        lines.push('');
    });

    // Footer
    const totalWeight = items.reduce((sum, item) => sum + item.quantity, 0);
    lines.push('═'.repeat(40));
    lines.push(`<b>⚖️ ВСЬОГО: ${totalWeight.toFixed(1)} кг</b>`);
    lines.push(`📦 Позицій: ${items.length}`);

    return lines.join('\n');
}
