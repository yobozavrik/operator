'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import { TaskCard } from '@/components/TaskCard';
import { mockSKUs, getProductionQueue, ProductionTask } from '@/lib/data';

export default function ProductionPage() {
    const MAX_WEIGHT = 450;

    const initialQueue = useMemo(() => getProductionQueue(mockSKUs).filter(t => t.recommendedQtyKg > 0), []);
    const [tasks, setTasks] = useState<ProductionTask[]>(initialQueue);

    const handleStatusChange = (id: string, newStatus: ProductionTask['status']) => {
        setTasks(prev => prev.map(task => {
            if (task.id === id) {
                return {
                    ...task,
                    status: newStatus,
                    timeStarted: newStatus === 'in-progress' ? Date.now() : task.timeStarted
                };
            }
            return task;
        }));
    };

    const currentWeight = useMemo(() => {
        return Number(tasks
            .filter(t => t.status === 'completed')
            .reduce((acc: number, item: ProductionTask) => acc + item.recommendedQtyKg, 292)
            .toFixed(0));
    }, [tasks]);

    return (
        <DashboardLayout currentWeight={currentWeight} maxWeight={MAX_WEIGHT}>
            <div className="p-4 lg:p-10 max-w-5xl mx-auto w-full pb-24">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter mb-2 uppercase flex items-center gap-3">
                            <span className="text-[#58A6FF]">|</span> Завдання на зміну
                        </h1>
                        <p className="text-slate-500 text-sm lg:text-lg font-bold uppercase tracking-widest">
                            Пріоритет на основі AI-аналізу залишків
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>

                {tasks.length === 0 && (
                    <div className="bi-panel p-20 rounded-3xl text-center border-2 border-dashed border-white/5">
                        <p className="text-slate-500 text-2xl font-black uppercase opacity-50 tracking-widest">Завдань немає</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
