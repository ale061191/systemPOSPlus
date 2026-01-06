
async function testLocalApi() {
    try {
        console.log("Fetching from http://localhost:3000/api/bcv-rates ...")
        const res = await fetch('http://localhost:3000/api/bcv-rates')
        if (!res.ok) {
            console.error("❌ API Error:", res.status, res.statusText)
            const text = await res.text()
            console.error("Response:", text)
            return
        }
        const data = await res.json()
        console.log("✅ API Response:", JSON.stringify(data, null, 2))
    } catch (error) {
        console.error("❌ Fetch Error:", error)
    }
}

testLocalApi()
