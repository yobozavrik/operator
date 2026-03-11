import React from 'react';
import { Check } from 'lucide-react';

interface Shop {
    spot_id: number;
    spot_name: string;
}

interface Props {
    shops: Shop[];
    selectedShops: number[];
    setSelectedShops: (ids: number[]) => void;
}

export const ShopSelector = ({ shops, selectedShops, setSelectedShops }: Props) => {
    const toggleShop = (spotId: number) => {
        if (selectedShops.includes(spotId)) {
            setSelectedShops(selectedShops.filter(id => id !== spotId));
        } else {
            setSelectedShops([...selectedShops, spotId]);
        }
    };

    const toggleAll = () => {
        if (selectedShops.length === shops.length) {
            setSelectedShops([]);
        } else {
            setSelectedShops(shops.map(s => s.spot_id));
        }
    };

    return (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Виберіть магазини:</h3>
                <button
                    onClick={toggleAll}
                    disabled={shops.length === 0}
                    className="text-xs text-[#00D4FF] hover:text-[#00D4FF]/80 font-bold uppercase tracking-wider disabled:opacity-50"
                >
                    {selectedShops.length === shops.length && shops.length > 0 ? 'Зняти всі' : 'Вибрати всі'}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {shops.map(shop => {
                    const isSelected = selectedShops.includes(shop.spot_id);
                    return (
                        <label
                            key={shop.spot_id}
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
                                onChange={() => toggleShop(shop.spot_id)}
                                className="hidden"
                            />
                            <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-white/60'}`} title={shop.spot_name}>
                                {shop.spot_name}
                            </span>
                        </label>
                    );
                })}
            </div>
            <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-2">
                <div className="text-xs text-white/40 font-mono">
                    Вибрано: <span className="text-white font-bold">{selectedShops.length}</span> з {shops.length}
                </div>
            </div>
        </div>
    );
};
