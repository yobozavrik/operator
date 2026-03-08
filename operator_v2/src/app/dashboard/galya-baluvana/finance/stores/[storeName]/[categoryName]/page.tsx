'use client';

import React from 'react';
import { GalyaStoreCategoryDetail } from '@/components/galya-baluvana/GalyaStoreCategoryDetail';
import { useParams } from 'next/navigation';

export default function GalyaStoreCategoryDetailPage() {
    const params = useParams();
    const storeName = params.storeName ? decodeURIComponent(params.storeName as string) : '';
    const categoryName = params.categoryName ? decodeURIComponent(params.categoryName as string) : '';

    return <GalyaStoreCategoryDetail storeName={storeName} categoryName={categoryName} />;
}
