import * as app from "#app"

export default new app.SlashCommand({
  name: "ping",
  description: "Get the bot ping",
  run(interaction) {
    return interaction.reply({
      content: `Pong! \`${app.ClientSingleton.get().ws.ping}ms\``,
      ephemeral: true,
    })
  },
})
