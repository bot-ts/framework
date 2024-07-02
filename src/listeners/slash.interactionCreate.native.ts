import * as app from "#app"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Handle interactions of slash commands",
  async run(interaction) {
    if (!interaction.isCommand()) return

    const cmd = app.slashCommands.get(interaction.commandName)

    if (!cmd)
      return interaction.reply(
        await app.getSystemMessage("error", {
          description: "Command not found",
        }),
      )

    let prepared: app.ISlashCommandInteraction

    try {
      prepared = await app.prepareSlashCommand(interaction, cmd)
    } catch (error: unknown) {
      if (error instanceof Error) {
        return interaction.reply(await app.getSystemMessage("error", { error }))
      } else {
        return interaction.reply(
          await app.getSystemMessage("error", {
            description: "An unknown error while preparing the command",
          }),
        )
      }
    }

    try {
      await cmd.options.run.bind(prepared)(prepared)
    } catch (error: unknown) {
      let errorMessage: app.SystemMessage

      if (error instanceof Error) {
        app.error(error, cmd.filepath!, true)

        errorMessage = await app.getSystemMessage("error", { error })
      } else {
        errorMessage = await app.getSystemMessage("error", {
          description: "An unknown error while executing the command",
        })
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
}

export default listener
