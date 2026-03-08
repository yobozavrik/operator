"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Target,
    MousePointerClick,
    ShoppingCart,
    HeartHandshake,
    Store,
    Shirt,
    PieChart,
    Activity,
    Repeat,
    Smile,
    Package,
    BarChart3,
    ArrowRightCircle,
    Star,
    Heart,
    Wallet,
    Search,
    Megaphone,
    Share2,
    Mail
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend, LineChart, Line, ComposedChart, PieChart as RePieChart, Pie, Cell, Scatter
} from 'recharts'

// --- MOCK DATA ---
const topViewData = [
    { name: 'Січ', spend: 120000, plan: 130000 },
    { name: 'Лют', spend: 110000, plan: 130000 },
    { name: 'Бер', spend: 135000, plan: 130000 },
    { name: 'Кві', spend: 140000, plan: 130000 },
    { name: 'Тра', spend: 145000, plan: 150000 },
    { name: 'Чер', spend: 160000, plan: 150000 },
]

const galyaLFLData = [
    { name: 'Оболонь', current: 450000, previous: 420000 },
    { name: 'Академ', current: 380000, previous: 390000 },
    { name: 'Позняки', current: 520000, previous: 480000 },
    { name: 'Троєщина', current: 410000, previous: 400000 },
    { name: 'Чернівці', current: 280000, previous: 310000 },
]

const galyaRFMData = [
    { name: 'Активні (>2 разів/міс)', value: 12500, fill: '#1ABB9C' },
    { name: 'Сплячі (>30 днів)', value: 3200, fill: '#F39C12' },
    { name: 'Втрачені (>45 днів - Відтік)', value: 1850, fill: '#E74C3C' },
]

const galyaProductionData = [
    { name: 'Цех Троєщина', plan: 100, fact: 105 },
    { name: 'Цех Позняки', plan: 100, fact: 95 },
    { name: 'Цех Оболонь', plan: 100, fact: 82 }, // Проблемний
    { name: 'Цех Центр', plan: 100, fact: 110 },
    { name: 'Цех Академ', plan: 100, fact: 98 },
]

const galyaPricesData = [
    { name: 'Пельмені (Ялов.)', our: 180, comp1: 175, comp2: 195 },
    { name: 'Вареники (Карт.)', our: 95, comp1: 90, comp2: 110 },
    { name: 'Млинці з м\'ясом', our: 160, comp1: 155, comp2: 170 },
    { name: 'Сирники (Новинка)', our: 210, comp1: 190, comp2: 240 },
]

const galyaAppFunnel = [
    { name: 'Перегляди (Радіус)', value: 45000, fill: '#9B59B6' },
    { name: 'Встановлення Додатку', value: 5200, fill: '#3498DB' },
    { name: 'Реєстрація', value: 3800, fill: '#F39C12' },
    { name: 'Перше зам. (CAC ₴140)', value: 1150, fill: '#1ABB9C' },
]

const factoryFunnelData = [
    { name: 'Вхідні заявки', value: 320, fill: '#3498DB' },
    { name: 'Кваліфікований лід', value: 145, fill: '#9B59B6' },
    { name: 'Відшив зразка', value: 68, fill: '#F39C12' },
    { name: 'Контракт', value: 24, fill: '#1ABB9C' },
]

const factoryLoadData = [
    { month: 'Лип', planned: 95, capacity: 100 },
    { month: 'Сер', planned: 100, capacity: 100 },
    { month: 'Вер', planned: 110, capacity: 100 }, // Перезавантаження
    { month: 'Жов', planned: 85, capacity: 100 },
    { month: 'Лис', planned: 60, capacity: 100 }, // Реклама ON
    { month: 'Гру', planned: 40, capacity: 100 },
]

const factoryTrendData = [
    { name: 'Спецодяг', search: 85, our: 20 },
    { name: 'Трикотаж', search: 65, our: 75 },
    { name: 'Худі/База', search: 90, our: 95 },
    { name: 'Складні куртки', search: 40, our: 10 },
]

const fashionFunnelData = [
    { name: 'Трафік ТЦ', value: 24500, fill: '#3498DB' },
    { name: 'Зайшли (Pass-by)', value: 8200, fill: '#9B59B6' },
    { name: 'Примірочна', value: 3100, fill: '#F39C12' },
    { name: 'Покупка', value: 1850, fill: '#1ABB9C' },
]

const retailFashionPrices = [
    { name: 'Баз. Футболка', our: 550, zara: 600, h_m: 500, reserved: 450 },
    { name: 'Джинси Mom', our: 1800, zara: 1950, h_m: 1600, reserved: 1500 },
    { name: 'Худі Оверсайз', our: 1650, zara: 1800, h_m: 1500, reserved: 1300 },
    { name: 'Сукня Літня', our: 2200, zara: 2500, h_m: 2100, reserved: 1800 }
]

