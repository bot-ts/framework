import * as app from "../app.js"

export default new app.SlashCommand({
  builder: {
    name: "ping",
    description: "Ping pong command",
  },
  deploy: {
    global: false,
    guilds: [app.defaultGuild],
  },
  run: (context) => {
    context.reply("🏓 Pong")
  },
})
