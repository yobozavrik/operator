'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type StoreContextType = {
    selectedStore: string;
    setSelectedStore: (store: string) => void;
    currentCapacity: number;
    setCurrentCapacity: (capacity: number) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
    const [selectedStore, setSelectedStore] = useState<string>('Усі');
    const [currentCapacity, setCurrentCapacity] = useState<number>(495); // Default: 9 ppl * 55kg

    return (
        <StoreContext.Provider value={{
            selectedStore,
            setSelectedStore,
            currentCapacity,
            setCurrentCapacity
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
