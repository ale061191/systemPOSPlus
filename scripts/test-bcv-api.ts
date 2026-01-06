
async function testApi() {
    try {
        console.log("Fetching from https://bcv-api.rafnixg.dev/rates/ ...")
        const res = await fetch('https://bcv-api.rafnixg.dev/rates/')
        if (!res.ok) {
            console.error("❌ API Error:", res.status, res.statusText)
            return
        }
        const data = await res.json()
        console.log("✅ API Response:", JSON.stringify(data, null, 2))
    } catch (error) {
        console.error("❌ Fetch Error:", error)
    }
}

testApi()
