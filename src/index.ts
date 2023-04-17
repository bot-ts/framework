import { filename } from "dirname-filename-esm"

import * as logger from "./app/logger.js"

const __filename = filename(import.meta)

import "dotenv/config.js"

for (const key of ["BOT_TOKEN", "BOT_PREFIX"]) {
  if (!process.env[key] || /^{{.+}}$/.test(process.env[key] as string)) {
    throw new Error(`You need to add "${key}" value in your .env file.`)
  }
}

const { default: client } = await import("./app/client.js")

const app = await import("./app.js")

client.login(process.env.BOT_TOKEN).catch((err) => {
  logger.error("The Discord client can't connect...", __filename)
  throw err
})

try {
  await app.tableHandler.load()
  await app.commandHandler.load()
  await app.listenerHandler.load()
} catch (error: any) {
  app.error(error, __filename, true)
  process.exit(1)
}
