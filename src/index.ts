import Discord from "discord.js"
import dotenv from "dotenv"

dotenv.config()

for (const key of ["TOKEN", "PREFIX", "OWNER"]) {
  if (!process.env[key] || /^{{.+}}$/.test(process.env[key] as string)) {
    throw new Error(`You need to add "${key}" value in your .env file.`)
  }
}

const client = new Discord.Client()

;(async () => {
  // setup files
  await import("./app").then((app) => app.loadFiles.bind(client)())

  // start client
  client.login(process.env.TOKEN).catch(() => {
    throw new Error("Invalid Discord token given.")
  })
})().catch((error) =>
  import("./app/logger").then((logger) => logger.error(error, "system", true))
)
