const fs = require('fs');
const file = 'd:/Начальник виробництва/src/app/bakery/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Global Layout
txt = txt.replace(/min-h-screen bg-bg-primary text-text-primary/g, "min-h-screen bg-[#0B0F19] text-white selection:bg-[#2b80ff] selection:text-white");
txt = txt.replace(/bg-bg-primary\/40/g, "bg-white/5 backdrop-blur-sm");
txt = txt.replace(/bg-bg-primary\/30/g, "bg-white/5 backdrop-blur-sm");
txt = txt.replace(/bg-bg-primary/g, "bg-[#0B0F19]");

// Panels and Borders
txt = txt.replace(/bg-panel-bg\/30/g, "bg-[#0B0F19]/80 backdrop-blur-xl");
txt = txt.replace(/bg-panel-bg/g, "bg-gradient-to-br from-white/5 to-transparent");
txt = txt.replace(/border-panel-border\/50/g, "border-white/[0.05]");
txt = txt.replace(/border-panel-border/g, "border-white/10");
txt = txt.replace(/shadow-\[var\(--panel-shadow\)\]/g, "");

// Typography
txt = txt.replace(/text-text-primary/g, "text-white");
txt = txt.replace(/text-text-secondary/g, "text-slate-200");
txt = txt.replace(/text-text-muted/g, "text-slate-400");
txt = txt.replace(/text-accent-primary/g, "text-[#2b80ff]");
txt = txt.replace(/text-\[\#00D4FF\]/g, "text-[#2b80ff]");
txt = txt.replace(/from-\[\#00D4FF\]\/20/g, "from-[#2b80ff]/20");
txt = txt.replace(/border-\[\#00D4FF\]\/30/g, "border-[#2b80ff]/30");
txt = txt.replace(/hover:bg-\[\#00D4FF\]\/5/g, "hover:bg-[#2b80ff]/10");
txt = txt.replace(/bg-\[\#00D4FF\]\/10/g, "bg-[#2b80ff]/10");
txt = txt.replace(/bg-\[\#00D4FF\]/g, "bg-[#2b80ff]");

fs.writeFileSync(file, txt);
console.log("Restyled global variables!");
