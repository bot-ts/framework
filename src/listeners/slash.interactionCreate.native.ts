// system file, please don't modify it

import { Listener } from "#core/listener.ts"
import * as logger from "#core/logger.ts"
import * as slash from "#core/slash.ts"
import * as util from "#core/util.ts"

export default new Listener({
  event: "interactionCreate",
  description: "Handle the interactions for slash commands",
  async run(interaction) {
    if (!interaction.isChatInputCommand()) return

    if (!util.cache.ensure<boolean>("turn", true)) return

    const cmd = slash.slashCommands.get(interaction.commandName)

    if (!cmd)
      return interaction.reply(
        await util.getSystemMessage("error", "Command not found"),
      )

    try {
      await slash.prepareSlashCommand(interaction, cmd)
    } catch (error) {
      if (error instanceof Error) {
        if (!(error instanceof slash.SlashCommandError))
          logger.error(error, cmd.filepath!, true)

        return interaction.reply(await util.getSystemMessage("error", error))
      } else if (util.isSystemMessage(error)) {
        return interaction.reply(error)
      } else {
        return interaction.reply(
          await util.getSystemMessage(
            "error",
            "An unknown error while preparing the command",
          ),
        )
      }
    }

    try {
      await cmd.options.run.bind(interaction)(interaction)
    } catch (error: unknown) {
      let errorMessage: util.SystemMessage

      if (error instanceof Error) {
        logger.error(error, cmd.filepath!, true)

        errorMessage = await util.getSystemMessage("error", error, {
          stack: true,
        })
      } else {
        errorMessage = await util.getSystemMessage(
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
            logger.error(error, cmd!.filepath!, true)
          })
      }
    }
  },
})
