'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, Crown, User, Snowflake, Check, X, AlertCircle } from 'lucide-react';
import { SHIFTS, PRODUCTION_NORM_PER_PERSON, Shift, Employee } from '@/lib/personnel';
import { cn } from '@/lib/utils';
import { useStore } from '@/context/StoreContext';

// Attendance status types
type AttendanceStatus = 'present' | 'absent' | 'sick';

interface EmployeeAttendance {
    employeeId: number;
    status: AttendanceStatus;
}

interface ShiftAttendance {
    shiftId: number;
    employees: EmployeeAttendance[];
}

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

const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
        case 'present':
            return { bg: 'rgba(52, 211, 153, 0.2)', border: '#34D399', text: '#34D399' };
        case 'absent':
            return { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', text: '#EF4444' };
        case 'sick':
            return { bg: 'rgba(251, 191, 36, 0.2)', border: '#FBBF24', text: '#FBBF24' };
    }
};

const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
        case 'present':
            return <Check size={12} className="text-[#34D399]" />;
        case 'absent':
            return <X size={12} className="text-[#EF4444]" />;
        case 'sick':
            return <AlertCircle size={12} className="text-[#FBBF24]" />;
    }
};

const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
        case 'present':
            return 'На місці';
        case 'absent':
            return 'Відсутній';
        case 'sick':
            return 'Хворий';
    }
};

