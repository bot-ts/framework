import client from "#core/client.ts"
import { SlashCommand } from "#core/slash.ts"

export default new SlashCommand({
  name: "ping",
  description: "Get the bot ping",
  run(interaction) {
    return interaction.reply({
      content: `Pong! \`${client.ws.ping}ms\``,
      ephemeral: true,
    })
  },
})
