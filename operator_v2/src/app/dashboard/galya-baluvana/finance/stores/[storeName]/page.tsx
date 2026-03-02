'use client';

import React from 'react';
import { GalyaStoreDetail } from '@/components/galya-baluvana/GalyaStoreDetail';
import { useParams } from 'next/navigation';

export default function GalyaStoreDetailPage() {
    const params = useParams();
    const storeName = params.storeName ? decodeURIComponent(params.storeName as string) : '';

    return <GalyaStoreDetail storeName={storeName} />;
}
