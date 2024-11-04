// system file, please don't modify it

import * as app from "#app"

export default new app.Listener({
  event: "guildCreate",
  description: "Deploy the slash commands to the new guild",
  async run(guild) {
    if (app.env.BOT_GUILD !== guild.id) return
    return app.registerSlashCommands(guild.client, guild.id)
  },
})
