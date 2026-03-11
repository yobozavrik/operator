const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const outputFilePath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\36755237-3b1a-43f7-8c2f-d0637ef2afd7\\graviton_schema_doc.md'

async function query(rawSql) {
    const sql = rawSql.replace(/;/g, '').replace(/\s+/g, ' ').trim();
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
        console.error("SQL Error:", error.message, "\nQuery:", sql);
        return [];
    }
    return data || [];
}

async function run() {
    let md = '# Graviton Schema Documentation\n\n'

    // PRIORITY TABLES
    const tables = ['production_catalog', 'distribution_shops', 'distribution_results', 'stocks_now'];
    md += '## 1. Tables\n\n'

    for (let table of tables) {
        md += `### 1.${tables.indexOf(table) + 1} graviton.${table}\n\n`;

        const cols = await query(`
            SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'graviton' AND table_name = '${table}'
            ORDER BY ordinal_position;
        `);
        md += '#### Columns\n'
        if (cols.length) {
            md += '| Name | Type | Nullable | Default | Max Length |\n'
            md += '| --- | --- | --- | --- | --- |\n'
            cols.forEach(c => {
                md += `| ${c.column_name} | ${c.data_type} | ${c.is_nullable} | ${c.column_default || 'NULL'} | ${c.character_maximum_length || '-'} |\n`;
            });
        }
        md += '\n'

        const constraints = await query(`
            SELECT tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'graviton' AND tc.table_name = '${table}'
        `);
        if (constraints.length) {
            md += '#### Constraints\n'
            constraints.forEach(c => {
                md += `- **${c.constraint_name}** (${c.constraint_type}): \`${c.column_name}\``;
                if (c.foreign_table_name) md += ` -> \`${c.foreign_table_name}.${c.foreign_column_name}\``;
                md += '\n'
            });
        }
        md += '\n'

        const indexes = await query(`
            SELECT i.relname AS index_name, a.attname AS column_name, am.amname AS index_type, pg_get_indexdef(i.oid) AS index_definition
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_am am ON i.relam = am.oid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE t.relname = '${table}' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'graviton');
        `);
        if (indexes.length) {
            md += '#### Indexes\n'
            const idxNames = new Set();
            indexes.forEach(idx => {
                if (!idxNames.has(idx.index_name)) {
                    md += `- **${idx.index_name}** (${idx.index_type}): \`${idx.index_definition}\`\n`;
                    idxNames.add(idx.index_name);
                }
            });
        }
        md += '\n'

        const sizeInfoArray = await query(`
            SELECT pg_size_pretty(pg_total_relation_size('graviton.${table}')) AS total_size,
                   pg_size_pretty(pg_table_size('graviton.${table}')) AS table_size,
                   pg_size_pretty(pg_indexes_size('graviton.${table}')) AS indexes_size,
                   (SELECT count(*) FROM graviton.${table}) AS row_count;
        `);
        if (sizeInfoArray.length) {
            const sizeInfo = sizeInfoArray[0];
            md += '#### Size Statistics\n'
            md += `- **Total Rows:** ${sizeInfo.row_count}\n`;
            md += `- **Total Size:** ${sizeInfo.total_size}\n`;
            md += `- **Table Size:** ${sizeInfo.table_size}\n`;
            md += `- **Indexes Size:** ${sizeInfo.indexes_size}\n`;
        }
        md += '\n---\n\n'
    }

    // PRIORITY VIEWS
    const views = ['distribution_base', 'v_graviton_stats_with_effective_stock', 'v_production_logic'];
    md += '## 2. Views\n\n'

    for (let view of views) {
        md += `### 2.${views.indexOf(view) + 1} graviton.${view}\n\n`;
        const viewDef = await query(`SELECT view_definition FROM information_schema.views WHERE table_schema = 'graviton' AND table_name = '${view}'`);
        if (viewDef.length) {
            md += '#### SQL Definition\n```sql\n' + viewDef[0].view_definition + '\n```\n\n'
        }

        const deps = await query(`
            SELECT DISTINCT dependent_view.relname AS view_name, source_table.relname AS depends_on, source_ns.nspname AS schema_name
            FROM pg_depend
            JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
            JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid
            JOIN pg_class AS source_table ON pg_depend.refobjid = source_table.oid
            JOIN pg_namespace AS source_ns ON source_table.relnamespace = source_ns.oid
            WHERE dependent_view.relname = '${view}' AND dependent_view.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'graviton');
        `);
        if (deps.length) {
            md += '#### Dependencies\n'
            deps.forEach(d => {
                md += `- \`${d.schema_name}.${d.depends_on}\`\n`;
            });
            md += '\n'
        }
        md += '\n---\n\n'
    }

    // PRIORITY FUNCTIONS
    const funcs = ['fn_run_distribution_v2', 'f_plan_production_1day', 'fn_orchestrate_distribution'];
    md += '## 3. Functions\n\n'

    for (let f of funcs) {
        md += `### 3.${funcs.indexOf(f) + 1} graviton.${f}\n\n`;
        const funcDef = await query(`
            SELECT p.proname AS function_name, pg_get_function_arguments(p.oid) AS arguments, pg_get_function_result(p.oid) AS return_type, p.prosecdef AS security_definer, p.provolatile AS volatility, pg_get_functiondef(p.oid) AS definition
            FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'graviton' AND p.proname = '${f}'
        `);
        if (funcDef.length) {
            const def = funcDef[0];
            md += `#### Signature\n`;
            md += `- **Arguments:** \`${def.arguments || 'None'}\`\n`;
            md += `- **Return Type:** \`${def.return_type}\`\n`;
            md += `- **Volatility:** \`${def.volatility || 'v'}\`\n`;
            md += `- **Security Definer:** \`${def.security_definer}\`\n\n`;
            md += '#### SQL Definition\n```sql\n' + def.definition + '\n```\n\n'
        } else {
            md += '*Function not found or no permission.*\n\n'
        }
        md += '\n---\n\n'
    }

    // ALL GRAVITON VIEWS TO FIND VALUES (Critical Issue)
    const allViews = await query(`SELECT table_name, view_definition FROM information_schema.views WHERE table_schema = 'graviton'`);
    const viewsWithValues = allViews.filter(v => v.view_definition && v.view_definition.toUpperCase().includes('VALUES'));


    // Cross Schema dependencies
    const crossSchema = await query(`
        SELECT DISTINCT
            v.table_schema AS view_schema,
            v.table_name AS view_name,
            vcu.table_schema AS referenced_schema,
            vcu.table_name AS referenced_table
        FROM information_schema.view_table_usage vcu
        JOIN information_schema.views v 
            ON vcu.view_schema = v.table_schema 
            AND vcu.view_name = v.table_name
        WHERE v.table_schema = 'graviton'
            AND vcu.table_schema != 'graviton'
        ORDER BY v.table_name, vcu.table_schema, vcu.table_name;
    `);

    md += '## 4. Cross-Schema Dependencies\n\n'
    if (crossSchema.length) {
        const schemaMap = {};
        crossSchema.forEach(c => {
            if (!schemaMap[c.referenced_schema]) schemaMap[c.referenced_schema] = [];
            schemaMap[c.referenced_schema].push(c);
        });
        Object.keys(schemaMap).forEach(schema => {
            md += `### External Schema: \`${schema}\`\n`;
            md += `**Referenced by Graviton Views:**\n`;
            schemaMap[schema].forEach(c => {
                md += `- \`${c.referenced_table}\` (used in \`${c.view_name}\`)\n`;
            });
            md += '\n'
        });
    }

    md += '## 5. Critical Issues\n\n'
    md += '### 5.1 Hardcoded VALUES in Views\n'
    if (viewsWithValues.length) {
        viewsWithValues.forEach(v => {
            md += `- \`graviton.${v.table_name}\`\n`;
        });
        md += '\n⚠️ These views contain hardcoded `VALUES`. Consider extracting these into a reference table to avoid hidden logic and ease maintenance.\n\n'
    } else {
        md += 'No hardcoded VALUES found in views.\n\n'
    }

    md += `### 5.2 Mismatched Inactive Shops / Uncatalogued Products
*This section requires manual review by comparing production_catalog and manufacture_items.*

## 6. Data Flow & Business Logic
*This section requires manual elaboration based on the SQL definitions above.*

`;

    fs.writeFileSync(outputFilePath, md);
    console.log("Documentation generated at", outputFilePath);
}
run();
