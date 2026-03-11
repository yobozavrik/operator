
const SUPABASE_URL = 'https://supabase.dmytrotovstytskyi.online';
const SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ';

async function main() {
    try {
        console.log('--- Total Database Size ---');
        const queryTotal = "SELECT pg_size_pretty(pg_database_size(current_database())) as total_size";
        let response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: queryTotal })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

        console.log('--- Sizes by Schema ---');
        const querySchemas = `
            SELECT 
                schema_name, 
                pg_size_pretty(sum(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname)))::bigint) as schema_size
            FROM 
                (SELECT n.nspname as schemaname, c.relname 
                 FROM pg_class c 
                 JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relkind IN ('r', 'm') -- tables and matviews
                ) rels
            JOIN information_schema.schemata s ON s.schema_name = rels.schemaname
            GROUP BY schema_name
            ORDER BY sum(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname))) DESC
        `;
        response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ query: querySchemas })
        });
        console.log(JSON.stringify(await response.json(), null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
