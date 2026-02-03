'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users, Crown, User, Snowflake } from 'lucide-react';
import { SHIFTS, PRODUCTION_NORM_PER_PERSON, getShiftCapacity, getCurrentShift, Shift, Employee } from '@/lib/personnel';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
}

const getPositionIcon = (position: Employee['position']) => {
    switch (position) {
        case 'Старший смени':
            return <Crown size={12} className="text-[#FFD700]" />;
        case 'Шокер':
            return <Snowflake size={12} className="text-[#00BCF2]" />;
        default:
            return <User size={12} className="text-gray-400" />;
    }
};

export const PersonnelCard = ({ className }: Props) => {
    const [expandedShift, setExpandedShift] = useState<number | null>(null);

    const currentShift = useMemo(() => getCurrentShift(), []);

    const toggleShift = (shiftId: number) => {
        setExpandedShift(prev => prev === shiftId ? null : shiftId);
    };

    return (
        <div
            className={cn("rounded-xl overflow-hidden", className)}
            style={{
                background: 'rgba(20, 27, 45, 0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 212, 255, 0.05)',
            }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #00D4FF 0%, #0088FF 100%)',
                            boxShadow: '0 0 12px rgba(0, 212, 255, 0.4)',
                        }}
                    >
                        <Users size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-[12px] font-bold text-white uppercase tracking-wide">Персонал</h3>
                        <p className="text-[9px] text-[#00D4FF]">Норма: {PRODUCTION_NORM_PER_PERSON} кг/особа</p>
                    </div>
                </div>
            </div>

            {/* Shifts */}
            <div className="p-2">
                {SHIFTS.map((shift) => {
                    const isExpanded = expandedShift === shift.id;
                    const isCurrent = currentShift?.id === shift.id;
                    const capacity = getShiftCapacity(shift);

                    return (
                        <div key={shift.id} className="mb-2 last:mb-0">
                            {/* Shift Header */}
                            <button
                                onClick={() => toggleShift(shift.id)}
                                className={cn(
                                    "w-full px-3 py-2.5 rounded-lg flex items-center justify-between transition-all duration-300",
                                    isCurrent && "ring-1 ring-[#00D4FF]/50"
                                )}
                                style={{
                                    background: isCurrent
                                        ? 'rgba(0, 212, 255, 0.15)'
                                        : 'rgba(255, 255, 255, 0.03)',
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ?
                                        <ChevronDown size={14} className="text-gray-400" /> :
                                        <ChevronRight size={14} className="text-gray-400" />
                                    }
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-white">
                                                {shift.name}
                                            </span>
                                            {isCurrent && (
                                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#00D4FF]/20 text-[#00D4FF] uppercase">
                                                    Зараз
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-gray-400">
                                            Старша: {shift.leader}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-[12px] font-bold text-[#00D4FF]">
                                        {shift.employees.length} осіб
                                    </div>
                                    <div className="text-[9px] text-gray-400">
                                        ~{capacity} кг
                                    </div>
                                </div>
                            </button>

                            {/* Employees List */}
                            {isExpanded && (
                                <div className="mt-1 ml-4 space-y-0.5">
                                    {shift.employees.map((employee) => (
                                        <div
                                            key={employee.id}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md flex items-center justify-between",
                                                employee.isLeader && "bg-[#FFD700]/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                {getPositionIcon(employee.position)}
                                                <span className={cn(
                                                    "text-[10px]",
                                                    employee.isLeader ? "font-bold text-[#FFD700]" : "text-gray-300"
                                                )}>
                                                    {employee.name}
                                                </span>
                                            </div>
                                            <span className="text-[9px] text-gray-500">
                                                {employee.position}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer - Total capacity */}
            <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 uppercase">Загальна потужність:</span>
                    <span className="text-[11px] font-bold text-[#52E8FF]">
                        {SHIFTS.reduce((sum, s) => sum + getShiftCapacity(s), 0)} кг/день
                    </span>
                </div>
            </div>
        </div>
    );
};
