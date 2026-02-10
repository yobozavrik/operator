'use client';

import React, { useState } from 'react';
import { ProductionTask } from '@/types/bi';
import { Calculator, Truck, CheckCircle2, AlertCircle, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton } from '@/components/ui/Modal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    products: ProductionTask[];
}

interface DistributionResult {
    storeId: number;
    productId: number;
    quantity: number;
    originalQuantity?: number;
}

type Step = 'input' | 'review' | 'success';

export const DistributionModal = ({ isOpen, onClose, products }: Props) => {
    const [step, setStep] = useState<Step>('input');
    const [inputs, setInputs] = useState<Record<number, string>>({}); // productId -> quantity (string for input)
    const [results, setResults] = useState<DistributionResult[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter unique products (just in case duplicates exist in queue)
    const uniqueProducts = Array.from(new Set(products.map(p => p.productCode)))
        .map(code => products.find(p => p.productCode === code)!);

    const handleInputChange = (productId: number, val: string) => {
        setInputs(prev => ({ ...prev, [productId]: val }));
    };

    const handleCalculate = async () => {
        setIsCalculating(true);
        setError(null);
        setResults([]);

        const distributions: DistributionResult[] = [];

        try {
            // Process products with entered quantity > 0
            const itemsToProcess = uniqueProducts.filter(p => {
                const qty = parseInt(inputs[p.productCode] || '0');
                return qty > 0;
            });

            if (itemsToProcess.length === 0) {
                setError('Введіть кількість хоча б для однієї піци');
                setIsCalculating(false);
                return;
            }

            // Call API for each product (could be parallelized)
            for (const p of itemsToProcess) {
                const qty = parseInt(inputs[p.productCode] || '0');

                const response = await fetch('/api/pizza/calculate-distribution', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: p.productCode, productionQuantity: qty })
                });

                if (!response.ok) throw new Error('Calculation failed');

                const data = await response.json();

                // data.distributed is { storeId: quantity }
                Object.entries(data.distributed).forEach(([storeId, amount]) => {
                    const quantity = amount as number;
                    if (quantity > 0) {
                        distributions.push({
                            storeId: parseInt(storeId),
                            productId: p.productCode,
                            quantity,
                            originalQuantity: quantity
                        });
                    }
                });
            }

            setResults(distributions);
            setStep('review');
        } catch (err) {
            setError('Помилка розрахунку. Спробуйте ще раз.');
            console.error(err);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/pizza/confirm-distribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    distributions: results.map(r => ({
                        storeId: r.storeId,
                        productId: r.productId,
                        quantity: r.quantity
                    }))
                })
            });

            if (!response.ok) throw new Error('Failed to confirm');

            setStep('success');
            setTimeout(() => {
                onClose();
                setStep('input');
                setInputs({});
                setResults([]);
            }, 2000);
        } catch (err) {
            setError('Помилка збереження. Перевірте зʼєднання.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to get store name from product data
    const getStoreName = (storeId: number) => {
        for (const p of products) {
            const s = p.stores.find(s => s.storeId === storeId);
            if (s) return s.storeName;
        }
        return `Магазин #${storeId}`;
    };

    // Group results by Store for review
    const resultsByStore = results.reduce((acc, curr) => {
        if (!acc[curr.storeId]) acc[curr.storeId] = [];
        acc[curr.storeId].push(curr);
        return acc;
    }, {} as Record<number, DistributionResult[]>);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" zIndex={150}>
            {/* Header */}
            <ModalHeader icon={<Truck size={22} />}>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                    Розподіл Продукції
                </h2>
                <p className="text-xs text-white/40 mt-1">
                    Автоматичний алгоритм (4 етапи)
                </p>
            </ModalHeader>

            {/* Content */}
            <ModalBody className="bg-[#0A0E14]">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl flex items-center gap-3 text-[#EF4444]">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Step: Input */}
                {step === 'input' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uniqueProducts.map(product => (
                            <div
                                key={product.productCode}
                                className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                            >
                                <h3 className="font-bold text-white/90 truncate group-hover:text-white transition-colors" title={product.name}>
                                    {product.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="bg-black/30 border border-white/10 rounded-lg h-12 px-3 w-full text-center text-xl font-bold text-[#00D4FF] focus:border-[#00D4FF] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/20 transition-all"
                                        value={inputs[product.productCode] || ''}
                                        onChange={(e) => handleInputChange(product.productCode, e.target.value)}
                                    />
                                    <span className="text-white/30 text-sm font-bold min-w-[30px]">шт</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step: Review */}
                {step === 'review' && (
                    <div className="space-y-4">
                        {Object.entries(resultsByStore).map(([storeIdStr, items]) => {
                            const storeId = parseInt(storeIdStr);
                            return (
                                <div key={storeId} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                                        <span className="font-bold text-white flex items-center gap-2">
                                            🏪 {getStoreName(storeId)}
                                        </span>
                                        <span className="text-xs bg-white/5 px-2 py-1 rounded text-white/40 font-mono">
                                            ID: {storeId}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-white/[0.03]">
                                        {items.map((item, idx) => {
                                            const product = uniqueProducts.find(p => p.productCode === item.productId);
                                            return (
                                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                                    <span className="text-sm text-white/80">{product?.name || `Product ${item.productId}`}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white font-bold text-lg transition-all"
                                                            onClick={() => {
                                                                const newResults = [...results];
                                                                const index = newResults.indexOf(item);
                                                                if (index > -1) {
                                                                    newResults[index].quantity = Math.max(0, item.quantity - 1);
                                                                    setResults(newResults);
                                                                }
                                                            }}
                                                        >
                                                            −
                                                        </button>
                                                        <div className="w-14 text-center font-mono font-bold text-[#F59E0B] text-lg">
                                                            {item.quantity}
                                                        </div>
                                                        <button
                                                            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white font-bold text-lg transition-all"
                                                            onClick={() => {
                                                                const newResults = [...results];
                                                                const index = newResults.indexOf(item);
                                                                if (index > -1) {
                                                                    newResults[index].quantity = item.quantity + 1;
                                                                    setResults(newResults);
                                                                }
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(resultsByStore).length === 0 && (
                            <div className="text-center py-16 text-white/30">
                                <Truck size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm">Нічого не розподілено</p>
                                <p className="text-xs mt-2 opacity-60">Можливо, немає дефіциту або введено нулі</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step: Success */}
                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-[#10B981]/20 rounded-full flex items-center justify-center text-[#10B981] mb-6 animate-bounce">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Успішно!</h3>
                        <p className="text-white/50">Документи переміщення створено.</p>
                    </div>
                )}
            </ModalBody>

            {/* Footer */}
            <ModalFooter>
                <div className="flex justify-between items-center">
                    {step === 'input' && (
                        <>
                            <p className="text-xs text-white/30 max-w-[50%]">
                                Введіть кількість виготовленої продукції. Алгоритм автоматично розподілить її між магазинами.
                            </p>
                            <ModalButton
                                variant="primary"
                                onClick={handleCalculate}
                                loading={isCalculating}
                                icon={<Calculator size={18} />}
                            >
                                Розрахувати
                            </ModalButton>
                        </>
                    )}

                    {step === 'review' && (
                        <>
                            <ModalButton
                                variant="ghost"
                                onClick={() => setStep('input')}
                                icon={<ArrowLeft size={16} />}
                            >
                                Назад
                            </ModalButton>
                            <ModalButton
                                variant="primary"
                                onClick={handleConfirm}
                                loading={isSubmitting}
                                icon={<Save size={18} />}
                            >
                                Підтвердити
                            </ModalButton>
                        </>
                    )}
                </div>
            </ModalFooter>
        </Modal>
    );
};
