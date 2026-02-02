'use client';

import React, { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import { MatrixTable } from '@/components/MatrixTable';
import { mockSKUs, getProductionQueue, ProductionTask } from '@/lib/data';

export default function AnalyticsPage() {
    const MAX_WEIGHT = 450;
    const queue = useMemo(() => getProductionQueue(mockSKUs), []);
    const currentWeight = useMemo(() => {
        return Number(queue.reduce((acc, item) => acc + item.recommendedQtyKg, 292).toFixed(0));
    }, [queue]);

    return (
        <DashboardLayout currentWeight={currentWeight} maxWeight={MAX_WEIGHT}>
            <div className="p-4 lg:p-8">
                <div className="mb-8 p-6 bi-panel rounded-2xl border border-white/5 bg-gradient-to-br from-[#161B22] to-transparent">
                    <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tighter mb-2 uppercase flex items-center gap-3">
                        <span className="text-[#58A6FF]">|</span> Аналітична Матриця: SKU по Мережі
                    </h1>
                    <p className="text-slate-400 text-sm max-w-2xl font-medium leading-relaxed">
                        Детальна візуалізація наявності продукції у розрізі 6 основних магазинів.
                        Неонові маркеры сигналізують про потребу поповнення залишків у кг.
                    </p>
                </div>

                <div className="bi-panel rounded-2xl overflow-hidden border border-white/5">
                    <MatrixTable skus={mockSKUs} />
                </div>
            </div>
        </DashboardLayout>
    );
}
