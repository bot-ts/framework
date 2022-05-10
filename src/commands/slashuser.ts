import * as app from "../app.js"

export default new app.Command({
  name: "SlashUser",
  description: "Test slashuser command",
  channelType: "all",
  async run(context) {
    return context.send("Coucou ça fonctionne le slashuser")
  },
  slash: {
    deploy: {
      guilds: ["781105165754433537"],
      global: false,
    },
    builder: {
      name: "Slash User",
      type: 2
    }
  }
})
