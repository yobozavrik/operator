import fs from 'fs';

const raw = fs.readFileSync('graviton_schema_dump.json', 'utf8');
const schema = JSON.parse(raw);

let md = "# Graviton Supabase Schema Analysis\n\n";

if (schema.definitions) {
    md += "## Tables / Views\n\n";
    for (const [entityName, entity] of Object.entries(schema.definitions)) {
        md += `### \`${entityName}\`\n`;
        if (entity.description) md += `${entity.description}\n\n`;

        md += "| Column | Type | Description | Format |\n";
        md += "| :--- | :--- | :--- | :--- |\n";

        if (entity.properties) {
            for (const [colName, col] of Object.entries(entity.properties)) {
                md += `| \`${colName}\` | \`${col.type || 'unknown'}\` | ${col.description || ''} | ${col.format || ''} |\n`;
            }
        }
        md += "\n";
    }
}

if (schema.paths) {
    md += "## Functions (RPCs)\n\n";
    for (const [path, methods] of Object.entries(schema.paths)) {
        if (path.startsWith('/rpc/')) {
            const funcName = path.replace('/rpc/', '');
            md += `### \`${funcName}\`\n`;
            if (methods.post) {
                if (methods.post.summary) md += `**Summary:** ${methods.post.summary}\n\n`;
                if (methods.post.parameters) {
                    md += "**Parameters:**\n";
                    methods.post.parameters.forEach(p => {
                        if (p.in !== 'header' && p.in !== 'query' && p.name !== 'Prefer') {
                            md += `- \`${p.name}\` (${p.in}): ${p.description || ''}\n`;
                        }
                    });
                    md += "\n";
                }
            }
        }
    }
}

fs.writeFileSync('graviton_analysis_temp.md', md, 'utf8');
console.log('Saved graviton_analysis_temp.md');
