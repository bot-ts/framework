import type { Config } from "#app"
import { Options } from "discord.js"

const config: Config = {
  ignoreBots: true,
  openSource: true,
  async getPrefix() {
    return import("#env").then(({ default: env }) => env.BOT_PREFIX)
  },
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
}

export default config
