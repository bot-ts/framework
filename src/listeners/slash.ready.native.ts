// system file, please don't modify it

import * as app from "#app"

export default new app.Listener({
  event: "ready",
  description: "Deploy the slash commands",
  once: true,
  async run(client) {
    if (app.env.BOT_GUILD)
      return app.registerSlashCommands(client, app.env.BOT_GUILD)
    return app.registerSlashCommands(client)
  },
})
