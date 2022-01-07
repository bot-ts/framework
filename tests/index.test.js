import { dirname } from "dirname-filename-esm"
import discord from "discord.js"
import dotenv from "dotenv"
import path from "path"

import * as command from "./command.test.js"

const __dirname = dirname(import.meta)

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const tested = new discord.Client({
  intents:
    "GUILDS,GUILD_MEMBERS,GUILD_BANS,GUILD_EMOJIS_AND_STICKERS,GUILD_INTEGRATIONS,GUILD_WEBHOOKS,GUILD_INVITES,GUILD_VOICE_STATES,GUILD_PRESENCES,GUILD_MESSAGES,GUILD_MESSAGE_REACTIONS,GUILD_MESSAGE_TYPING,DIRECT_MESSAGES,DIRECT_MESSAGE_REACTIONS,DIRECT_MESSAGE_TYPING".split(
      ","
    ),
})

const tester = new discord.Client({
  intents:
    "GUILDS,GUILD_MEMBERS,GUILD_BANS,GUILD_EMOJIS_AND_STICKERS,GUILD_INTEGRATIONS,GUILD_WEBHOOKS,GUILD_INVITES,GUILD_VOICE_STATES,GUILD_PRESENCES,GUILD_MESSAGES,GUILD_MESSAGE_REACTIONS,GUILD_MESSAGE_TYPING,DIRECT_MESSAGES,DIRECT_MESSAGE_REACTIONS,DIRECT_MESSAGE_TYPING".split(
      ","
    ),
})

const app = await import("../dist/app.js")

tested.login(process.env.BOT_TEST_TOKEN).catch((error) => {
  app.error(error, "index.test", true)
  process.exit(1)
})

tested.once("ready", () => {
  tester.login(process.env.BOT_TEST_TOKEN).catch((error) => {
    app.error(error, "index.test", true)
    process.exit(1)
  })

  tester.once("ready", async () => {
    const testedChannel = await tested.channels.cache.get(
      process.env.BOT_TEST_CHANNEL
    )
    const testerChannel = await tester.channels.cache.get(
      process.env.BOT_TEST_CHANNEL
    )

    try {
      await app.tableHandler.load(tested)
      await app.commandHandler.load(tested)
      await app.listenerHandler.load(tested)

      await command.test(app, testerChannel, testedChannel)

      app.log("Correctly works")
      process.exit(0)
    } catch (error) {
      app.error(error, "index.test", true)
      process.exit(1)
    }
  })
})
