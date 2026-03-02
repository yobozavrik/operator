import fs from 'fs';
import path from 'path';

const hrPaths = [
    { name: 'Співробітники', path: 'employees' },
    { name: 'Відпустки', path: 'leaves' },
    { name: 'Графік роботи', path: 'shifts' },
    { name: 'Відвідуваність', path: 'attendances' },
    { name: 'Вихідні дні та свята', path: 'holidays' },
    { name: 'Посада', path: 'designations' },
    { name: 'Відділ', path: 'departments' },
    { name: 'Відзначення', path: 'appreciations' },
    { name: 'Опитування', path: 'surveys' },
    { name: 'Активи', path: 'assets' },
    { name: 'База знань', path: 'knowledgebase' },
    { name: 'Звіт по відпусткам', path: 'leave-report' },
    { name: 'Звіт про відвідуваність', path: 'attendance-report' },
];

const recruitingPaths = [
    { name: 'Дашборд', path: 'dashboard' },
    { name: 'Вакансії', path: 'jobs' },
    { name: 'Заявки на вакансії', path: 'job-applications' },
    { name: 'Заплановані інтерв’ю', path: 'interview-schedule' },
    { name: 'Кандидати', path: 'candidate' },
    { name: 'Кар\'єрний сайт', path: 'careers' },
    { name: 'Події', path: 'events' },
];

const basePath = path.join('d:\\Начальник виробництва\\operator_v2\\src\\app\\hr');

if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
}

const generatePage = (title) => {
    return `'use client';
import React from 'react';

export default function Page() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">${title}</h1>
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
                Контент сторінки в розробці...
            </div>
        </div>
    );
}
`;
};

const createStructure = (items, prefix) => {
    items.forEach(item => {
        const fullPath = path.join(basePath, prefix, item.path);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        fs.writeFileSync(path.join(fullPath, 'page.tsx'), generatePage(item.name));
        console.log(`Created route: /hr/${prefix ? prefix + '/' : ''}${item.path}`);
    });
};

createStructure(hrPaths, '');
createStructure(recruitingPaths, 'recruit');

// Create redirect from /hr to /hr/employees
fs.writeFileSync(path.join(basePath, 'page.tsx'), `import { redirect } from 'next/navigation';

export default function HRRoot() {
    redirect('/hr/employees');
}
`);

console.log("Routing structure scaffolding complete!");
