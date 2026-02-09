import ExcelJS from 'exceljs';
import { OrderItem, ProductionOrder } from '@/types/order';

export interface CategoryGroup {
    totalKg: number;
    items: Array<{
        productName: string;
        kg: number;
        minRequired: number;
        maxRecommended: number;
    }>;
}

export const groupItemsByCategory = (items: OrderItem[]) => {
    const groups: Record<string, CategoryGroup> = {};

    items.filter(item => item.kg > 0).forEach(item => {
        const cat = item.category || 'Інше';
        if (!groups[cat]) {
            groups[cat] = {
                totalKg: 0,
                items: []
            };
        }
        groups[cat].totalKg = Number((groups[cat].totalKg + item.kg).toFixed(1));

        // Aggregate by product name
        const existingProduct = groups[cat].items.find(p => p.productName === item.productName);
        if (existingProduct) {
            existingProduct.kg = Number((existingProduct.kg + item.kg).toFixed(1));
            existingProduct.minRequired = Number((existingProduct.minRequired + (item.minRequired || 0)).toFixed(1));
            existingProduct.maxRecommended = Number((existingProduct.maxRecommended + (item.maxRecommended || 0)).toFixed(1));
        } else {
            groups[cat].items.push({
                productName: item.productName,
                kg: item.kg,
                minRequired: item.minRequired || 0,
                maxRecommended: item.maxRecommended || 0
            });
        }
    });

    // Sort items by name within category
    Object.values(groups).forEach(g => {
        g.items.sort((a, b) => a.productName.localeCompare(b.productName));
    });

    return groups;
};

