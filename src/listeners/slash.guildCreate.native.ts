import * as app from "#app"

const listener: app.Listener<"guildCreate"> = {
  event: "guildCreate",
  description: "Deploy the slash commands to the new guild",
  async run(guild) {
    if (app.env.BOT_GUILD !== guild.id) return
    return app.registerSlashCommands(guild.client, guild.id)
  },
}

export default listener
