import * as app from "#app"

const listener: app.Listener<"ready"> = {
  event: "ready",
  description: "Deploy slash commands everywhere",
  async run(client) {
    if (app.env.BOT_GUILD)
      return app.registerSlashCommands(client, app.env.BOT_GUILD)
    return app.registerSlashCommands(client)
  },
}

export default listener
