import * as app from "./app.js"

export const config: app.Config = {
  ignoreBots: true,
  getPrefix() {
    return process.env.BOT_PREFIX!
  },
  client: {
    intents: [
      app.IntentsBitField.Flags.Guilds,
      app.IntentsBitField.Flags.GuildMembers,
      app.IntentsBitField.Flags.GuildModeration,
      app.IntentsBitField.Flags.GuildEmojisAndStickers,
      app.IntentsBitField.Flags.GuildIntegrations,
      app.IntentsBitField.Flags.GuildWebhooks,
      app.IntentsBitField.Flags.GuildInvites,
      app.IntentsBitField.Flags.GuildVoiceStates,
      app.IntentsBitField.Flags.GuildPresences,
      app.IntentsBitField.Flags.GuildMessages,
      app.IntentsBitField.Flags.GuildMessageReactions,
      app.IntentsBitField.Flags.GuildMessageTyping,
      app.IntentsBitField.Flags.DirectMessages,
      app.IntentsBitField.Flags.DirectMessageReactions,
      app.IntentsBitField.Flags.DirectMessageTyping,
      app.IntentsBitField.Flags.MessageContent,
    ],
    makeCache: app.Options.cacheWithLimits({
      ...app.Options.DefaultMakeCacheSettings,

      // don't cache reactions
      ReactionManager: 0,
    }),
    sweepers: {
      ...app.Options.DefaultSweeperSettings,
      messages: {
        // every day
        interval: 1000 * 60 * 60 * 24,

        // 3 days
        lifetime: 1000 * 60 * 60 * 24 * 3,
      },
    },
  },
}
