const fs = require('fs');
const path = require('path');

async function migrate() {
    const rootDir = __dirname;
    const opDir = path.join(rootDir, 'operator_v2');

    // Mappings of what to move to where
    const moves = [
        {
            src: path.join(opDir, 'src/app/api/konditerka'),
            dest: path.join(rootDir, 'src/app/api/konditerka')
        },
        {
            src: path.join(opDir, 'src/app/dashboard/galya-baluvana/konditerka/page.tsx'),
            dest: path.join(rootDir, 'src/app/konditerka/page.tsx'),
            createDestFolder: true
        },
        // Components
        {
            src: path.join(opDir, 'src/components/KonditerkaPowerMatrix.tsx'),
            dest: path.join(rootDir, 'src/components/KonditerkaPowerMatrix.tsx')
        },
        {
            src: path.join(opDir, 'src/components/KonditerkaDistributionModal.tsx'),
            dest: path.join(rootDir, 'src/components/KonditerkaDistributionModal.tsx')
        },
        {
            src: path.join(opDir, 'src/components/KonditerkaProductionDetailModal.tsx'),
            dest: path.join(rootDir, 'src/components/KonditerkaProductionDetailModal.tsx')
        },
        // Production Components
        {
            src: path.join(opDir, 'src/components/production/KonditerkaProductionTabs.tsx'),
            dest: path.join(rootDir, 'src/components/production/KonditerkaProductionTabs.tsx')
        },
        {
            src: path.join(opDir, 'src/components/production/KonditerkaProductionOrderTable.tsx'),
            dest: path.join(rootDir, 'src/components/production/KonditerkaProductionOrderTable.tsx')
        },
        {
            src: path.join(opDir, 'src/components/production/KonditerkaOrderFormTable.tsx'),
            dest: path.join(rootDir, 'src/components/production/KonditerkaOrderFormTable.tsx')
        },
        {
            src: path.join(opDir, 'src/components/production/KonditerkaDistributionControlPanel.tsx'),
            dest: path.join(rootDir, 'src/components/production/KonditerkaDistributionControlPanel.tsx')
        },
        {
            src: path.join(opDir, 'src/components/production/KonditerkaProductionSimulator.tsx'),
            dest: path.join(rootDir, 'src/components/production/KonditerkaProductionSimulator.tsx')
        },
        // Analytics
        {
            src: path.join(opDir, 'src/components/analytics/KonditerkaFinancialDashboard.tsx'),
            dest: path.join(rootDir, 'src/components/analytics/KonditerkaFinancialDashboard.tsx')
        }
    ];

    for (const move of moves) {
        if (fs.existsSync(move.src)) {
            if (move.createDestFolder && !fs.existsSync(path.dirname(move.dest))) {
                fs.mkdirSync(path.dirname(move.dest), { recursive: true });
            }
            fs.cpSync(move.src, move.dest, { recursive: true });
            console.log(`Copied ${move.src} -> ${move.dest}`);
        } else {
            console.warn(`Source not found: ${move.src}`);
        }
    }
}

migrate().catch(console.error);
