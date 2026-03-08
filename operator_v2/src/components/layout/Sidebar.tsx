"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Pizza,
    Croissant, // Using croissant for Craft Bread
    Shirt,
    HeartHandshake,
    Store,
    DollarSign,
    TrendingUp,
    Settings,
    LogOut,
    ChevronDown,
    Users
} from "lucide-react"

export function Sidebar() {
    const pathname = usePathname()
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

    const toggleMenu = (href: string) => {
        setOpenMenus(prev => ({ ...prev, [href]: !prev[href] }))
    }

    const routes = [
        {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/dashboard",
        },
        {
            label: "Галя Балувана",
            icon: Store,
            href: "/dashboard/galya-baluvana",
            subItems: [
                { label: "Фінанси", href: "/dashboard/galya-baluvana/finance" },
                { label: "Виробництво", href: "/dashboard/galya-baluvana/production" },
                { label: "Пицца", href: "/dashboard/galya-baluvana/pizza" },
                { label: "Кондитерка", href: "/dashboard/galya-baluvana/konditerka" },
                { label: "Хлеб", href: "/dashboard/galya-baluvana/bread" },
                { label: "Гравитон", href: "/dashboard/galya-baluvana/graviton" },
            ]
        },
        {
            label: "Швейная фабрика",
            icon: Shirt,
            href: "/dashboard/factory",
            subItems: [
                { label: "Загальний огляд", href: "/dashboard/factory" },
                { label: "Склад", href: "/dashboard/factory/stock" },
                { label: "Streamline Analytics", href: "/dashboard/factory/streamline" },
            ]
        },
        {
            label: "Сеть одежды",
            icon: Store,
            href: "/dashboard/retail",
            subItems: [
                { label: "Загальний огляд", href: "/dashboard/retail" },
                { label: "Streamline Analytics", href: "/dashboard/retail/streamline" },
            ]
        },
        {
            label: "Фонд",
            icon: HeartHandshake,
            href: "/dashboard/charity",
        },
        {
            label: "Финансы (Finmap)",
            icon: DollarSign,
            href: "/dashboard/finance",
        },
        {
            label: "Маркетинг",
            icon: TrendingUp,
            href: "/dashboard/marketing",
        },
        {
            label: "HR & Рекрутинг",
            icon: Users,
            href: "/hr",
            subItems: [
                { label: "Обзор", href: "/hr" },
                { label: "Співробітники", href: "/hr/employees" },
                { label: "Відпустки та свята", href: "/hr/leaves" },
                { label: "Графік та відвідуваність", href: "/hr/attendances" },
                { label: "Опитування", href: "/hr/surveys" },
                { label: "Рекрутинг: Дашборд", href: "/hr/recruit/dashboard" },
                { label: "Рекрутинг: Вакансії", href: "/hr/recruit/jobs" },
                { label: "Рекрутинг: Кандидати", href: "/hr/recruit/candidate" },
            ]
        },
        {
            label: "Настройки",
            icon: Settings,
            href: "/dashboard/settings",
        },
    ]

    return (
        <div className="flex flex-col h-full bg-[var(--color-brand-sidebar)] text-[var(--color-brand-text-light)] relative w-64">

            {/* Logo area */}
            <div className="p-4 flex items-center justify-center">
                <Link href="/dashboard" className="flex items-center gap-3 w-full">
                    <Pizza className="h-8 w-8 text-white" />
                    <span className="text-xl font-bold tracking-wider text-[#ECF0F1]">Operator V2</span>
                </Link>
            </div>

            {/* Profile snippet */}
            <div className="flex items-center p-4 mb-2 border-b border-[#304860]">
                <div className="h-12 w-12 rounded-full border-2 border-[#1ABB9C] overflow-hidden flex items-center justify-center bg-zinc-800">
                    {/* Placeholder image for user */}
                    <div className="h-full w-full bg-slate-300" />
                </div>
                <div className="ml-4 flex flex-col justify-center">
                    <span className="text-sm font-medium text-[#c0cacd]">Добро пожаловать,</span>
                    <span className="text-base font-semibold text-[#ECF0F1]">Владелец</span>
                </div>
            </div>

            {/* Menu Header */}
            <div className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#1ABB9C]">
                General
            </div>

            {/* Navigation Routes */}
            <div className="flex-1 overflow-y-auto px-0">
                <div className="flex flex-col space-y-0.5">
                    {routes.map((route) => {
                        const isPathActive = pathname === route.href || (!!route.subItems && pathname.startsWith(route.href));
                        const isOpen = isPathActive || openMenus[route.href];

                        return (
                            <div key={route.href}>
                                {route.subItems ? (
                                    <button
                                        onClick={() => toggleMenu(route.href)}
                                        className={cn(
                                            "w-full flex items-center px-4 py-3.5 text-[15px] transition-all duration-200 border-r-4",
                                            isPathActive
                                                ? "bg-[rgba(255,255,255,0.05)] border-[var(--color-brand-sidebar-hover)] text-white font-medium"
                                                : "border-transparent hover:bg-[rgba(255,255,255,0.05)] text-[#E7E7E7]"
                                        )}
                                    >
                                        <route.icon className={cn("h-[18px] w-[18px] mr-3")} />
                                        <span className="flex-1 text-left">{route.label}</span>
                                        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
                                    </button>
                                ) : (
                                    <Link
                                        href={route.href}
                                        className={cn(
                                            "w-full flex items-center px-4 py-3.5 text-[15px] transition-all duration-200 border-r-4",
                                            isPathActive
                                                ? "bg-[rgba(255,255,255,0.05)] border-[var(--color-brand-sidebar-hover)] text-white font-medium"
                                                : "border-transparent hover:bg-[rgba(255,255,255,0.05)] text-[#E7E7E7]"
                                        )}
                                    >
                                        <route.icon className={cn("h-[18px] w-[18px] mr-3")} />
                                        <span className="flex-1 text-left">{route.label}</span>
                                    </Link>
                                )}

                                {/* Submenu Rendering */}
                                {route.subItems && isOpen && (
                                    <div className="bg-[rgba(0,0,0,0.15)] select-none">
                                        {route.subItems.map(subItem => (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className={cn(
                                                    "w-full flex items-center pl-10 py-2.5 text-sm transition-colors",
                                                    pathname === subItem.href
                                                        ? "text-white font-medium"
                                                        : "text-[rgba(255,255,255,0.7)] hover:text-white"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full mr-3",
                                                    pathname === subItem.href ? "bg-[var(--color-brand-sidebar-hover)]" : "bg-[rgba(255,255,255,0.3)]"
                                                )} />
                                                {subItem.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer menu */}
            <div className="bg-[#233446] p-2 flex justify-around border-t border-[#304860]">
                <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-white text-zinc-400">
                    <Settings className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-white text-zinc-400">
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}
