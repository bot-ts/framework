import * as app from "../src/app.js"

export const config: app.Config = {
  ignoreBots: true,
  getPrefix() {
    return process.env.BOT_PREFIX!
  },
  client: {
    intents: [
      "Guilds",
      "GuildMembers",
      "GuildBans",
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
    ],
  },
}
