import ExcelJS from 'exceljs';

export const groupItemsByCategory = (items: any[]) => {
    const groups: Record<string, { totalKg: number; items: any[] }> = {};

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

export const prepareWorkbook = async (orderData: any): Promise<ExcelJS.Workbook> => {
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
    worksheet.getCell('B3').value = 'GRAVITON';
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

    Object.entries(groupedByCategory).forEach(([category, data]: [string, any]) => {
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

        data.items.forEach((item: any) => {
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
    worksheet.eachRow({ includeEmpty: false }, (row) => {
        if (row.getCell(1).value || row.getCell(2).value || row.getCell(3).value || row.getCell(4).value) {
            row.eachCell((cell) => {
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

export const generateExcel = async (orderData: any) => {
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
