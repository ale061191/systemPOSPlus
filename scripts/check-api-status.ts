
async function checkApi() {
    try {
        console.log("Testing connection to https://bcv-api.rafnixg.dev/rates/ ...")
        const start = Date.now()
        const res = await fetch('https://bcv-api.rafnixg.dev/rates/')
        const duration = Date.now() - start

        if (res.ok) {
            console.log(`✅ API is UP (Status: ${res.status}). Response time: ${duration}ms`)
            const data = await res.json()
            console.log("Data sample:", JSON.stringify(data))
        } else {
            console.error(`❌ API Error: ${res.status} ${res.statusText}`)
        }
    } catch (err) {
        console.error("❌ Network Error:", err)
    }
}
checkApi()
