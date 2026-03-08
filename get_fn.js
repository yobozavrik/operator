const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.ntmsamshfbsjxtqrdxig:QC9C9-CxocHb-jM-lHmXHEjEZV2hCOaSwgfxKLjKoEQ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function run() {
    await client.connect();

    const query = `
      SELECT 
        proname, 
        pg_get_functiondef(oid) as def 
      FROM pg_proc 
      WHERE proname IN ('fn_run_graviton_calc', 'fn_orchestrate_distribution')
   `;

    const viewQuery = `
      SELECT definition
      FROM pg_views 
      WHERE viewname = 'v_production_logic'
  `;

    try {
        const res1 = await client.query(query);
        console.log("FUNCTIONS:", res1.rows);

        const res2 = await client.query(viewQuery);
        console.log("VIEWS:", res2.rows);

    } catch (e) {
        console.log("Error:", e);
    } finally {
        await client.end();
    }
}
run();
