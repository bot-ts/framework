import type { Config } from "#app"
import discord from "discord.js"

const config: Config = {
  ignoreBots: true,
  async getPrefix() {
    return import("#env").then((env) => env.default.BOT_PREFIX)
  },
  client: {
    intents: [
      "Guilds",
      "GuildMembers",
      "GuildModeration",
      "GuildEmojisAndStickers",
      "GuildIntegrations",
      "GuildWebhooks",
      "GuildInvites",
      "GuildVoiceStates",
      "GuildPresences",
      "GuildMessages",
      "GuildMessageReactions",
      "GuildMessageTyping",
      "DirectMessages",
      "DirectMessageReactions",
      "DirectMessageTyping",
      "MessageContent",
    ],
    makeCache: discord.Options.cacheWithLimits({
      ...discord.Options.DefaultMakeCacheSettings,

      // don't cache reactions
      ReactionManager: 0,
    }),
    sweepers: {
      ...discord.Options.DefaultSweeperSettings,
      messages: {
        // every day
        interval: 1000 * 60 * 60 * 24,

        // 3 days
        lifetime: 1000 * 60 * 60 * 24 * 3,
      },
    },
  },
}

export default config
