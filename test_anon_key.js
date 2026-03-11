// Test POST to Supabase using ANON KEY
async function test() {
    console.log("Testing auth perms with ANON KEY for f_craft_get_network_metrics");
    const anonKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzI0OTcwMCwiZXhwIjo0OTE4OTIzMzAwLCJyb2xlIjoiYW5vbiJ9.PJ-feVraUpYtvUWqDYrNGafyNRRqCSCM35tAVQCrztw";

    const res1 = await fetch("https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/f_craft_get_network_metrics", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": anonKey,
            "Authorization": `Bearer ${anonKey}`
        },
        body: JSON.stringify({ p_start_date: "2026-02-24", p_end_date: "2026-03-09" })
    });

    console.log("Network status:", res1.status);
    console.log("Network error:", await res1.text());

    console.log("Testing f_craft_get_store_ranking...");
    const res2 = await fetch("https://supabase.dmytrotovstytskyi.online/rest/v1/rpc/f_craft_get_store_ranking", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": anonKey,
            "Authorization": `Bearer ${anonKey}`
        },
        body: JSON.stringify({ p_start_date: "2026-02-24", p_end_date: "2026-03-09" })
    });
    console.log("Ranking status:", res2.status);
    console.log("Ranking body:", await res2.text());
}

test();
