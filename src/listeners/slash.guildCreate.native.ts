import * as app from "../app.js"

const listener: app.Listener<"guildCreate"> = {
  event: "guildCreate",
  description: "Deploy slash commands to the new guild",
  async run(guild) {
    return app.registerSlashCommands(guild.id)
  },
}

export default listener
