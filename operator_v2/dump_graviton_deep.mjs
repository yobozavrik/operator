import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://supabase.dmytrotovstytskyi.online';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractDeepSchema() {
    let output = "# Deep Analysis of Graviton Database Schema\n\n";

    // 1. Get Tables
    console.log("Fetching tables...");
    const { data: tables, error: err1 } = await supabase.rpc('exec_sql', {
        query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'graviton' AND table_type = 'BASE TABLE'
        `
    });
    if (err1) { console.error("Error tables:", err1); return; }

    output += "## Tables\n";
    for (const t of tables) {
        output += `### ${t.table_name}\n`;
        const { data: cols, error: eCol } = await supabase.rpc('exec_sql', {
            query: `
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'graviton' AND table_name = '${t.table_name}'
            ORDER BY ordinal_position
        `});
        if (eCol) console.error("Error cols:", eCol);
        output += "| Column | Type | Default | Nullable |\n|---|---|---|---|\n";
        (cols || []).forEach(c => {
            output += `| ${c.column_name} | ${c.data_type} | ${c.column_default || ''} | ${c.is_nullable} |\n`;
        });
        output += "\n";
    }

    // 2. Get Views and their definitions
    console.log("Fetching views...");
    const { data: views, error: err2 } = await supabase.rpc('exec_sql', {
        query: `
            SELECT table_name, view_definition 
            FROM information_schema.views 
            WHERE table_schema = 'graviton' OR (table_schema = 'public' AND table_name ILIKE '%graviton%')
        `
    });
    if (err2) { console.error("Error views:", err2); return; }

    output += "## Views and Formulas\n";
    for (const v of views) {
        output += `### ${v.table_name}\n`;
        output += "```sql\n" + v.view_definition + "\n```\n\n";
    }

    // 3. Get Functions (RPCs)
    console.log("Fetching functions...");
    const { data: funcs, error: err3 } = await supabase.rpc('exec_sql', {
        query: `
            SELECT proname as function_name, pg_get_functiondef(pg_proc.oid) as definition
            FROM pg_proc
            JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
            WHERE pg_namespace.nspname = 'graviton' 
               OR (pg_namespace.nspname = 'public' AND proname ILIKE '%graviton%')
        `
    });
    if (err3) { console.error("Error funcs:", err3); return; }

    output += "## Functions (RPCs)\n";
    for (const f of funcs) {
        output += `### ${f.function_name}\n`;
        output += "```sql\n" + f.definition + "\n```\n\n";
    }

    // 4. Get Triggers
    console.log("Fetching triggers...");
    const { data: triggers, error: err4 } = await supabase.rpc('exec_sql', {
        query: `
            SELECT event_object_schema, event_object_table, trigger_name, event_manipulation, action_statement, action_timing
            FROM information_schema.triggers
            WHERE event_object_schema = 'graviton'
        `
    });
    if (err4) { console.error("Error triggers:", err4); return; }

    output += "## Triggers\n";
    if (!triggers || triggers.length === 0) {
        output += "No triggers found in the schema.\n\n";
    } else {
        for (const tr of triggers) {
            output += `### ${tr.trigger_name} (on ${tr.event_object_table})\n`;
            output += `- **Timing:** ${tr.action_timing}\n`;
            output += `- **Event:** ${tr.event_manipulation}\n`;
            output += `- **Action:** \`${tr.action_statement}\`\n\n`;
        }
    }

    fs.writeFileSync('graviton_deep_analysis.md', output, 'utf8');
    console.log("Done! Results saved to graviton_deep_analysis.md");
}

extractDeepSchema().catch(console.error);
