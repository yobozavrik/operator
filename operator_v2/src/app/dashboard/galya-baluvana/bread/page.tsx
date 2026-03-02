'use client';

import React from 'react';
import { CraftBreadAnalytics } from '@/components/analytics/CraftBreadAnalytics';

export default function BreadDashboardPage() {
    return (
        <div className="flex-1 w-full h-full">
            <CraftBreadAnalytics />
        </div>
    );
}
