import * as app from "../app.js"

export default new app.Command({
  name: "slashuser",
  description: "Test slashuser command",
  channelType: "all",
  async run(context) {
    console.log(context)
    return context.send("Coucou ça fonctionne le slashuser")
  },
  deploy: {
    guilds: ["781105165754433537"],
    global: false,
  },
  slash: {
    name: "Slash User",
    type: 2
  }
})
