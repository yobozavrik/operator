import React, { useState } from 'react';
import { ProductionTask } from '@/types/bi';
import { X, Calculator, Truck, CheckCircle2, AlertCircle, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UI_TOKENS } from '@/lib/design-tokens';

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

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>

            <div className="w-full max-w-4xl bg-[#141829] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1f3a]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF]">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Розподіл Продукції</h2>
                            <p className="text-xs text-white/50">Автоматичний алгоритм (4 етапи)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-3 text-red-400">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 'input' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uniqueProducts.map(product => (
                                <div key={product.productCode} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:bg-white/10 transition-colors">
                                    <h3 className="font-bold text-white truncate" title={product.name}>{product.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="bg-white/5 border border-white/20 rounded-lg h-10 px-3 w-full text-center text-xl font-bold text-[#00D4FF] focus:border-[#00D4FF] focus:outline-none"
                                            value={inputs[product.productCode] || ''}
                                            onChange={(e) => handleInputChange(product.productCode, e.target.value)}
                                        />
                                        <span className="text-white/40 text-sm font-bold">шт</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="space-y-6">
                            {Object.entries(resultsByStore).map(([storeIdStr, items]) => {
                                const storeId = parseInt(storeIdStr);
                                return (
                                    <div key={storeId} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                            <span className="font-bold text-white flex items-center gap-2">
                                                🏪 {getStoreName(storeId)}
                                            </span>
                                            <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">ID: {storeId}</span>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {items.map((item, idx) => {
                                                const product = uniqueProducts.find(p => p.productCode === item.productId);
                                                return (
                                                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-white/5">
                                                        <span className="text-sm text-white/80">{product?.name || `Product ${item.productId}`}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
                                                                onClick={() => {
                                                                    const newResults = [...results];
                                                                    const index = newResults.indexOf(item);
                                                                    if (index > -1) {
                                                                        newResults[index].quantity = Math.max(0, item.quantity - 1);
                                                                        setResults(newResults);
                                                                    }
                                                                }}
                                                            >
                                                                -
                                                            </button>
                                                            <div className="w-12 text-center font-mono font-bold text-[#FFB800] text-lg">
                                                                {item.quantity}
                                                            </div>
                                                            <button
                                                                className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
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
                                <div className="text-center py-12 text-white/40">
                                    Нічого не розподілено. Можливо, немає дефіциту або введено нулі.
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 animate-bounce">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Успішно!</h3>
                            <p className="text-white/60">Документи переміщення створено.</p>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-white/10 bg-[#1a1f3a] flex justify-between">
                    {step === 'input' && (
                        <>
                            <div className="text-xs text-white/40 max-w-[50%]">
                                Введіть кількість виготовленої продукції. Алгоритм автоматично розподілить її між магазинами.
                            </div>
                            <button
                                onClick={handleCalculate}
                                disabled={isCalculating}
                                className="flex items-center gap-2 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                                {isCalculating ? <RefreshCw className="animate-spin" /> : <Calculator size={20} />}
                                Розрахувати
                            </button>
                        </>
                    )}

                    {step === 'review' && (
                        <>
                            <button
                                onClick={() => setStep('input')}
                                className="flex items-center gap-2 text-white/60 hover:text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={18} />
                                Назад
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 bg-[#00D4FF] hover:bg-[#00D4FF]/80 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                                Підтвердити
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
