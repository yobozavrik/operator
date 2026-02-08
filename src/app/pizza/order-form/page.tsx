'use client';

import React from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/layout';
import { transformPizzaData } from '@/lib/transformers';
import { ProductionOpsTable } from '@/components/production/ProductionOrderTable';
import { ChefHat } from 'lucide-react';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Data fetch failed');
    return res.json();
};

export default function OrderFormPage() {
    // Reuse existing API to get full stats including stores and deficits
    const { data: allProductsData, error, isLoading, mutate } = useSWR<any[]>(
        '/api/pizza/orders',
        fetcher,
        { refreshInterval: 60000 }
    );

    const handleRefresh = React.useCallback(async () => {
        await mutate();
    }, [mutate]);

    const productQueue = React.useMemo(() => {
        if (!allProductsData) return [];
        return transformPizzaData(allProductsData);
    }, [allProductsData]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0F1220] text-[#E74856] font-bold uppercase tracking-widest">
                Помилка завантаження даних
            </div>
        );
    }

    if (isLoading || !allProductsData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0F1220]">
                <div className="flex flex-col items-center gap-4">
                    <ChefHat size={48} className="text-[#FFB800] animate-bounce" />
                    <span className="text-white/40 font-bold uppercase tracking-widest animate-pulse">
                        Завантаження...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout fullHeight={true}>
            <div className="h-full p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white uppercase tracking-wider">
                        📋 Формування замовлення
                    </h1>
                    <div className="text-xs text-white/40 font-mono">
                        {new Date().toLocaleDateString()}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <ProductionOpsTable data={productQueue} onRefresh={handleRefresh} />
                </div>
            </div>
        </DashboardLayout>
    );
}
