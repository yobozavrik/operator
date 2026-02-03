'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users, Crown, User, Snowflake, Package } from 'lucide-react';
import { SHIFTS, PRODUCTION_NORM_PER_PERSON, getShiftCapacity, getCurrentShift, Shift, Employee } from '@/lib/personnel';
import { cn } from '@/lib/utils';

const getPositionIcon = (position: Employee['position']) => {
    switch (position) {
        case 'Старший смени':
            return <Crown size={14} className="text-[#FFD700]" />;
        case 'Шокер':
            return <Snowflake size={14} className="text-[#00BCF2]" />;
        default:
            return <User size={14} className="text-gray-400" />;
    }
};

const getPositionColor = (position: Employee['position']) => {
    switch (position) {
        case 'Старший смени':
            return '#FFD700';
        case 'Шокер':
            return '#00BCF2';
        default:
            return '#8B949E';
    }
};

export const PersonnelView = () => {
    const [expandedShifts, setExpandedShifts] = useState<Set<number>>(new Set([1, 2]));

    const currentShift = useMemo(() => getCurrentShift(), []);
    const totalCapacity = SHIFTS.reduce((sum, s) => sum + getShiftCapacity(s), 0);
    const totalEmployees = SHIFTS.reduce((sum, s) => sum + s.employees.length, 0);

    const toggleShift = (shiftId: number) => {
        setExpandedShifts(prev => {
            const next = new Set(prev);
            if (next.has(shiftId)) {
                next.delete(shiftId);
            } else {
                next.add(shiftId);
            }
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl border border-[#3A3A3A] overflow-hidden font-sans">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#3A3A3A] bg-[#111823]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #00D4FF 0%, #0088FF 100%)',
                                boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
                            }}
                        >
                            <Users size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-black uppercase tracking-tighter text-[#E6EDF3]">
                                Персонал виробництва
                            </h3>
                            <p className="text-[10px] text-[#8B949E]">
                                Норма: {PRODUCTION_NORM_PER_PERSON} кг/особа за зміну
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-widest leading-none mb-1">
                            Загальна потужність
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black leading-none text-[#58A6FF]">
                                {totalCapacity}
                            </span>
                            <span className="text-[10px] text-[#8B949E] font-bold">кг/день</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0D1117]">
                {SHIFTS.map((shift) => {
                    const isShiftExpanded = expandedShifts.has(shift.id);
                    const isCurrent = currentShift?.id === shift.id;
                    const capacity = getShiftCapacity(shift);

                    return (
                        <div key={shift.id} className="border-b border-[#3A3A3A]/50 last:border-0">
                            {/* Shift Header (like category) */}
                            <div
                                className="px-6 py-4 bg-[#161B22] hover:bg-[#1C2128] cursor-pointer flex items-center justify-between transition-colors"
                                onClick={() => toggleShift(shift.id)}
                                role="button"
                                aria-expanded={isShiftExpanded}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && toggleShift(shift.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {isShiftExpanded ?
                                        <ChevronDown size={16} className="text-[#8B949E]" /> :
                                        <ChevronRight size={16} className="text-[#8B949E]" />
                                    }
                                    <span className="text-[13px] font-bold text-[#E6EDF3]">
                                        {shift.name}
                                    </span>
                                    {isCurrent && (
                                        <span
                                            className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase animate-pulse"
                                            style={{
                                                background: 'rgba(0, 212, 255, 0.2)',
                                                color: '#00D4FF',
                                                border: '1px solid rgba(0, 212, 255, 0.3)',
                                            }}
                                        >
                                            Активна
                                        </span>
                                    )}
                                    <span className="text-[10px] text-[#8B949E]">
                                        ({shift.employees.length} осіб)
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[9px] text-[#8B949E] uppercase">Старша</div>
                                        <div className="text-[11px] font-semibold text-[#FFD700]">{shift.leader}</div>
                                    </div>
                                    <span className="text-[15px] font-black text-[#58A6FF]">
                                        ~{capacity} кг
                                    </span>
                                </div>
                            </div>

                            {/* Employees (like products) */}
                            {isShiftExpanded && (
                                <div className="bg-[#0D1117]">
                                    {shift.employees.map((employee) => (
                                        <div
                                            key={employee.id}
                                            className="px-6 py-3 border-b border-[#3A3A3A]/10 last:border-0 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                        style={{
                                                            background: employee.isLeader
                                                                ? 'rgba(255, 215, 0, 0.15)'
                                                                : employee.position === 'Шокер'
                                                                    ? 'rgba(0, 188, 242, 0.15)'
                                                                    : 'rgba(139, 148, 158, 0.1)',
                                                            border: `1px solid ${getPositionColor(employee.position)}30`,
                                                        }}
                                                    >
                                                        {getPositionIcon(employee.position)}
                                                    </div>
                                                    <div>
                                                        <span className={cn(
                                                            "text-[12px] font-semibold",
                                                            employee.isLeader ? "text-[#FFD700]" : "text-[#E6EDF3]"
                                                        )}>
                                                            {employee.name}
                                                        </span>
                                                        <div className="text-[9px] text-[#8B949E]">
                                                            {employee.position}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[11px] font-bold text-[#58A6FF]">
                                                        ~{PRODUCTION_NORM_PER_PERSON} кг
                                                    </div>
                                                    <div className="text-[8px] text-[#8B949E]">
                                                        за зміну
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#111823]">
                <div className="flex items-center justify-between">
                    <div className="text-[10px] text-[#8B949E]">
                        👥 Всього працівників: <span className="text-[#58A6FF] font-bold">{totalEmployees}</span>
                    </div>
                    <div className="text-[10px] text-[#8B949E]">
                        ⚡ Потужність: <span className="text-[#52E8FF] font-bold">{totalCapacity} кг/день</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
