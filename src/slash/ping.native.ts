import * as app from "../app.js"

export default new app.SlashCommand({
  builder: {
    name: "ping",
    description: "Ping pong command",
  },
  run: (context) => {
    return context.reply(`🏓 Pong (${Date.now() - context.createdTimestamp}ms)`)
  },
})
