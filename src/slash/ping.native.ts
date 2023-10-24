import * as app from "../app.js"

export default new app.SlashCommand({
  name: "ping",
  description: "Get the bot ping",
  run(interaction) {
    return interaction.reply({
      content: `Pong! ${app.client.ws.ping}ms`,
      ephemeral: true,
    })
  },
})
