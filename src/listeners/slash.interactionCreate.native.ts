// system file, please don't modify it

import * as app from "#app"

export default new app.Listener({
  event: "interactionCreate",
  description: "Handle the interactions for slash commands",
  async run(interaction) {
    if (!interaction.isChatInputCommand()) return

    if (!app.cache.ensure<boolean>("turn", true)) return

    const cmd = app.slashCommands.get(interaction.commandName)

    if (!cmd)
      return interaction.reply(
        await app.getSystemMessage("error", "Command not found"),
      )

    try {
      await app.prepareSlashCommand(interaction, cmd)
    } catch (error) {
      if (error instanceof Error) {
        if (!(error instanceof app.SlashCommandError))
          app.error(error, cmd.filepath!, true)

        return interaction.reply(await app.getSystemMessage("error", error))
      } else {
        return interaction.reply(
          await app.getSystemMessage(
            "error",
            "An unknown error while preparing the command",
          ),
        )
      }
    }

    try {
      await cmd.options.run.bind(interaction)(interaction)
    } catch (error: unknown) {
      let errorMessage: app.SystemMessage

      if (error instanceof Error) {
        app.error(error, cmd.filepath!, true)

        errorMessage = await app.getSystemMessage("error", error, {
          stack: true,
        })
      } else {
        errorMessage = await app.getSystemMessage(
          "error",
          "An unknown error while executing the command",
        )
      }

      if (interaction.replied || interaction.deferred) {
        interaction[interaction.replied ? "followUp" : "editReply"]({
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
})