const charityImpactData = [
    { name: 'Нагодовано', value: 12450, color: '#3498DB' },
    { name: 'Одягнено', value: 3800, color: '#9B59B6' },
    { name: 'Медицина', value: 850, color: '#E74C3C' },
    { name: 'Евакуація', value: 420, color: '#1ABB9C' },
]

const charityFundraisingData = [
    { name: 'Сайт', value: 450, fill: '#3498DB' },
    { name: 'Корпорації', value: 2500, fill: '#9B59B6' },
    { name: 'Instagram', value: 320, fill: '#F39C12' },
    { name: 'Бокси (Офлайн)', value: 150, fill: '#1ABB9C' },
]

const charityTrafficData = [
    { name: 'Візит на сайт', value: 15000, fill: '#3498DB' },
    { name: 'Клік "Задонатити"', value: 4200, fill: '#9B59B6' },
    { name: 'Початок оплати', value: 2100, fill: '#F39C12' },
    { name: 'Успішний платіж', value: 850, fill: '#1ABB9C' },
]

export default function MarketingDashboard() {
    return (
        <div className="space-y-6 text-[#ECF0F1] pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Маркетинг: Пульт управління (CMO)</h1>
                <p className="text-[#BDC3C7] mt-2">Стратегічний контроль бюджетів, лояльності та ефективності по 4 напрямках.</p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-[#1A252C] border border-[#2C3E50] mb-4 flex-wrap h-auto p-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-[#2C3E50] data-[state=active]:text-white text-[#BDC3C7] py-2">
                        <PieChart className="w-4 h-4 mr-2" /> Top View (Общий)
                    </TabsTrigger>
                    <TabsTrigger value="galya" className="data-[state=active]:bg-[#2C3E50] data-[state=active]:text-white text-[#BDC3C7] py-2">
                        <Store className="w-4 h-4 mr-2" /> Галя Балувана (Ритейл)
                    </TabsTrigger>
                    <TabsTrigger value="factory" className="data-[state=active]:bg-[#2C3E50] data-[state=active]:text-white text-[#BDC3C7] py-2">
                        <Shirt className="w-4 h-4 mr-2" /> Швейна фабрика (B2B)
                    </TabsTrigger>
                    <TabsTrigger value="retail" className="data-[state=active]:bg-[#2C3E50] data-[state=active]:text-white text-[#BDC3C7] py-2">
                        <ShoppingCart className="w-4 h-4 mr-2" /> Мережа одягу (Fashion)
                    </TabsTrigger>
                    <TabsTrigger value="charity" className="data-[state=active]:bg-[#2C3E50] data-[state=active]:text-white text-[#BDC3C7] py-2">
                        <HeartHandshake className="w-4 h-4 mr-2" /> Благодійний Фонд
                    </TabsTrigger>
                </TabsList>

                {/* --- 1. TOP VIEW --- */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <MetricCard title="Бюджет: Факт vs План" value="₴ 810K / 860K" trend="Недовитрата 5.8%" icon={<DollarSign />} color="text-[#1ABB9C]" />
                        <MetricCard title="Груповий ROMI (Return on Investment)" value="385%" trend="Висока окупність Галі Балуваної" icon={<Target />} color="text-[#3498DB]" />
                        <MetricCard title="Sentiment Analysis (Емоційний фон бренду)" value="82% Позитив" trend="Рейтинг відгуків мереж 4.8/5" icon={<Smile />} color="text-[#9B59B6]" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle className="text-[#ECF0F1]">Виконання маркетингового бюджету</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={topViewData}>
                                        <XAxis dataKey="name" stroke="#7F8C8D" />
                                        <YAxis stroke="#7F8C8D" />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Legend />
                                        <Bar dataKey="spend" name="Факт Витрат (₴)" fill="#3498DB" radius={[4, 4, 0, 0]} />
                                        <Line type="step" dataKey="plan" name="План (₴)" stroke="#E74C3C" strokeWidth={2} dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle className="text-[#ECF0F1]">Емоційний фон мереж (Sentiment Analysis)</CardTitle>
                                <CardDescription className="text-[#7F8C8D]">Співвідношення тональності згадувань по 4 брендах (позитив / нейтрал / негатив).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 pt-2">
                                    <ProgressBar label="Галя Балувана" value={88} metrics="88% (Смак, Сервіс)" color="bg-[#1ABB9C]" />
                                    <ProgressBar label="Мережа Одягу" value={72} metrics="72% (Стиль, але питання до лекал)" color="bg-[#F39C12]" />
                                    <ProgressBar label="Швейна Фабрика" value={95} metrics="95% (Якість швів, Пунктуальність B2B)" color="bg-[#3498DB]" />
                                    <ProgressBar label="Благодійний Фонд" value={98} metrics="98% (Довіра, Звіти, Прозорість)" color="bg-[#9B59B6]" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- 2. ГАЛЯ БАЛУВАНА (Detailed Breakdown) --- */}
                <TabsContent value="galya" className="space-y-10">

                    {/* 1. The Money */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <DollarSign className="mr-2 text-[#1ABB9C]" /> 1. Продажі та Фінанси (The Money)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-4">
                            <MetricCard title="LFL по 23 точках" value="+14.2% YoY" trend="Реальний ріст без нових точок" icon={<TrendingUp />} color="text-[#1ABB9C]" />
                            <MetricCard title="Структура Чеку" value="₴ 380 / 2.4 шт" trend="Середня ціна 1 позиції: ₴ 158 (-2%)" icon={<ShoppingCart />} color="text-[#3498DB]" />
                            <MetricCard title="Маржинальність" value="48% (Пельмені)" trend="Млинці (62%), Голубці (41%)" icon={<Activity />} color="text-[#9B59B6]" />
                            <MetricCard title="Списання / Брак" value="1.8% (9 Цехів)" trend="У межах норми (Але Цех №4: 3.2%)" icon={<TrendingDown />} color="text-[#E74C3C]" />
                        </div>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Динаміка виручки (LFL - Like-for-Like)</CardTitle>
                                <CardDescription className="text-[#7F8C8D]">Порівняння продажів точок з аналогічним періодом минулого року.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={galyaLFLData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" vertical={false} />
                                        <XAxis dataKey="name" stroke="#7F8C8D" />
                                        <YAxis stroke="#7F8C8D" />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Legend />
                                        <Bar dataKey="current" name="Цей Місяць" fill="#1ABB9C" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="previous" name="Минулий Рік (LFL)" fill="#2C3E50" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 2. The People */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Heart className="mr-2 text-[#E74C3C]" /> 2. Клієнтський досвід (The People)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-4">
                            <MetricCard title="Retention Rate" value="64%" trend="Повернулись за 2-ю покупкою" icon={<Repeat />} color="text-[#1ABB9C]" />
                            <MetricCard title="Churn Rate (Відтік)" value="12.5%" trend="Не купували > 45 днів (Пуш надіслано)" icon={<Users />} color="text-[#F39C12]" />
                            <MetricCard title="NPS та Відгуки" value="4.8/5" trend="Чернівці впали до 3.8 (АЛЕРТ!)" icon={<Star />} color="text-[#E74C3C]" />
                            <MetricCard title="RFM: Сплячі" value="3,200 ос." trend="Сегмент, що готується до відтоку" icon={<Activity />} color="text-[#9B59B6]" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>RFM-Аналіз (Життєвий цикл клієнтів)</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={galyaRFMData} layout="vertical" margin={{ left: 10 }}>
                                            <XAxis type="number" stroke="#7F8C8D" />
                                            <YAxis dataKey="name" type="category" stroke="#7F8C8D" width={180} />
                                            <RechartsTooltip cursor={{ fill: '#2C3E50' }} contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                            <Bar dataKey="value" name="Клієнтів" radius={[0, 4, 4, 0]}>
                                                {galyaRFMData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>NPS та Репутація (Мапи + Додаток)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6 pt-2 text-[#ECF0F1]">
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-2">
                                            <div><p className="font-bold">Троєщина (№4)</p><p className="text-xs text-[#7F8C8D]">"Дуже смачно, але черги ввечері"</p></div>
                                            <div className="text-right text-[#1ABB9C] font-bold">4.8 / 5</div>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-2">
                                            <div><p className="font-bold text-[#E74C3C]">Чернівці (Майдан)</p><p className="text-xs text-[#7F8C8D]">"Тісто розвалюється, сервіс повільний!"</p></div>
                                            <div className="text-right text-[#E74C3C] font-bold flex items-center">3.8 / 5 <Badge className="bg-red-600 px-1 py-0 ml-2 rounded text-[10px]">КРИТИЧНО</Badge></div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div><p className="font-bold">Печерськ (Ценральна)</p><p className="text-xs text-[#7F8C8D]">"Преміум якість, привітний стаф"</p></div>
                                            <div className="text-right text-[#1ABB9C] font-bold">4.9 / 5</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 3. The Product */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Package className="mr-2 text-[#F39C12]" /> 3. Виробництво та Логістика (The Product)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <MetricCard title="Out-of-stock (Дефіцит)" value="12 Позицій" trend="Голубці закінчились до 14:00 (Втрата маржі)" icon={<ArrowRightCircle />} color="text-[#E74C3C]" />
                            <MetricCard title="План по 9 Цехах" value="92% Відпов." trend="Оболонь відстає від попиту на 18%" icon={<Activity />} color="text-[#3498DB]" />
                            <MetricCard title="Популярність Новинок" value="Сирники: +45%" trend="Вийшли на планові продажі за 14 днів" icon={<Star />} color="text-[#1ABB9C]" />
                        </div>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Завантаження та план 9 цехів (Маркетинг створює попит)</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={galyaProductionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" vertical={false} />
                                        <XAxis dataKey="name" stroke="#7F8C8D" />
                                        <YAxis stroke="#7F8C8D" />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Legend />
                                        <Bar dataKey="plan" name="План (Попит)" fill="#3498DB" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="fact" name="Факт (Виробництво)" fill="#F39C12" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 4. The Traffic */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <MousePointerClick className="mr-2 text-[#9B59B6]" /> 4. Digital та Трафік (The Traffic)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <MetricCard title="Ефективність Додатка" value="CPI ₴24 / CAC ₴140" trend="Конверсія Install -> Order: 22%" icon={<Target />} color="text-[#1ABB9C]" />
                            <MetricCard title="Гео-Маркетинг (1-2 км)" value="CPV ₴14.5" trend="Радіус працює краще за місто" icon={<Store />} color="text-[#3498DB]" />
                            <MetricCard title="Ефективність QR (Каса)" value="1420 Скана/Міс" trend="Безкоштовне залучення у CRM" icon={<Smile />} color="text-[#F39C12]" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Воронка App-додатка (Шлях до першого замовлення)</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={galyaAppFunnel} layout="vertical" margin={{ left: 10 }}>
                                            <XAxis type="number" stroke="#7F8C8D" />
                                            <YAxis dataKey="name" type="category" stroke="#7F8C8D" width={150} />
                                            <RechartsTooltip cursor={{ fill: '#2C3E50' }} contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                            <Bar dataKey="value" name="Людей" radius={[0, 4, 4, 0]}>
                                                {galyaAppFunnel.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Гео-Маркетинг (Офлайн точки)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 pt-2">
                                        <ProgressBar label="Таргет 1-2 км (Ads)" value={85} metrics="₴12 Cost Per Visit" color="bg-[#1ABB9C]" />
                                        <ProgressBar label="QR-коди на вітринах" value={65} metrics="₴0 (Органічний трафік)" color="bg-[#F39C12]" />
                                        <ProgressBar label="Локальні Push-сповіщення" value={45} metrics="₴0 (Гео-фенсінг)" color="bg-[#9B59B6]" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 5. The Market */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <BarChart3 className="mr-2 text-[#3498DB]" /> 5. Конкурентне Середовище (The Market)
                        </h3>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Моніторинг цін (Ми vs Конкуренти)</CardTitle>
                                <CardDescription className="text-[#7F8C8D]">Автоматичне порівняння цін на масові позиції для перевірки демпінгу або маржі.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={galyaPricesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" vertical={false} />
                                        <XAxis dataKey="name" stroke="#7F8C8D" />
                                        <YAxis stroke="#7F8C8D" />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Legend />
                                        <Bar dataKey="our" name="Галя Балувана (Ми)" fill="#1ABB9C" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="comp1" name="Конкурент 1 (Локальний)" fill="#E74C3C" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="comp2" name="Конкурент 2 (Преміум)" fill="#9B59B6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                </TabsContent>

                {/* --- 3. ШВЕЙНА ФАБРИКА (B2B) --- */}
                <TabsContent value="factory" className="space-y-10">

                    {/* 1. Lead Generation (Воронка B2B) */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Target className="mr-2 text-[#3498DB]" /> 1. Воронка B2B-продаж (Lead Generation)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-4">
                            <MetricCard title="CPL (Cost Per Lead)" value="₴ 450" trend="LinkedIn: ₴850 | Виставки: ₴2400" icon={<DollarSign />} color="text-[#E74C3C]" />
                            <MetricCard title="Конверсія: Лід -> Контракт" value="7.5%" trend="Вузьке місце: Відшив зразка (тільки 46% погоджують)" icon={<TrendingDown />} color="text-[#F39C12]" />
                            <MetricCard title="Top Traffic Source" value="SEO (B2B)" trend="64 ліди. Найнижча вартість (₴ 180/лід)" icon={<MousePointerClick />} color="text-[#1ABB9C]" />
                            <MetricCard title="Pipeline Value" value="₴ 12.4M" trend="Потенційна сума всіх угод в роботі" icon={<Activity />} color="text-[#3498DB]" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Воронка B2B (Шлях до контракту)</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={factoryFunnelData} layout="vertical" margin={{ left: 10 }}>
                                            <XAxis type="number" stroke="#7F8C8D" />
                                            <YAxis dataKey="name" type="category" stroke="#7F8C8D" width={150} />
                                            <RechartsTooltip cursor={{ fill: '#2C3E50' }} contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                            <Bar dataKey="value" name="Ліди" radius={[0, 4, 4, 0]}>
                                                {factoryFunnelData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Ефективність Лідогенерації (Джерела)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 pt-2">
                                        <div className="flex justify-between text-sm text-[#BDC3C7] mb-2">
                                            <span>Джерело (Усього 320 заявок)</span>
                                            <span className="text-right">CPL (Вартість)</span>
                                        </div>
                                        <ProgressBar label="SEO (Органіка B2B Пошук)" value={45} metrics="₴ 180 (144 Ліди)" color="bg-[#1ABB9C]" />
                                        <ProgressBar label="LinkedIn Аутріч" value={30} metrics="₴ 850 (96 Лідів)" color="bg-[#3498DB]" />
                                        <ProgressBar label="Профільні виставки (Офлайн)" value={15} metrics="₴ 2,400 (48 Лідів)" color="bg-[#9B59B6]" />
                                        <ProgressBar label="Контекстна реклама (Google)" value={10} metrics="₴ 600 (32 Ліди)" color="bg-[#F39C12]" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 2. Brand Assets */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Shirt className="mr-2 text-[#9B59B6]" /> 2. Контент та Візуальний капітал (Brand Assets)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <MetricCard title="Ефективність Продакшену (AI vs Real)" value="AI дає 95% результату" trend="CTR однаковий, але AI в 10 разів дешевший" icon={<Package />} color="text-[#1ABB9C]" />
                            <MetricCard title="Usage Rate Каталогу (Запити лекал)" value="Худі оверсайз - Топ 1" trend="Основа для завантаження конвеєрів" icon={<MousePointerClick />} color="text-[#3498DB]" />
                        </div>
                    </div>

                    {/* 3. Unit Economics */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Activity className="mr-2 text-[#F39C12]" /> 3. Економіка виробництва та Маркетинг (Unit Economics)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <MetricCard title="Завантаження (Місткість)" value="Вересень перевантажений" trend="Листопад: 60% (УВАГА! Включаємо ретаргетинг)" icon={<Activity />} color="text-[#E74C3C]" />
                            <MetricCard title="Sample-to-Order Ratio" value="35% (з 68 зразків)" trend="Аналіз відмов: 40% дорого, 20% терміни" icon={<PieChart />} color="text-[#F39C12]" />
                            <MetricCard title="CAC vs LTV (1 Оптовик)" value="₴ 1,200 / ₴ 450,000" trend="Клієнт окупається одразу з 1-ї партії" icon={<DollarSign />} color="text-[#1ABB9C]" />
                        </div>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Завантаження Виробництва (% від максимальної місткості)</CardTitle>
                                <CardDescription className="text-[#7F8C8D]">Рішення: Вересень = вимикаємо рекламу. Листопад-Грудень = запускаємо акції для "сплячих" клієнтів.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={factoryLoadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" vertical={false} />
                                        <XAxis dataKey="month" stroke="#7F8C8D" />
                                        <YAxis stroke="#7F8C8D" />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Legend />
                                        <Bar dataKey="planned" name="Законтрактовано (%)" fill="#F39C12" radius={[4, 4, 0, 0]} />
                                        <Line type="monotone" dataKey="capacity" name="Максимальна Потужність (%)" stroke="#E74C3C" strokeWidth={2} strokeDasharray="5 5" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 4. Product Intelligence */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <TrendingUp className="mr-2 text-[#1ABB9C]" /> 4. Аналіз асортименту (Product Intelligence)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <MetricCard title="Рентабельність категорій" value="Трикотаж: Покриває витрати" trend="Маркетинговий фокус: Спецодяг (Висока чиста маржа)" icon={<DollarSign />} color="text-[#9B59B6]" />
                            <MetricCard title="Інтеграція з CRM" value="Система синхронізована" trend="Ліди падають прямо в графік цехів" icon={<HeartHandshake />} color="text-[#3498DB]" />
                        </div>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Trend-matching (Ринок vs Наш поточний асортимент / запити)</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={factoryTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" vertical={false} />
                                        <XAxis dataKey="name" stroke="#7F8C8D" />
                                        <YAxis stroke="#7F8C8D" />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Legend />
                                        <Bar dataKey="search" name="Попит на ринку (Trends/Pinterest)" fill="#3498DB" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="our" name="Наша Фокусна пропозиція" fill="#9B59B6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                </TabsContent>

                {/* --- 4. МЕРЕЖА ОДЯГУ (FASHION RETAIL) --- */}
                <TabsContent value="retail" className="space-y-10">

                    {/* 1. Store Performance */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Store className="mr-2 text-[#F39C12]" /> 1. Аналітика Магазину (Store Performance)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-4">
                            <MetricCard title="Конверсія Трафіку" value="7.5%" trend="Зайшли 8200 -> Купили 1850" icon={<TrendingUp />} color="text-[#1ABB9C]" />
                            <MetricCard title="UPT (Речей в чеку)" value="2.1 од." trend="Мета: 2.5 (Крос-сейли на касі)" icon={<ShoppingCart />} color="text-[#3498DB]" />
                            <MetricCard title="Виручка на 1 кв.м" value="₴ 18,500" trend="ТРЦ Ocean Plaza (Топ-ефективність)" icon={<DollarSign />} color="text-[#9B59B6]" />
                            <MetricCard title="Конверсія Примірочних" value="59%" trend="3100 примірок -> 1850 чеків" icon={<Shirt />} color="text-[#E74C3C]" />
                        </div>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Воронка ТЦ (Трафік -&gt; Вітрина -&gt; Примірочна -&gt; Каса)</CardTitle>
                                <CardDescription className="text-[#7F8C8D]">Масивні втрати між "Зайшов" та "Примірочною".</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={fashionFunnelData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                        <XAxis type="number" stroke="#7F8C8D" />
                                        <YAxis dataKey="name" type="category" stroke="#7F8C8D" width={150} />
                                        <RechartsTooltip cursor={{ fill: '#2C3E50' }} contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Bar dataKey="value" name="Людей" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#BDC3C7' }}>
                                            {fashionFunnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 2. Merchandising */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Package className="mr-2 text-[#1ABB9C]" /> 2. Товарна матриця та Оборотність (Merchandising)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Управління Асортиментом (ABC & Sell-through)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6 pt-2 text-[#ECF0F1]">
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-2">
                                            <div><p className="font-bold text-[#1ABB9C]">A-Клас (Хіти продажів)</p><p className="text-xs text-[#7F8C8D]">Базові футболки, Джинси Mom</p></div>
                                            <div className="text-right font-bold text-sm">Sell-through 45%<br /><span className="text-xs font-normal text-[#BDC3C7]">Треба дошити на Фабриці</span></div>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-2">
                                            <div><p className="font-bold text-[#F39C12]">B-Клас (База)</p><p className="text-xs text-[#7F8C8D]">Світшоти, Лонгсліви</p></div>
                                            <div className="text-right font-bold text-sm">Sell-through 20%<br /><span className="text-xs font-normal text-[#BDC3C7]">Стабільний попит</span></div>
                                        </div>
                                        <div className="flex justify-between items-center pb-2">
                                            <div><p className="font-bold text-[#E74C3C]">C-Клас (Мертвий вантаж)</p><p className="text-xs text-[#7F8C8D]">Куртки оверсайз, Складні сукні</p></div>
                                            <div className="text-right font-bold text-sm">Sell-through 4%<br /><span className="text-xs font-normal text-[#E74C3C]">🚨 Запуск MID-SEASON SALE -40%</span></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Ключові метрики запасів</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-4">
                                            <span className="text-[#ECF0F1] font-bold">Sell-through (За 2 тижні)</span>
                                            <Badge className="bg-green-600 text-white">18% (Норма &gt; 15%)</Badge>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-4">
                                            <span className="text-[#ECF0F1] font-bold">Stock-to-Sales Ratio</span>
                                            <Badge className="bg-[#3498DB] text-white">2.8 (Місячний запас)</Badge>
                                        </div>
                                        <div className="flex justify-between items-center pb-2">
                                            <span className="text-[#ECF0F1] font-bold">Частка товарів зі знижкою</span>
                                            <Badge className="bg-[#F39C12] text-white">12% (Від всього об'єму)</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 3. Digital Marketing (AI) */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Heart className="mr-2 text-[#E74C3C]" /> 3. Цифровий маркетинг та Візуал (Digital & AI)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <MetricCard title="ER (Engagement Rate)" value="4.2% (Insta)" trend="В 2 рази вище за ринок" icon={<Smile />} color="text-[#9B59B6]" />
                            <MetricCard title="O2O Конверсія" value="1,240 Чеків" trend="Прийшли в магазин після інстаграму" icon={<Target />} color="text-[#1ABB9C]" />
                            <MetricCard title="Sentiment Analysis" value="89% Позитив" trend="7% Скарг на розмірну сітку" icon={<Activity />} color="text-[#3498DB]" />
                        </div>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Ефективність Контенту: AI vs Real vs UGC (Return on Content)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6 pt-2 text-[#ECF0F1]">
                                    <div className="flex justify-between items-center border-b border-[#2C3E50] pb-2">
                                        <div><p className="font-bold">✨ AI-Згенеровані Моделі</p><p className="text-xs text-[#1ABB9C]">Низький CPA (₴120), Швидкий запуск кампанії.</p></div>
                                        <div className="text-right font-bold text-sm">CTR 2.3%</div>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-[#2C3E50] pb-2">
                                        <div><p className="font-bold">Жива зйомка (Повноцінний Lookbook)</p><p className="text-xs text-[#E74C3C]">Високий CPA (₴450). Довгий продакшн.</p></div>
                                        <div className="text-right font-bold text-sm">CTR 2.1%</div>
                                    </div>
                                    <div className="flex justify-between items-center pb-2">
                                        <div><p className="font-bold">UGC (Відгуки Клієнтів)</p><p className="text-xs text-[#F39C12]">Найвища довіра. Безкоштовний контент.</p></div>
                                        <div className="text-right font-bold text-sm">CTR 3.5%</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 4. CRM */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Users className="mr-2 text-[#3498DB]" /> 4. Клієнтська база (CRM Аналітика)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <MetricCard title="Карти лояльності" value="68% Чеків" trend="+5% за рахунок Apple Wallet" icon={<Repeat />} color="text-[#1ABB9C]" />
                            <MetricCard title="LTV (Lifetime Value)" value="₴ 12,400 / Рік" trend="В середньому 4.5 покупок/рік" icon={<DollarSign />} color="text-[#9B59B6]" />
                            <MetricCard title="Інтервал покупок" value="82 Дні" trend="Пуш-кампанія запускається на 90-й день" icon={<Store />} color="text-[#E74C3C]" />
                        </div>
                    </div>

                    {/* 5. Pricing (Market) */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <BarChart3 className="mr-2 text-[#F39C12]" /> 5. Конкурентний моніторинг (Pricing)
                        </h3>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Індекс цін на базові позиції (В рамках ТРЦ)</CardTitle>
                                <CardDescription className="text-[#7F8C8D]">Ми тримаємо ціни трохи нижче H&M та Zara, але вище за Reserved.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={retailFashionPrices} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" vertical={false} />
                                        <XAxis dataKey="name" stroke="#7F8C8D" />
                                        <YAxis stroke="#7F8C8D" />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Legend />
                                        <Bar dataKey="our" name="Наш Бренд" fill="#1ABB9C" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="zara" name="Zara" fill="#E74C3C" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="h_m" name="H&M" fill="#3498DB" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="reserved" name="Reserved" fill="#9B59B6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                </TabsContent>

                {/* --- 5. БЛАГОДІЙНИЙ ФОНД (CHARITY) --- */}
                <TabsContent value="charity" className="space-y-10">

                    {/* 1. Fundraising Efficiency */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <DollarSign className="mr-2 text-[#3498DB]" /> 1. Економіка фандрайзингу (Fundraising Efficiency)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-4">
                            <MetricCard title="DAC (Donor Acquisition Cost)" value="₴ 120" trend="Ціна залучення одного нового донора" icon={<Users />} color="text-[#1ABB9C]" />
                            <MetricCard title="LTV Донора" value="₴ 4,500" trend="Скільки людина жертвує за весь час" icon={<TrendingUp />} color="text-[#9B59B6]" />
                            <MetricCard title="Retention (Рекурренти)" value="48%" trend="КЛЮЧОВА: Відсоток щомісячних підписок" icon={<Repeat />} color="text-[#F39C12]" />
                            <MetricCard title="Середній чек (Загальний)" value="₴ 540" trend="Без урахування корпоративних зборів" icon={<Wallet />} color="text-[#E74C3C]" />
                        </div>
                        <Card className="bg-[#1A252C] border-[#2C3E50]">
                            <CardHeader>
                                <CardTitle>Середній Чек Пожертви за Каналами</CardTitle>
                                <CardDescription className="text-[#7F8C8D]">Корпоративні донати тягнуть середній чек вгору, онлайн-пожертви масові, але дрібніші.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charityFundraisingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" vertical={false} />
                                        <XAxis dataKey="name" stroke="#7F8C8D" />
                                        <YAxis stroke="#7F8C8D" />
                                        <RechartsTooltip cursor={{ fill: '#2C3E50' }} contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                        <Bar dataKey="value" name="Середній чек (₴)" radius={[4, 4, 0, 0]}>
                                            {charityFundraisingData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 2. Transparency Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Search className="mr-2 text-[#1ABB9C]" /> 2. Прозорість та Довіра (Transparency Metrics)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Impact-Лічильник (Реальний Вплив)</CardTitle>
                                    <CardDescription className="text-[#7F8C8D]">Найкращий креатив для реклами — це цифри врятованих.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[250px] flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={charityImpactData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {charityImpactData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                            <Legend />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Метрики Прозорості</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6 pt-4 text-[#ECF0F1]">
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-4">
                                            <span className="font-bold">Адміністративні витрати</span>
                                            <Badge className="bg-green-600 text-white">14% (Мета &lt; 20%)</Badge>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-4">
                                            <span className="font-bold">Швидкість закриття збору (Середня)</span>
                                            <Badge className="bg-[#3498DB] text-white">9 Днів</Badge>
                                        </div>
                                        <div className="flex justify-between items-center pb-2">
                                            <span className="font-bold">Донори, що перевірили звіти</span>
                                            <Badge className="bg-[#9B59B6] text-white">28% (Високий рівень)</Badge>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#7F8C8D] mt-6 italic">* Адмін. витрати покриваються цільовими грантами, 100% донатів користувачів йде на Impact.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 3. Social Reach & Influence */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <Megaphone className="mr-2 text-[#9B59B6]" /> 3. Соціальний капітал та PR (Social Reach)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Ефективність Амбасадорів (Influence)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6 pt-2 text-[#ECF0F1]">
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-2">
                                            <div><p className="font-bold">@top_blogger (Tech)</p><p className="text-xs text-[#1ABB9C]">Висока довіра аудиторії.</p></div>
                                            <div className="text-right font-bold text-sm">₴ 450К (Зібрано)<br /><span className="text-xs font-normal text-[#BDC3C7]">1,200 Переходів</span></div>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[#2C3E50] pb-2">
                                            <div><p className="font-bold">@lifestyle_star (Lifestyle)</p><p className="text-xs text-[#E74C3C]">Охоплення велике, донатів мало.</p></div>
                                            <div className="text-right font-bold text-sm">₴ 85К (Зібрано)<br /><span className="text-xs font-normal text-[#BDC3C7]">8,500 Переходів</span></div>
                                        </div>
                                        <div className="flex justify-between items-center pb-2">
                                            <div><p className="font-bold">@local_hero (Волонтер)</p><p className="text-xs text-[#F39C12]">Тепла аудиторія.</p></div>
                                            <div className="text-right font-bold text-sm">₴ 210К (Зібрано)<br /><span className="text-xs font-normal text-[#BDC3C7]">950 Переходів</span></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="space-y-4">
                                <MetricCard title="Share of Voice (Частка голосу)" value="18%" trend="Зростання на 3% після TV-інтерв'ю" icon={<Activity />} color="text-[#3498DB]" />
                                <MetricCard title="Віральність Контенту" value="12,500 Репостів" trend="Акція 'Підписка на добро'" icon={<Share2 />} color="text-[#1ABB9C]" />
                            </div>
                        </div>
                    </div>

                    {/* 4. Digital Performance */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#ECF0F1] flex items-center border-b border-[#2C3E50] pb-2">
                            <MousePointerClick className="mr-2 text-[#E74C3C]" /> 4. Конверсійні воронки (Digital Performance)
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="bg-[#1A252C] border-[#2C3E50]">
                                <CardHeader>
                                    <CardTitle>Воронка Сайту (Landing Page Conversion)</CardTitle>
                                    <CardDescription className="text-[#E74C3C] font-bold">Увага! Drop-off на оплаті = 59% (З 2100 до 850). Потрібно спрощувати форму!</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={charityTrafficData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                            <XAxis type="number" stroke="#7F8C8D" />
                                            <YAxis dataKey="name" type="category" stroke="#7F8C8D" width={120} />
                                            <RechartsTooltip cursor={{ fill: '#2C3E50' }} contentStyle={{ backgroundColor: '#233446', borderColor: '#304860', color: '#FFF' }} />
                                            <Bar dataKey="value" name="Користувачів" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#BDC3C7' }}>
                                                {charityTrafficData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <div className="space-y-4">
                                <MetricCard title="Landing Page Conversion" value="5.6%" trend="15000 Візитів -> 850 Оплат (Норма)" icon={<Target />} color="text-[#9B59B6]" />
                                <MetricCard title="Ефективність Email/Messengers" value="45% Open Rate" trend="Листи зі звітами читають найкраще (Click Rate 12%)" icon={<Mail />} color="text-[#3498DB]" />
                            </div>
                        </div>
                    </div>

                </TabsContent>

            </Tabs>
        </div>
    )
}

function MetricCard({ title, value, trend, icon, color }: { title: string, value: string | number, trend: string, icon: React.ReactNode, color: string }) {
    return (
        <Card className="bg-[#1A252C] border-[#2C3E50]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-[#BDC3C7] whitespace-pre-line leading-none">{title}</CardTitle>
                <div className={color}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-xl font-bold">{value}</div>
                <p className="text-xs text-[#7F8C8D] mt-1">{trend}</p>
            </CardContent>
        </Card>
    )
}

function ProgressBar({ label, value, metrics, color = "bg-[#1ABB9C]" }: { label: string, value: number, metrics: string, color?: string }) {
    return (
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-[#ECF0F1]">{label}</span>
                <span className="text-[#BDC3C7] font-medium">{metrics}</span>
            </div>
            <div className="w-full bg-[#233446] rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    )
}
