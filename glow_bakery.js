const fs = require('fs');
const file = 'd:/Начальник виробництва/src/app/bakery/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Inject group class
txt = txt.replace(
    'bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5 rounded-2xl flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-shadow',
    'bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5 rounded-2xl flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow'
);
txt = txt.replace(
    'bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-shadow',
    'bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow'
);
txt = txt.replace(
    'bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-shadow',
    'bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow'
);
txt = txt.replace(
    'bg-[#2b80ff]/5 border border-[#2b80ff]/20 p-5 rounded-2xl flex flex-col relative overflow-hidden justify-between shadow-sm hover:shadow-md transition-shadow',
    'bg-[#2b80ff]/5 border border-[#2b80ff]/20 p-5 rounded-2xl flex flex-col relative overflow-hidden group justify-between shadow-sm hover:shadow-md transition-shadow'
);

// Inject absolute glowing div after the opening tags
// Card 1
txt = txt.replace(
    /(flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">\s+)<div className="text-\[10px\] uppercase font-bold text-slate-400 tracking-widest font-display mb-2">Привезено \(шт\)<\/div>/,
    '$1<div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-all"></div>\n<div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-display mb-2 relative z-10">Привезено (шт)</div>'
);
// Card 2
txt = txt.replace(
    /(flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">\s+)<div className="text-\[10px\] uppercase font-bold text-emerald-500 tracking-widest font-display mb-2">Продано Фреш & Дисконт<\/div>/,
    '$1<div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>\n<div className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest font-display mb-2 relative z-10">Продано Фреш & Дисконт</div>'
);
// Card 3
txt = txt.replace(
    /(flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">\s+)<div className="text-\[10px\] uppercase font-bold text-red-500 tracking-widest font-display mb-2">Списано в Мусор<\/div>/,
    '$1<div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>\n<div className="text-[10px] uppercase font-bold text-red-500 tracking-widest font-display mb-2 relative z-10">Списано в Мусор</div>'
);
// Card 4
txt = txt.replace(
    /(flex flex-col relative overflow-hidden group justify-between shadow-sm hover:shadow-md transition-shadow">\s+<div>\s+)<div className="text-\[10px\] uppercase font-bold text-\[\#2b80ff\] tracking-widest font-display mb-3">Дисципліна Цеху<\/div>/,
    '$1<div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2b80ff]/10 rounded-full blur-2xl group-hover:bg-[#2b80ff]/20 transition-all"></div>\n<div className="text-[10px] uppercase font-bold text-[#2b80ff] tracking-widest font-display mb-3 relative z-10">Дисципліна Цеху</div>'
);

// Add z-index where needed for text to bypass the absolute overlay
txt = txt.replace(/text-3xl font-bold font-\[family-name:var\(--font-jetbrains\)\]/g, 'text-3xl font-bold font-[family-name:var(--font-jetbrains)] relative z-10');

// Also update the header layout to include the blue gradient
txt = txt.replace(
    /<div className="w-12 h-12 rounded-xl bg-orange-500\/10 border border-orange-500\/30 flex items-center justify-center shrink-0 shadow-\[0_0_15px_rgba\(249,115,22,0\.1\)\]">/,
    '<div className="w-12 h-12 rounded-xl bg-[#2b80ff]/10 border border-[#2b80ff]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(43,128,255,0.15)]">'
);
txt = txt.replace(
    /<Store className="text-orange-500" size=\{24\} \/>/,
    '<Store className="text-[#2b80ff]" size={24} />'
);

// Make the Live Data badge look cool 
txt = txt.replace(/bg-emerald-500\/10 text-emerald-500 border border-emerald-500\/20 uppercase shadow-\[0_0_10px_rgba\(16,185,129,0\.1\)\]/g, "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-[family-name:var(--font-jetbrains)]");

// Make the tabs more finance styled font
txt = txt.replace(/text-xs font-bold uppercase rounded-xl transition-all font-display tracking-widest/g, "text-xs font-bold uppercase tracking-wider rounded-md transition-all font-[family-name:var(--font-jetbrains)]");
txt = txt.replace(/bg-gradient-to-r from-\[\#2b80ff\]\/20 to-transparent border border-\[\#2b80ff\]\/30 text-\[\#2b80ff\] shadow-sm/g, "bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 rounded-lg");

fs.writeFileSync(file, txt);
console.log('Injected glowing overlays successfully!');
