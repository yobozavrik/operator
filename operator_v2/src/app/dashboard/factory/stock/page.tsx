"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Search, Package, AlertTriangle, ArrowUpDown, Boxes, Calculator, Coins } from 'lucide-react'

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface KeyCRMOffer {
    id: number
    sku: string
    quantity: number
    in_reserve: number
    price: number
    purchased_price: number
    properties: { name: string, value: string }[]
    product: {
        id: number
        name: string
        category_id: number
    }
}

export default function FactoryStockPage() {
    const { data: response, error, isLoading } = useSWR('/api/factory/stock', fetcher, {
        refreshInterval: 60000 // Refresh every minute
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(15)

    const offers: KeyCRMOffer[] = response?.data || []

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedOffers = React.useMemo(() => {
        let result = [...offers]

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase()
            result = result.filter(offer =>
                offer.sku?.toLowerCase().includes(lowerCaseSearch) ||
                offer.product?.name?.toLowerCase().includes(lowerCaseSearch) ||
                offer.properties?.some(prop => prop.value.toLowerCase().includes(lowerCaseSearch))
            )
        }

        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof KeyCRMOffer]
                let bValue: any = b[sortConfig.key as keyof KeyCRMOffer]

                // Handle nested product name sorting
                if (sortConfig.key === 'product_name') {
                    aValue = a.product?.name || ''
                    bValue = b.product?.name || ''
                }

                // Handle calculated values
                if (sortConfig.key === 'total_purchased') {
                    aValue = (a.quantity || 0) * (a.purchased_price || 0)
                    bValue = (b.quantity || 0) * (b.purchased_price || 0)
                }
                if (sortConfig.key === 'total_retail') {
                    aValue = (a.quantity || 0) * (a.price || 0)
                    bValue = (b.quantity || 0) * (b.price || 0)
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [offers, searchTerm, sortConfig])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedOffers.length / itemsPerPage)
    const paginatedOffers = filteredAndSortedOffers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // KPIs
    const totalItems = offers.length
    const totalQuantity = offers.reduce((sum, offer) => sum + (offer.quantity || 0), 0)
    const outOfStockCount = offers.filter(offer => (offer.quantity || 0) <= 0).length
    const totalReserved = offers.reduce((sum, offer) => sum + (offer.in_reserve || 0), 0)

    // Financial Valuation KPIs
    const totalPurchasedValue = offers.reduce((sum, offer) => sum + ((offer.quantity || 0) * (offer.purchased_price || 0)), 0)
    const totalRetailValue = offers.reduce((sum, offer) => sum + ((offer.quantity || 0) * (offer.price || 0)), 0)

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val)
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-red-500">
                <AlertTriangle className="mr-2" />
                <p>Помилка завантаження даних складу. Перевірте підключення до KeyCRM.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#ECF0F1]">Залишки на складі (KeyCRM)</h1>
                <p className="text-sm text-[#BDC3C7] mt-2">Детальна інформація по товарним пропозиціям, залишкам та фінансова оцінка складу.</p>
            </div>

            {/* Financial Valuation Section (Based on Screenshot Request) */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-[#1A252C] border-[#2C3E50]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#BDC3C7]">Кількість товару</CardTitle>
                        <Package className="h-4 w-4 text-[#1ABB9C]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{isLoading ? '...' : totalQuantity} одиниць</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A252C] border-[#2C3E50]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#BDC3C7]">Оцінка складу (У закупівельних цінах)</CardTitle>
                        <Calculator className="h-4 w-4 text-[#F39C12]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{isLoading ? '...' : formatCurrency(totalPurchasedValue)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A252C] border-[#2C3E50]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#BDC3C7]">Оцінка складу (За цінами продажу)</CardTitle>
                        <Coins className="h-4 w-4 text-[#3498DB]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{isLoading ? '...' : formatCurrency(totalRetailValue)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* General Stock KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-[#1A252C] border-[#2C3E50]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#BDC3C7]">Всього позицій (SKU)</CardTitle>
                        <Boxes className="h-4 w-4 text-[#1ABB9C]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{isLoading ? '...' : totalItems}</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A252C] border-[#2C3E50]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#BDC3C7]">В резерві (Одиниць)</CardTitle>
                        <ArrowUpDown className="h-4 w-4 text-[#9B59B6]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#F39C12]">{isLoading ? '...' : totalReserved}</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A252C] border-[#2C3E50]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-[#BDC3C7]">Немає в наявності (SKU)</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-[#E74C3C]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#E74C3C]">{isLoading ? '...' : outOfStockCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Table Section */}
            <Card className="bg-[#1A252C] border-[#2C3E50]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Деталізація залишків та цін</CardTitle>
                        <div className="relative w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7F8C8D]" />
                            <Input
                                placeholder="Пошук по SKU або Назві..."
                                className="pl-9 bg-[#233446] border-[#304860] text-white"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // reset page on search
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-[#2C3E50] overflow-hidden overflow-x-auto">
                        <Table className="whitespace-nowrap">
                            <TableHeader className="bg-[#233446]">
                                <TableRow className="border-b-[#304860]">
                                    <TableHead className="text-[#BDC3C7] cursor-pointer" onClick={() => handleSort('sku')}>
                                        SKU {sortConfig?.key === 'sku' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead className="text-[#BDC3C7] cursor-pointer min-w-[200px]" onClick={() => handleSort('product_name')}>
                                        Назва товару {sortConfig?.key === 'product_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead className="text-[#BDC3C7]">Властивості</TableHead>
                                    <TableHead className="text-[#BDC3C7] text-right cursor-pointer" onClick={() => handleSort('purchased_price')}>
                                        Собівартість {sortConfig?.key === 'purchased_price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead className="text-[#BDC3C7] text-right cursor-pointer" onClick={() => handleSort('price')}>
                                        Ціна Пр. {sortConfig?.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead className="text-[#BDC3C7] text-right cursor-pointer" onClick={() => handleSort('quantity')}>
                                        Залишок {sortConfig?.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead className="text-[#BDC3C7] text-right cursor-pointer" onClick={() => handleSort('in_reserve')}>
                                        Резерв {sortConfig?.key === 'in_reserve' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead className="text-[#BDC3C7] text-right font-bold text-[#1ABB9C]">
                                        Доступно
                                    </TableHead>
                                    <TableHead className="text-[#BDC3C7] text-right cursor-pointer bg-[#F39C12]/10" onClick={() => handleSort('total_purchased')}>
                                        Сума (Зак.) {sortConfig?.key === 'total_purchased' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                    <TableHead className="text-[#BDC3C7] text-right cursor-pointer bg-[#3498DB]/10" onClick={() => handleSort('total_retail')}>
                                        Сума (Прод.) {sortConfig?.key === 'total_retail' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center text-[#7F8C8D]">
                                            Завантаження даних...
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedOffers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center text-[#7F8C8D]">
                                            Нічого не знайдено.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedOffers.map((offer) => {
                                        const available = (offer.quantity || 0) - (offer.in_reserve || 0);
                                        const totalPurchased = (offer.quantity || 0) * (offer.purchased_price || 0);
                                        const totalRetail = (offer.quantity || 0) * (offer.price || 0);

                                        return (
                                            <TableRow key={offer.id} className="border-b-[#2C3E50] hover:bg-[#233446]/50">
                                                <TableCell className="font-mono text-sm text-[#BDC3C7]">{offer.sku || 'N/A'}</TableCell>
                                                <TableCell className="font-medium text-white max-w-[300px] truncate" title={offer.product?.name}>
                                                    {offer.product?.name || 'Невідомий товар'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {offer.properties?.map(prop => (
                                                            <Badge key={prop.name} variant="outline" className="border-[#304860] text-[#1ABB9C] bg-[#1ABB9C]/10 whitespace-nowrap">
                                                                {prop.name}: {prop.value}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-[#BDC3C7]">{formatCurrency(offer.purchased_price || 0)}</TableCell>
                                                <TableCell className="text-right text-[#BDC3C7]">{formatCurrency(offer.price || 0)}</TableCell>
                                                <TableCell className="text-right font-bold text-white">{offer.quantity || 0}</TableCell>
                                                <TableCell className="text-right text-[#F39C12]">{offer.in_reserve || 0}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={available > 0 ? "text-[#1ABB9C] font-bold" : "text-[#E74C3C] font-bold"}>
                                                        {available}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-[#F39C12] bg-[#F39C12]/5">
                                                    {formatCurrency(totalPurchased)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-[#3498DB] bg-[#3498DB]/5">
                                                    {formatCurrency(totalRetail)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {!isLoading && filteredAndSortedOffers.length > 0 && (
                        <div className="flex items-center justify-between mt-4 text-sm text-[#BDC3C7]">
                            <div>
                                Відображення {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedOffers.length)} з {filteredAndSortedOffers.length} записів
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 bg-[#233446] border border-[#304860] rounded hover:bg-[#2C3E50] disabled:opacity-50"
                                >
                                    Попередня
                                </button>
                                <span className="px-3 py-1 bg-[#1A252C] border border-[#304860] rounded">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 bg-[#233446] border border-[#304860] rounded hover:bg-[#2C3E50] disabled:opacity-50"
                                >
                                    Наступна
                                </button>
                                <select
                                    className="ml-4 px-2 py-1 bg-[#233446] border border-[#304860] rounded text-white"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={15}>15 на сторінці</option>
                                    <option value={50}>50 на сторінці</option>
                                    <option value={100}>100 на сторінці</option>
                                </select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
