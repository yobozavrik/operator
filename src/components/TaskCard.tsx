'use client';

import React, { useState, useEffect } from 'react';
import { ProductionTask } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Play, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface TaskCardProps {
    task: ProductionTask;
    onStatusChange: (id: string, newStatus: ProductionTask['status']) => void;
}

export const TaskCard = ({ task, onStatusChange }: TaskCardProps) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (task.status === 'in-progress' && task.timeStarted) {
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - task.timeStarted!) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [task.status, task.timeStarted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getPriorityStyles = () => {
        if (task.priority === 'critical') return "border-l-status-high text-status-high bg-status-high/5";
        if (task.priority === 'high') return "border-l-status-medium text-status-medium bg-status-medium/5";
        return "border-l-status-low text-status-low bg-status-low/5";
    };

    return (
        <div className={cn(
            "glass-card p-6 rounded-3xl border-l-[12px] transition-all duration-300 transform",
            getPriorityStyles(),
            task.status === 'in-progress' && "ring-2 ring-brand-primary scale-[1.02] shadow-2xl shadow-brand-primary/20",
            task.status === 'completed' && "opacity-50 grayscale scale-95"
        )}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10">
                            {task.category}
                        </span>
                        {task.priority === 'critical' && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-status-high animate-pulse">
                                🔥 КРИТИЧЕСКИЙ ПРИОРИТЕТ
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-black text-white">{task.name}</h2>
                    <p className="text-slate-400 font-bold text-sm opacity-80">{task.priorityReason}</p>
                </div>

                <div className="text-right">
                    <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">ПЛАН В КГ</div>
                    <div className="text-5xl font-black text-brand-primary tracking-tight">
                        {task.recommendedQtyKg} <span className="text-xl">кг</span>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                {task.status === 'pending' && (
                    <button
                        onClick={() => onStatusChange(task.id, 'in-progress')}
                        className="w-full py-6 rounded-2xl premium-gradient text-white text-xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/20"
                    >
                        <Play fill="currentColor" />
                        Взять в работу
                    </button>
                )}

                {task.status === 'in-progress' && (
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-status-medium/10 border border-status-medium/30 rounded-2xl flex items-center justify-center gap-4 py-6">
                            <Clock className="text-status-medium" size={32} />
                            <div className="text-3xl font-black text-status-medium tabular-nums">
                                В ПРОЦЕССЕ ({formatTime(elapsed)})
                            </div>
                        </div>
                        <button
                            onClick={() => onStatusChange(task.id, 'completed')}
                            className="px-12 py-6 rounded-2xl bg-status-low text-white text-xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-status-low/90 transition-all shadow-xl shadow-status-low/20"
                        >
                            <CheckCircle size={28} />
                            Завершить
                        </button>
                    </div>
                )}

                {task.status === 'completed' && (
                    <div className="w-full py-6 rounded-2xl bg-slate-800 text-slate-400 text-xl font-black uppercase tracking-tighter flex items-center justify-center gap-3">
                        <CheckCircle size={28} />
                        Партия завершена
                    </div>
                )}
            </div>
        </div>
    );
};
