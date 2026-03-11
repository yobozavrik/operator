
const POSTER_TOKEN = "772658:19313264c995ef146ec6902269a91901"; // Hardcoded for debugging since bot has it
const SUPABASE_URL = "https://dmytrotovstytskyi.supabase.co";
const SUPABASE_KEY = "dummy"; // I will use curl for supabase if possible or just check Poster first

async function checkPoster() {
    console.log("\n--- Poster Storages ---");
    const resp = await fetch(`https://galia-baluvana34.joinposter.com/api/storage.getStorages?token=${POSTER_TOKEN}`);
    const data = await resp.json();
    if (data.response) {
        const storages = data.response.map(s => ({ id: s.storage_id, name: s.storage_name }));
        console.table(storages);
    } else {
        console.error("Poster error:", data);
    }
}

checkPoster();
