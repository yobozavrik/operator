import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('streamline_dashboard.html', 'utf-8');
const $ = cheerio.load(html);

console.log("=== Text Content ===");
// Only grab visible text that is longer than 5 chars to avoid noise
$('body').find('*').each((i, el) => {
    // skip script and style tags
    if (el.tagName.toLowerCase() === 'script' || el.tagName.toLowerCase() === 'style') return;

    // get text of this specific element (not its children)
    const text = $(el).contents().filter((_, node) => node.type === 'text').text().trim().replace(/\s+/g, ' ');
    if (text && text.length > 5) {
        console.log(`- ${text}`);
    }
});
