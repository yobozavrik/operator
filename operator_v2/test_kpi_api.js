const fs = require('fs');
async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/galya-baluvana/finance/kpi?startDate=2025-01-01&endDate=2025-01-31', {
            headers: {
                // Assuming we have a valid session cookie or we can just test the function directly if auth-guard allows bypassing in some way.
                // Ah, the API requires auth. I will modify the route temporarily to bypass auth for testing, or write a server-side test script.
            }
        });
        const text = await res.text();
        console.log(text);
    } catch (e) {
        console.error(e);
    }
}
test();