export const PersonnelView = () => {
    const { setCurrentCapacity } = useStore();

    // Active shift (1 or 2)
    const [activeShiftId, setActiveShiftId] = useState<1 | 2>(1);

    // Attendance tracking for each shift
    const [attendance, setAttendance] = useState<ShiftAttendance[]>(() => {
        // Initialize all employees as present
        return SHIFTS.map(shift => ({
            shiftId: shift.id,
            employees: shift.employees.map(emp => ({
                employeeId: emp.id,
                status: 'present' as AttendanceStatus
            }))
        }));
    });

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('personnel-attendance');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setAttendance(parsed.attendance);
                setActiveShiftId(parsed.activeShiftId || 1);
            } catch (e) {
                console.error('Failed to load attendance:', e);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('personnel-attendance', JSON.stringify({
            attendance,
            activeShiftId,
            updatedAt: new Date().toISOString()
        }));
    }, [attendance, activeShiftId]);

    // Get current shift attendance
    const currentShiftAttendance = useMemo(() => {
        return attendance.find(a => a.shiftId === activeShiftId);
    }, [attendance, activeShiftId]);

    // Get active shift data
    const activeShift = useMemo(() => {
        return SHIFTS.find(s => s.id === activeShiftId)!;
    }, [activeShiftId]);

    // Calculate capacity based on present employees
    const { presentCount, totalCapacity, presentEmployees } = useMemo(() => {
        if (!currentShiftAttendance) return { presentCount: 0, totalCapacity: 0, presentEmployees: [] };

        const present = currentShiftAttendance.employees.filter(e => e.status === 'present');
        return {
            presentCount: present.length,
            totalCapacity: present.length * PRODUCTION_NORM_PER_PERSON,
            presentEmployees: present.map(e => e.employeeId)
        };
    }, [currentShiftAttendance]);

    // Sync total capacity to global context whenever it changes
    useEffect(() => {
        setCurrentCapacity(totalCapacity);
    }, [totalCapacity, setCurrentCapacity]);

    // Toggle employee status
    const cycleEmployeeStatus = (employeeId: number) => {
        setAttendance(prev => {
            return prev.map(shiftAtt => {
                if (shiftAtt.shiftId !== activeShiftId) return shiftAtt;

                return {
                    ...shiftAtt,
                    employees: shiftAtt.employees.map(emp => {
                        if (emp.employeeId !== employeeId) return emp;

                        // Cycle: present -> absent -> sick -> present
                        const nextStatus: AttendanceStatus =
                            emp.status === 'present' ? 'absent' :
                                emp.status === 'absent' ? 'sick' : 'present';

                        return { ...emp, status: nextStatus };
                    })
                };
            });
        });
    };

    // Set all employees to a status
    const setAllStatus = (status: AttendanceStatus) => {
        setAttendance(prev => {
            return prev.map(shiftAtt => {
                if (shiftAtt.shiftId !== activeShiftId) return shiftAtt;

                return {
                    ...shiftAtt,
                    employees: shiftAtt.employees.map(emp => ({
                        ...emp,
                        status
                    }))
                };
            });
        });
    };

    // Get employee attendance status
    const getEmployeeStatus = (employeeId: number): AttendanceStatus => {
        const emp = currentShiftAttendance?.employees.find(e => e.employeeId === employeeId);
        return emp?.status || 'present';
    };

    return (
        <div className="flex flex-col h-full bg-[#0D1117] rounded-xl border border-[#3A3A3A] overflow-hidden font-sans">
            {/* Header with shift selector */}
            <div className="px-6 py-4 border-b border-[#3A3A3A] bg-[#111823]">
                <div className="flex items-center justify-between mb-4">
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
                                Управління Персоналом
                            </h3>
                            <p className="text-[10px] text-[#8B949E]">
                                Оберіть зміну та позначте присутність
                            </p>
                        </div>
                    </div>

                    {/* Capacity indicator */}
                    <div className="text-right">
                        <div className="text-[10px] text-[#8B949E] uppercase font-bold tracking-widest">
                            Потужність зміни
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#52E8FF]">
                                {totalCapacity}
                            </span>
                            <span className="text-[11px] text-[#8B949E] font-bold">кг</span>
                        </div>
                        <div className="text-[9px] text-[#8B949E]">
                            {presentCount} з {activeShift.employees.length} осіб
                        </div>
                    </div>
                </div>

                {/* Shift tabs */}
                <div className="flex gap-2">
                    {SHIFTS.map(shift => {
                        const isActive = shift.id === activeShiftId;
                        const shiftAttendance = attendance.find(a => a.shiftId === shift.id);
                        const shiftPresent = shiftAttendance?.employees.filter(e => e.status === 'present').length || 0;

                        return (
                            <button
                                key={shift.id}
                                onClick={() => setActiveShiftId(shift.id as 1 | 2)}
                                className={cn(
                                    "flex-1 px-4 py-3 rounded-lg transition-all duration-300 text-left",
                                    isActive && "ring-2 ring-[#00D4FF]"
                                )}
                                style={{
                                    background: isActive
                                        ? 'rgba(0, 212, 255, 0.15)'
                                        : 'rgba(255, 255, 255, 0.03)',
                                    border: isActive
                                        ? '1px solid rgba(0, 212, 255, 0.5)'
                                        : '1px solid rgba(255, 255, 255, 0.08)',
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className={cn(
                                            "text-[12px] font-bold uppercase",
                                            isActive ? "text-[#00D4FF]" : "text-gray-400"
                                        )}>
                                            {shift.name}
                                        </div>
                                        <div className="text-[9px] text-gray-500">
                                            Старша: {shift.leader.split(' ')[0]}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn(
                                            "text-[14px] font-bold",
                                            isActive ? "text-[#52E8FF]" : "text-gray-500"
                                        )}>
                                            {shiftPresent}/{shift.employees.length}
                                        </div>
                                        <div className="text-[8px] text-gray-500">осіб</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quick actions */}
            <div className="px-6 py-3 border-b border-[#3A3A3A]/50 bg-[#161B22] flex items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold mr-2">Швидко:</span>
                <button
                    onClick={() => setAllStatus('present')}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
                    style={{
                        background: 'rgba(52, 211, 153, 0.15)',
                        color: '#34D399',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                    }}
                >
                    ✓ Всі на місці
                </button>
                <button
                    onClick={() => setAllStatus('absent')}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
                    style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                >
                    ✗ Очистити
                </button>
            </div>

            {/* Employees list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeShift.employees.map((employee) => {
                    const status = getEmployeeStatus(employee.id);
                    const statusColors = getStatusColor(status);

                    return (
                        <div
                            key={employee.id}
                            onClick={() => cycleEmployeeStatus(employee.id)}
                            className="px-6 py-3 border-b border-[#3A3A3A]/20 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Status indicator (clickable) */}
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                        style={{
                                            background: statusColors.bg,
                                            border: `1px solid ${statusColors.border}`,
                                        }}
                                    >
                                        {getStatusIcon(status)}
                                    </div>

                                    {/* Employee info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {getPositionIcon(employee.position)}
                                            <span className={cn(
                                                "text-[12px] font-semibold transition-all",
                                                status === 'present' ? "text-[#E6EDF3]" : "text-gray-500 line-through"
                                            )}>
                                                {employee.name}
                                            </span>
                                            {employee.isLeader && (
                                                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-[#FFD700]/20 text-[#FFD700] uppercase">
                                                    Старша
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[9px] text-[#8B949E] mt-0.5">
                                            {employee.position}
                                        </div>
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div
                                    className="px-2 py-1 rounded-full text-[8px] font-bold uppercase"
                                    style={{
                                        background: statusColors.bg,
                                        color: statusColors.text,
                                        border: `1px solid ${statusColors.border}`,
                                    }}
                                >
                                    {getStatusLabel(status)}
                                </div>

                                {/* Capacity contribution */}
                                <div className="text-right ml-4 min-w-[60px]">
                                    {status === 'present' ? (
                                        <>
                                            <div className="text-[12px] font-bold text-[#52E8FF]">
                                                +{PRODUCTION_NORM_PER_PERSON} кг
                                            </div>
                                            <div className="text-[8px] text-[#8B949E]">потужність</div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] text-gray-600">—</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer with totals */}
            <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#111823]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] text-[#8B949E]">
                            <span className="text-[#34D399] font-bold">{presentCount}</span> на місці
                        </div>
                        <div className="text-[10px] text-[#8B949E]">
                            <span className="text-[#EF4444] font-bold">
                                {currentShiftAttendance?.employees.filter(e => e.status === 'absent').length || 0}
                            </span> відсутні
                        </div>
                        <div className="text-[10px] text-[#8B949E]">
                            <span className="text-[#FBBF24] font-bold">
                                {currentShiftAttendance?.employees.filter(e => e.status === 'sick').length || 0}
                            </span> хворі
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Макс. виробітку:</span>
                        <span className="text-[16px] font-black text-[#52E8FF]">{totalCapacity} кг</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
