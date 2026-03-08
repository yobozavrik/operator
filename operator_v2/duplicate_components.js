const fs = require('fs');
const path = require('path');

const srcComponents = [
    'src/components/PizzaPowerMatrix.tsx',
    'src/components/DistributionModal.tsx',
    'src/components/ProductionDetailModal.tsx',
    'src/components/production/ProductionTabs.tsx',
    'src/components/production/ProductionOrderTable.tsx',
    'src/components/production/OrderFormTable.tsx',
    'src/components/production/DistributionControlPanel.tsx',
    'src/components/production/ProductionSimulator.tsx',
    'src/components/analytics/FinancialDashboard.tsx'
];

// Target directories (already exist or we create)
const targets = {
    'src/components/PizzaPowerMatrix.tsx': 'src/components/KonditerkaPowerMatrix.tsx',
    'src/components/DistributionModal.tsx': 'src/components/KonditerkaDistributionModal.tsx',
    'src/components/ProductionDetailModal.tsx': 'src/components/KonditerkaProductionDetailModal.tsx',
    'src/components/production/ProductionTabs.tsx': 'src/components/production/KonditerkaProductionTabs.tsx',
    'src/components/production/ProductionOrderTable.tsx': 'src/components/production/KonditerkaProductionOrderTable.tsx',
    'src/components/production/OrderFormTable.tsx': 'src/components/production/KonditerkaOrderFormTable.tsx',
    'src/components/production/DistributionControlPanel.tsx': 'src/components/production/KonditerkaDistributionControlPanel.tsx',
    'src/components/production/ProductionSimulator.tsx': 'src/components/production/KonditerkaProductionSimulator.tsx',
    'src/components/analytics/FinancialDashboard.tsx': 'src/components/analytics/KonditerkaFinancialDashboard.tsx'
};

const componentsDir = path.join(__dirname, 'src', 'components');

for (const [src, dst] of Object.entries(targets)) {
    const srcPath = path.join(__dirname, src);
    const dstPath = path.join(__dirname, dst);

    if (fs.existsSync(srcPath)) {
        let content = fs.readFileSync(srcPath, 'utf-8');

        // Transform the content internally to rename imports and API paths
        content = content
            .replace(/\/api\/pizza/g, '/api/konditerka')
            .replace(/PizzaPowerMatrix/g, 'KonditerkaPowerMatrix')
            .replace(/DistributionModal/g, 'KonditerkaDistributionModal')
            .replace(/ProductionDetailModal/g, 'KonditerkaProductionDetailModal')
            .replace(/ProductionTabs/g, 'KonditerkaProductionTabs')
            .replace(/ProductionOpsTable/g, 'KonditerkaProductionOpsTable')
            .replace(/OrderFormTable/g, 'KonditerkaOrderFormTable')
            .replace(/DistributionControlPanel/g, 'KonditerkaDistributionControlPanel')
            .replace(/ProductionSimulator/g, 'KonditerkaProductionSimulator')
            .replace(/FinancialDashboard/g, 'KonditerkaFinancialDashboard')
            .replace(/transformPizzaData/g, 'transformKonditerkaData')
            .replace(/Піца/g, 'Кондитерка')
            .replace(/піца/g, 'кондитерка')
            .replace(/піци/g, 'кондитерки')
            .replace(/ПІЦА/g, 'КОНДИТЕРКА')
            .replace(/Pizza/g, 'Konditerka')
            .replace(/pizza/gi, 'konditerka');

        fs.writeFileSync(dstPath, content);
        console.log(`Copied and transformed: ${src} -> ${dst}`);
    } else {
        console.log(`Missing src: ${srcPath}`);
    }
}

// Now we need to update the Konditerka page to use the newly transformed components
const pagePath = path.join(__dirname, 'src/app/dashboard/galya-baluvana/konditerka/page.tsx');
if (fs.existsSync(pagePath)) {
    let pageContent = fs.readFileSync(pagePath, 'utf-8');
    pageContent = pageContent
        .replace(/@\/components\/analytics\/FinancialDashboard/g, '@/components/analytics/KonditerkaFinancialDashboard')
        .replace(/@\/components\/production\/ProductionTabs/g, '@/components/production/KonditerkaProductionTabs')
        .replace(/<FinancialDashboard \/>/g, '<KonditerkaFinancialDashboard />')
        .replace(/ProductionTabs data=/g, 'KonditerkaProductionTabs data=');

    fs.writeFileSync(pagePath, pageContent);
    console.log(`Updated Konditerka page imports.`);
}
