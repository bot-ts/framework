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
      guilds: ["1111111111"],
      global: false,
    },
    builder: {
      name: "Slash User",
      type: 2,
    },
  },
})
