
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

console.log("Environment Keys:", Object.keys(process.env).filter(k => k.includes("URL") || k.includes("DB") || k.includes("KEY") || k.includes("POSTGRES")))