export const prepareWorkbook = async (orderData: ProductionOrder): Promise<ExcelJS.Workbook> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Замовлення');

    // Заголовок (УВЕЛИЧЕННАЯ ВЫСОТА)
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ВИРОБНИЧЕ ЗАМОВЛЕННЯ';
    titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;

    // Информация
    worksheet.getCell('A3').value = 'Цех:';
    worksheet.getCell('B3').value = 'ГАЛЯ БАЛУВАНА';
    worksheet.getCell('A4').value = 'Дата:';
    worksheet.getCell('B4').value = orderData.date;
    worksheet.getCell('A5').value = 'Загальна вага:';
    worksheet.getCell('B5').value = `${orderData.totalKg} кг`;

    worksheet.getCell('D4').value = '* ПЛАН (ВІД): критичний дефіцит';
    worksheet.getCell('D4').font = { italic: true, size: 9, color: { argb: 'FF808080' } };
    worksheet.getCell('D5').value = '* ПЛАН (ДО): рекомендована норма';
    worksheet.getCell('D5').font = { italic: true, size: 9, color: { argb: 'FF808080' } };

    // Заголовок таблицы
    const headerRow = worksheet.getRow(7);
    headerRow.values = ['КАТЕГОРІЯ', 'ТОВАР', 'ЗАМОВЛЕНО', 'ДІАПАЗОН (ВІД - ДО)'];
    headerRow.height = 25;

    const headerFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    } as ExcelJS.Fill;
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
    const headerAlign = { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment;

    [1, 2, 3, 4].forEach(col => {
        const cell = headerRow.getCell(col);
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = headerAlign;
    });

    // Данные
    let rowIndex = 8;
    const groupedByCategory = groupItemsByCategory(orderData.items);
    const categoryColors: Record<string, string> = {
        'ПЕЛЬМЕНІ': 'FFFFE699',
        'ВАРЕНИКИ': 'FFFFC7CE',
        'МЛІНЦІ': 'FFC6E0B4',
        'СИРНИКИ': 'FFB4C7E7',
        'ЧЕБУРЕКИ': 'FFD9D9D9',
        'КОТЛЕТИ': 'FFFFD966',
        'ГОЛУБЦІ': 'FFB7DEE8'
    };

    Object.entries(groupedByCategory).forEach(([category, data]: [string, CategoryGroup]) => {
        const categoryRow = worksheet.getRow(rowIndex);
        categoryRow.values = [category, '', data.totalKg, ''];
        categoryRow.font = { bold: true, size: 12 };

        const fillColor = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: categoryColors[category] || 'FFDDDDDD' }
        } as ExcelJS.Fill;

        [1, 2, 3, 4].forEach(col => {
            categoryRow.getCell(col).fill = fillColor;
        });

        categoryRow.alignment = { horizontal: 'left', vertical: 'middle' };
        categoryRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
        rowIndex++;

        data.items.forEach((item) => {
            const itemRow = worksheet.getRow(rowIndex);
            const range = `${Math.round(item.minRequired)} - ${Math.round(item.maxRecommended)} кг`;
            itemRow.values = ['', item.productName, `${item.kg} кг`, range];
            itemRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
            itemRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
            itemRow.getCell(4).font = { italic: true, color: { argb: 'FF595959' } };
            rowIndex++;
        });

        rowIndex++; // Пустая строка
    });

    // ИТОГОВАЯ СТРОКА
    const totalRow = worksheet.getRow(rowIndex);
    totalRow.values = ['ВСЬОГО:', '', `${orderData.totalKg} кг`, ''];
    totalRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    const totalFillColor = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF203864' }
    } as ExcelJS.Fill;

    [1, 2, 3, 4].forEach(col => {
        totalRow.getCell(col).fill = totalFillColor;
    });

    totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.height = 25;

    // Автоширина
    worksheet.columns = [
        { width: 25 },
        { width: 45 },
        { width: 18 },
        { width: 25 }
    ];

    // Границы
    worksheet.eachRow({ includeEmpty: false }, (row: ExcelJS.Row) => {
        if (row.getCell(1).value || row.getCell(2).value || row.getCell(3).value || row.getCell(4).value) {
            row.eachCell((cell: ExcelJS.Cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        }
    });

    return workbook;
};

export const generateExcel = async (orderData: ProductionOrder) => {
    const workbook = await prepareWorkbook(orderData);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Graviton_${orderData.date.replace(/\./g, '-')}.xlsx`;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    return fileName;
};

// --- DISTRIBUTION EXPORT CONTROLLER ---

interface DistributionResult {
    product_name: string;
    spot_name: string;
    quantity_to_ship: number;
    calc_time: string;
}

export const generateDistributionExcel = async (data: DistributionResult[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Розподіл');

    // 1. HEADER STYLING
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ЗВІТ ПО РОЗПОДІЛУ ПРОДУКЦІЇ';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E79' } // Dark Blue
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // 2. METADATA ROW
    worksheet.mergeCells('A2:D2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Згенеровано: ${new Date().toLocaleString('uk-UA')}`;
    dateCell.font = { italic: true, size: 10, color: { argb: 'FF595959' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // 3. TABLE HEADERS (Updated: Removed Shop column from main header as it's now a section header)
    const headerRow = worksheet.getRow(4);
    headerRow.values = ['ДАТА/ЧАС', 'ТОВАР', 'КІЛЬКІСТЬ (шт)', ''];
    // Note: We use 3 columns effectively for items now, but let's keep A,B,C mapped. 
    // Actually, let's keep the structure: A=Date, B=Product, C=Qty. D=Empty/Notes?
    // Let's refine columns: A=Date, B=Product, C=Qty. A bit wider B.

    headerRow.values = ['ДАТА/ЧАС', 'ТОВАР', 'КІЛЬКІСТЬ (шт)', ''];
    headerRow.height = 20;

    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF203864' } // Navy
        } as ExcelJS.Fill,
        alignment: { horizontal: 'center', vertical: 'middle' } as ExcelJS.Alignment,
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        } as ExcelJS.Borders
    };

    [1, 2, 3].forEach(col => {
        const cell = headerRow.getCell(col);
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    // 4. DATA ROWS (GROUPED BY SHOP)
    let rowIndex = 5;

    // Group items by Shop Name
    const groupedByShop: Record<string, DistributionResult[]> = {};
    data.forEach(item => {
        if (!groupedByShop[item.spot_name]) groupedByShop[item.spot_name] = [];
        groupedByShop[item.spot_name].push(item);
    });

    // Sort shops alphabetically
    const sortedShops = Object.keys(groupedByShop).sort();

    sortedShops.forEach((shopName) => {
        const shopItems = groupedByShop[shopName].sort((a, b) => a.product_name.localeCompare(b.product_name));

        // Separator Header for Shop
        worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
        const groupHeader = worksheet.getCell(`A${rowIndex}`);
        groupHeader.value = shopName.toUpperCase();
        groupHeader.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
        groupHeader.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDEBF7' } // Light Blue Header
        };
        groupHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        groupHeader.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
        };
        worksheet.getRow(rowIndex).height = 25;
        rowIndex++;

        // Render Items for this Shop
        shopItems.forEach((item, idx) => {
            const excelRow = worksheet.getRow(rowIndex);
            excelRow.values = [
                item.calc_time ? new Date(item.calc_time).toLocaleString('uk-UA').split(',')[1] : '-', // Time only? Or full date? Let's show Time if date is same day. Or just full string.
                item.product_name,
                item.quantity_to_ship,
                ''
            ];

            // Subtle striping
            if (idx % 2 !== 0) {
                [1, 2, 3].forEach(col => {
                    excelRow.getCell(col).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFAFAFA' } // Very subtle gray
                    };
                });
            }

            // Borders
            [1, 2, 3].forEach(col => {
                excelRow.getCell(col).border = {
                    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
                };
            });

            // Alignment
            excelRow.getCell(1).alignment = { horizontal: 'center' };
            excelRow.getCell(2).alignment = { horizontal: 'left' };
            const qtyCell = excelRow.getCell(3);
            qtyCell.alignment = { horizontal: 'center' };
            qtyCell.font = { bold: true };

            rowIndex++;
        });

        // Add empty row separator
        // rowIndex++;
    });

    // 5. COLUMN WIDTHS
    worksheet.columns = [
        { width: 15 }, // Date/Time
        { width: 45 }, // Product (Wider now since Shop is header)
        { width: 15 }, // Quantity
        { width: 10 }  // spacer
    ];

    // 6. DOWNLOAD
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Distribution_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    return fileName;
};
