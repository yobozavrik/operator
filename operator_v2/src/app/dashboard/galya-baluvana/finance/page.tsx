'use client';

import React, { Suspense } from 'react';
import { GalyaFinanceMetrics } from '@/components/galya-baluvana/GalyaFinanceMetrics';

export default function GalyaFinanceOverviewPage() {
    // Currently, GalyaFinanceMetrics shows the category breakdown.
    // We will render it as the "Overview" default view until we create a dedicated Summary view.
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Завантаження...</div>}>
            <GalyaFinanceMetrics />
        </Suspense>
    );
}
