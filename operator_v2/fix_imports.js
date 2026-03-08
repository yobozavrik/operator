const fs = require('fs');
const path = require('path');

const srcComponents = [
    'src/components/KonditerkaPowerMatrix.tsx',
    'src/components/KonditerkaDistributionModal.tsx',
    'src/components/KonditerkaProductionDetailModal.tsx',
    'src/components/production/KonditerkaProductionTabs.tsx',
    'src/components/production/KonditerkaProductionOrderTable.tsx',
    'src/components/production/KonditerkaOrderFormTable.tsx',
    'src/components/production/KonditerkaDistributionControlPanel.tsx',
    'src/components/production/KonditerkaProductionSimulator.tsx',
    'src/components/analytics/KonditerkaFinancialDashboard.tsx'
];

for (const p of srcComponents) {
    const filePath = path.join(__dirname, p);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');

        // Fix the import filenames to point to the new Konditerka files
        content = content
            .replace(/'\.\/ProductionOrderTable'/g, "'./KonditerkaProductionOrderTable'")
            .replace(/'\.\.\/PizzaPowerMatrix'/g, "'../KonditerkaPowerMatrix'")
            .replace(/'\.\.\/DistributionModal'/g, "'../KonditerkaDistributionModal'")
            .replace(/'\.\.\/ProductionDetailModal'/g, "'../KonditerkaProductionDetailModal'")
            .replace(/'\.\/DistributionControlPanel'/g, "'./KonditerkaDistributionControlPanel'")
            .replace(/'\.\/ProductionSimulator'/g, "'./KonditerkaProductionSimulator'")
            .replace(/'\.\.\/production\/ProductionTabs'/g, "'../production/KonditerkaProductionTabs'")
            .replace(/'\.\.\/analytics\/FinancialDashboard'/g, "'../analytics/KonditerkaFinancialDashboard'")
            .replace(/'\.\.\/PizzaPowerMatrix'/g, "'../KonditerkaPowerMatrix'")
            .replace(/'\.\/OrderFormTable'/g, "'./KonditerkaOrderFormTable'");

        fs.writeFileSync(filePath, content);
        console.log(`Fixed imports in: ${p}`);
    }
}
