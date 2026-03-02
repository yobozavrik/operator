import fs from 'fs';

const html = fs.readFileSync('d:\\Начальник виробництва\\grade_app_source.html', 'utf-8');

const matches = [...html.matchAll(/<a[^>]*href="([^"]+)"[^\>]*>(.*?)<\/a>/gis)];

console.log("Found menu items:");
let skip = false;
matches.forEach(m => {
    let cleanText = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanText.length > 0 && cleanText.length < 50 && !m[1].includes('javascript:')) {
        // Output all of them to see the full set. We are specifically looking for HR / Recruiting items
        if (cleanText.includes("Дашборд") || cleanText.includes("HR") || cleanText.includes("Рекрутинг") || cleanText.includes("Фінанси")) {
            console.log("----");
        }
        console.log(`- ${cleanText} : ${m[1]}`);
    }
});
