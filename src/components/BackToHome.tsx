'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export const BackToHome = () => {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/40 hover:text-[#00D4FF] transition-colors group mb-1 pl-1 w-fit"
        >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[11px] font-medium uppercase tracking-widest">До головного меню</span>
        </button>
    );
};
