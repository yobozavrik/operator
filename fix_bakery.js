const fs = require('fs');
const file = 'd:/Начальник виробництва/src/app/bakery/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
    /export default function BakeryPage\(\) \{/,
    "function BakeryDashboard() {"
);

txt = txt.replace(
    /    const \[activeTab, setActiveTab\] = useState\<'network' \| 'ranking' \| 'trend' \| 'discount' \| 'catalog'\>\('network'\);/,
    `    const searchParams = useSearchParams();\n    const router = useRouter();\n    const pathname = usePathname();\n    const activeTabParam = searchParams.get('tab');\n    const activeTab = (activeTabParam === 'network' || activeTabParam === 'ranking' || activeTabParam === 'catalog' || activeTabParam === 'discount' || activeTabParam === 'trend') ? activeTabParam : 'network';\n\n    const setTab = (tab: string) => {\n        const params = new URLSearchParams(searchParams.toString());\n        params.set('tab', tab);\n        router.push(\`\${pathname}?\${params.toString()}\`);\n    };`
);

fs.writeFileSync(file, txt);
console.log("Fixed!");
