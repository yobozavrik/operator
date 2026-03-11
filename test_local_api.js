async function testLocalApi() {
    try {
        const res = await fetch("http://localhost:3000/api/bakery/analytics?start_date=2026-02-24&end_date=2026-03-09");
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body length:", text.length);
        console.log("Body preview:", text.substring(0, 500));
    } catch (e) {
        console.log("Error fetching localhost:", e);
    }
}
testLocalApi();
