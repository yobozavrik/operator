const fs = require('fs');
const file = 'd:/Начальник виробництва/src/app/bakery/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. imports
txt = txt.replace(
    "import Link from 'next/link';",
    "import Link from 'next/link';\nimport { useSearchParams, useRouter, usePathname } from 'next/navigation';\nimport { Suspense } from 'react';"
);

// 2. Wrap component
txt = txt.replace(
    "export default function BakeryPage() {\n    const [activeTab, setActiveTab]",
    `function BakeryDashboard() {\n    const searchParams = useSearchParams();\n    const router = useRouter();\n    const pathname = usePathname();\n    const activeTabParam = searchParams.get('tab');\n    const activeTab = (activeTabParam === 'network' || activeTabParam === 'ranking' || activeTabParam === 'catalog' || activeTabParam === 'discount' || activeTabParam === 'trend') ? activeTabParam : 'network';\n\n    const setTab = (tab: string) => {\n        const params = new URLSearchParams(searchParams.toString());\n        params.set('tab', tab);\n        router.push(\`\${pathname}?\${params.toString()}\`);\n    };`
);
txt = txt.replace(
    "    const [activeTab, setActiveTab] = useState<'network' | 'ranking' | 'trend' | 'discount' | 'catalog'>('network');\n", ""
)

// 3. Bottom Row: Tabs - Remove it!
txt = txt.replace(
    /\{\/\* Bottom Row: Tabs \*\/\}(.|\n)*?<\/div>\r?\n\s+<\/div>\r?\n\s+<\/div>\r?\n\s+\{\/\* Content Area \*\/\}/s,
    `</div>\n                        </div>\n                    </div>\n\n                    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">\n                        {/* SIDEBAR */}\n                        <div className="w-full lg:w-64 shrink-0 border-r border-panel-border bg-panel-bg/30 p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto custom-scrollbar border-b lg:border-b-0">\n                            <button onClick={() => setTab('network')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'network' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF] shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>\n                                <Activity size={18} />\n                                <span className="inline whitespace-nowrap">Мережа</span>\n                            </button>\n                            <button onClick={() => setTab('ranking')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'ranking' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF] shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>\n                                <TrendingUp size={18} />\n                                <span className="inline whitespace-nowrap">Ренкінг/ABC</span>\n                            </button>\n                            <button onClick={() => setTab('catalog')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'catalog' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF] shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>\n                                <LayoutGrid size={18} />\n                                <span className="inline whitespace-nowrap">Каталог</span>\n                            </button>\n                            <button onClick={() => setTab('discount')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'discount' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF] shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>\n                                <Percent size={18} />\n                                <span className="inline whitespace-nowrap">Здоров'я дисконту</span>\n                            </button>\n                            <button onClick={() => setTab('trend')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'trend' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF] shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>\n                                <TrendingDown size={18} />\n                                <span className="inline whitespace-nowrap">Тренди</span>\n                            </button>\n                        </div>\n\n                    {/* Content Area */}`
);

// Close out the flex-row wrapping the content area
// There's a div wrapping the 3 elements.
txt = txt.replace(
    "                    </div>\n                </div>\n            </div>\n\n            {/* MODAL / DRAWER FOR SKU STORES */}",
    "                    </div>\n                    </div>\n                </div>\n            </div>\n\n            {/* MODAL / DRAWER FOR SKU STORES */}"
);

txt += `\n\nexport default function BakeryPage() {\n    return (\n        <Suspense fallback={<div className="min-h-screen bg-bg-primary flex justify-center items-center"><Loader2 className="animate-spin text-[#00D4FF] size-8" /></div>}>\n            <BakeryDashboard />\n        </Suspense>\n    );\n}\n`;

fs.writeFileSync(file, txt);
console.log("Rewrite completed successfully!");
