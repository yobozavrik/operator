'use client';

import React, { Suspense } from 'react';
// The GalyaFinanceMetrics component currently aggregates exactly by Category
import { GalyaFinanceMetrics } from '@/components/galya-baluvana/GalyaFinanceMetrics';

export default function GalyaFinanceCategoriesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Завантаження...</div>}>
            <GalyaFinanceMetrics />
        </Suspense>
    );
}
