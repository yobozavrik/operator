'use client';

import React from 'react';
import { Plus, Download, Upload, Filter, MoreVertical, Search, ChevronDown } from 'lucide-react';

export default function EmployeesPage() {
    return (
        <div className="flex flex-col h-full space-y-4">

            {/* Filters Toolbar */}
            <div className="bg-white rounded-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
                <div className="flex flex-col md:flex-row flex-1">
                    {/* Filter 1 */}
                    <div className="flex items-center gap-2 border-b md:border-b-0 md:border-r border-slate-200 px-4 py-2 hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700">
                        <span className="text-slate-500">Співробітник</span>
                        <span className="font-medium">Усі</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </div>

                    {/* Filter 2 */}
                    <div className="flex items-center gap-2 border-b md:border-b-0 md:border-r border-slate-200 px-4 py-2 hover:bg-slate-50 cursor-pointer text-[13px] text-slate-700">
                        <span className="text-slate-500">Посада</span>
                        <span className="font-medium">Усі</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 px-4 py-2 flex-1 relative min-w-[250px]">
                        <Search size={16} className="text-slate-400 absolute left-4" />
                        <input
                            type="text"
                            placeholder="Почніть вводити для пошуку"
                            className="w-full pl-8 pr-4 py-1 text-[13px] outline-none placeholder:text-slate-400 text-slate-700 bg-transparent"
                        />
                    </div>
                </div>

                {/* Extra filters */}
                <div className="border-t md:border-t-0 md:border-l border-slate-200 px-4 py-3 flex items-center justify-center shrink-0 hover:bg-slate-50 cursor-pointer text-[13px] text-slate-600 font-medium">
                    <Filter size={14} className="mr-2" />
                    Додаткові фільтри
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <button className="bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-[8px] rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-2 shadow-sm">
                    <Plus size={16} />
                    <span>Додати Співробітника</span>
                </button>
                <button className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-[8px] rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-2 shadow-sm">
                    <Download size={16} />
                    <span>Імпорт</span>
                </button>
                <button className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-[8px] rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-2 shadow-sm">
                    <Upload size={16} />
                    <span>Експорт</span>
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px] whitespace-nowrap">
                        <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-[40px] text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                                <th className="px-4 py-3 cursor-pointer hover:text-slate-800">ID співробітника <span className="ml-1 text-[10px]">↕</span></th>
                                <th className="px-4 py-3 cursor-pointer hover:text-slate-800">Ім&apos;я <span className="ml-1 text-[10px]">↕</span></th>
                                <th className="px-4 py-3 cursor-pointer hover:text-slate-800">Електронна пошта <span className="ml-1 text-[10px]">↕</span></th>
                                <th className="px-4 py-3">Роль користувача</th>
                                <th className="px-4 py-3">Керівник <span className="ml-1 text-[10px]">↕</span></th>
                                <th className="px-4 py-3">Статус <span className="ml-1 text-[10px]">↕</span></th>
                                <th className="px-4 py-3 text-right">Дія</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80 text-slate-700">
                            {/* Row 1 - Current User */}
                            <tr className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                                <td className="px-4 py-4 text-slate-500 text-xs">-- <span className="ml-2 text-slate-400">EMP-1</span></td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-900/5">
                                            <img src="https://ui-avatars.com/api/?name=Dima&background=cbd5e1&color=475569" alt="Ava" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-800">Dima</span>
                                                <span className="bg-slate-500 text-white text-[10px] uppercase font-bold px-[6px] py-[2px] rounded leading-none pt-[3px]">Це ви</span>
                                            </div>
                                            <span className="bg-teal-500 text-white text-[10px] w-fit px-2 py-[2px] rounded-md mt-1 font-medium pb-[3px]">Нові співробітники</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">dmitriy.tovstitsky@gmail.com</td>
                                <td className="px-4 py-4"><span className="flex items-center gap-1">App Administrator <span className="w-3 h-3 rounded-full bg-slate-400 text-white flex justify-center items-center text-[8px] cursor-help">i</span></span></td>
                                <td className="px-4 py-4 text-slate-400">--</td>
                                <td className="px-4 py-4">
                                    <span className="flex items-center gap-2 text-slate-700">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]"></span>
                                        Активний
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[13px] text-slate-500 gap-4 mt-auto">
                    <div className="flex items-center gap-2">
                        Показати
                        <select className="border border-slate-300 rounded px-2 py-1 bg-white outline-none">
                            <option>25</option>
                            <option>50</option>
                            <option>100</option>
                        </select>
                        записів
                    </div>

                    <div className="flex items-center gap-4">
                        <span>Показано від 1 по 1 з 1 записів</span>
                        <div className="flex items-center">
                            <button className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-50 rounded-l-md text-slate-400 cursor-not-allowed">Попередня</button>
                            <button className="px-3 py-1 border-t border-b border-r border-[#2563eb] bg-[#2563eb] text-white font-medium">1</button>
                            <button className="px-3 py-1 border-t border-b border-r border-slate-300 bg-white hover:bg-slate-50 rounded-r-md text-slate-600">Наступна</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
