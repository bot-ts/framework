import * as app from "#app"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Handle interactions of slash commands",
  async run(interaction) {
    if (!interaction.isCommand()) return

    const cmd = app.slashCommands.get(interaction.commandName)

    if (!cmd) return interaction.reply("Command not found")

    const prepared = await app.prepareSlashCommand(interaction, cmd)

    if (prepared instanceof app.EmbedBuilder)
      return interaction.reply({ embeds: [prepared] }).catch()

    if (!prepared) return

    try {
      await cmd.options.run.bind(prepared)(prepared)
    } catch (error: any) {
      app.error(error, cmd.filepath!, true)

      const errorMessage = await app.getSystemMessage("error", { error })

      if (interaction.replied || interaction.deferred) {
        interaction.followUp({
          ...errorMessage,
          ephemeral: true,
        })
      } else {
        interaction
          .reply({
            ...errorMessage,
            ephemeral: true,
          })
          .catch((error) => {
            app.error(error, cmd!.filepath!, true)
          })
      }
    }
  },
}

export default listener
