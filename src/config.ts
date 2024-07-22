import { Config } from "#src/app/config.ts"
import { Options } from "discord.js"
import { z } from "zod"

export const config = new Config({
  ignoreBots: true,
  openSource: true,
  printNameOnReady: true,
  envSchema: z.object({}),
  client: {
    intents: [
      "Guilds",
      "GuildMessages",
      "GuildMessageReactions",
      "GuildMessageTyping",
      "DirectMessages",
      "DirectMessageReactions",
      "DirectMessageTyping",
      "MessageContent",
    ],
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,

      // don't cache reactions
      ReactionManager: 0,
    }),
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: {
        // every hour (in second)
        interval: 60 * 60,

        // 6 hours
        lifetime: 60 * 60 * 6,
      },
    },
  },
})

export default config.options
