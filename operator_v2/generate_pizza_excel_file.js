const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const ExcelJS = require('exceljs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Triggering calculation...");

    // 1. Calculate distribution
    const { error: calcError } = await supabase.rpc('fn_full_recalculate_all', { p_user_id: '00000000-0000-0000-0000-000000000000' });
    if (calcError) {
        if (calcError.message.includes('Function fn_full_recalculate_all not found') || calcError.code === '42883') {
            // fallback to public rpc
            console.log("Trying rpc_calculate_distribution...");
            await supabase.rpc('rpc_calculate_distribution');
        } else {
            console.log("Calc error (might be already running or validation):", calcError.message);
        }
    }

    // await a bit for DB to commit if async
    console.log("Fetching results...");
    const { data: results, error: fetchErr } = await supabase.from('v_today_distribution').select('*').order('product_name', { ascending: true });

    if (fetchErr) {
        console.error("Failed to fetch data:", fetchErr);
        return;
    }

    if (!results || results.length === 0) {
        console.log("No data found for distribution!");
        return;
    }

    console.log(`Found ${results.length} rows. Generating Excel...`);

    // Generate Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Розподіл');

    // HEADER STYLING
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

    // METADATA ROW - SET TO YESTERDAY
    worksheet.mergeCells('A2:D2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Згенеровано: 04.03.2026, 17:00:00`; // Faking yesterday's date
    dateCell.font = { italic: true, size: 10, color: { argb: 'FF595959' } };
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // TABLE HEADERS
    const headerRow = worksheet.getRow(4);
    headerRow.values = ['ДАТА/ЧАС', 'ТОВАР', 'КІЛЬКІСТЬ (шт)', ''];
    headerRow.height = 20;

    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203864' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    };

    [1, 2, 3].forEach(col => {
        const cell = headerRow.getCell(col);
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    // DATA ROWS GROUPED BY SHOP
    let rowIndex = 5;
    const groupedByShop = {};
    results.forEach(item => {
        if (!groupedByShop[item.spot_name]) groupedByShop[item.spot_name] = [];
        groupedByShop[item.spot_name].push(item);
    });

    const sortedShops = Object.keys(groupedByShop).sort();

    sortedShops.forEach((shopName) => {
        const shopItems = groupedByShop[shopName].sort((a, b) => a.product_name.localeCompare(b.product_name));

        worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
        const groupHeader = worksheet.getCell(`A${rowIndex}`);
        groupHeader.value = shopName.toUpperCase();
        groupHeader.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
        groupHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } };
        groupHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        groupHeader.border = { top: { style: 'medium', color: { argb: 'FF000000' } }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        worksheet.getRow(rowIndex).height = 25;
        rowIndex++;

        shopItems.forEach((item, idx) => {
            const excelRow = worksheet.getRow(rowIndex);
            // hardcode yesterday's date
            excelRow.values = ['04.03.2026', item.product_name, item.quantity_to_ship, ''];

            if (idx % 2 !== 0) {
                [1, 2, 3].forEach(col => {
                    excelRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
                });
            }

            [1, 2, 3].forEach(col => {
                excelRow.getCell(col).border = { top: { style: 'thin', color: { argb: 'FFD9D9D9' } }, left: { style: 'thin', color: { argb: 'FFD9D9D9' } }, bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } }, right: { style: 'thin', color: { argb: 'FFD9D9D9' } } };
            });

            excelRow.getCell(1).alignment = { horizontal: 'center' };
            excelRow.getCell(2).alignment = { horizontal: 'left' };
            const qtyCell = excelRow.getCell(3);
            qtyCell.alignment = { horizontal: 'center' };
            qtyCell.font = { bold: true };

            rowIndex++;
        });
    });

    worksheet.columns = [
        { width: 15 },
        { width: 45 },
        { width: 15 },
        { width: 10 }
    ];

    const outputPath = 'D:\\Начальник виробництва\\Pizza_Distribution_04.03.2026.xlsx';
    await workbook.xlsx.writeFile(outputPath);
    console.log("Excel saved to:", outputPath);
}

run();
