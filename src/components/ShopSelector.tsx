import React from 'react';
import { GRAVITON_SHOPS } from '@/lib/transformers';
import { Check } from 'lucide-react';

interface Props {
    selectedShops: number[];
    setSelectedShops: (ids: number[]) => void;
}

export const ShopSelector = ({ selectedShops, setSelectedShops }: Props) => {
    const toggleShop = (shopId: number) => {
        if (selectedShops.includes(shopId)) {
            setSelectedShops(selectedShops.filter(id => id !== shopId));
        } else {
            setSelectedShops([...selectedShops, shopId]);
        }
    };

    const toggleAll = () => {
        if (selectedShops.length === GRAVITON_SHOPS.length) {
            setSelectedShops([]);
        } else {
            setSelectedShops(GRAVITON_SHOPS.map(s => s.id));
        }
    };

    return (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Виберіть магазини:</h3>
                <button
                    onClick={toggleAll}
                    className="text-xs text-[#00D4FF] hover:text-[#00D4FF]/80 font-bold uppercase tracking-wider"
                >
                    {selectedShops.length === GRAVITON_SHOPS.length ? 'Зняти всі' : 'Вибрати всі'}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {GRAVITON_SHOPS.map(shop => {
                    const isSelected = selectedShops.includes(shop.id);
                    return (
                        <label
                            key={shop.id}
                            className={`
                                relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border
                                ${isSelected
                                    ? 'bg-[#00D4FF]/10 border-[#00D4FF]/50 shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                                    : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                                }
                            `}
                        >
                            <div className={`
                                w-5 h-5 rounded flex items-center justify-center border transition-colors
                                ${isSelected
                                    ? 'bg-[#00D4FF] border-[#00D4FF] text-black'
                                    : 'bg-black/40 border-white/20'
                                }
                            `}>
                                {isSelected && <Check size={14} strokeWidth={4} />}
                            </div>

                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleShop(shop.id)}
                                className="hidden"
                            />
                            <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-white/60'}`}>
                                {shop.name}
                            </span>
                        </label>
                    );
                })}
            </div>
            <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-2">
                <div className="text-xs text-white/40 font-mono">
                    Вибрано: <span className="text-white font-bold">{selectedShops.length}</span> з {GRAVITON_SHOPS.length}
                </div>
            </div>
        </div>
    );
};
