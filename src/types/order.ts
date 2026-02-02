import { SKUCategory, PriorityKey } from './bi';

export interface OrderItem {
    id: string;
    productCode: number;
    productName: string;
    category: SKUCategory;
    storeName: string;
    quantity: number;
    priority: PriorityKey;
}

export interface SavedOrder {
    id: string;
    date: string;
    totalWeight: number;
    items: OrderItem[];
    status: 'sent' | 'pending' | 'completed';
    sentTo: ('telegram' | 'viber' | 'whatsapp')[];
    createdBy: string;
}

export interface SharePlatform {
    id: 'telegram' | 'viber' | 'whatsapp' | 'download';
    label: string;
    icon: string;
    color: string;
}
