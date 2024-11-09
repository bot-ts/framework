// system file, please don't modify it

import * as button from "#core/button"
import { Listener } from "#core/listener"
import logger from "#core/logger"
import * as util from "#core/util"

export default new Listener({
  event: "interactionCreate",
  description: "Handle the interactions for buttons",
  async run(interaction) {
    if (!util.cache.ensure<boolean>("turn", true)) return

    if (!interaction.isButton()) return

    const [key, params] = button.decodeButtonCustomId(interaction.customId)

    const btn = button.buttons.get(key)

    if (!btn)
      return interaction.reply({
        ...(await util.getSystemMessage(
          "error",
          "This button is no longer available",
        )),
        ephemeral: true,
      })

    const error = await button.prepareButton(interaction as any, btn)

    if (error)
      return interaction.reply({
        ...error,
        ephemeral: true,
      })

    try {
      await btn.options.run.bind(interaction)(interaction as any, params)
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error, btn.filepath!, true)

        return interaction.reply({
          ...(await util.getSystemMessage("error", error)),
          ephemeral: true,
        })
      } else {
        return interaction.reply({
          ...(await util.getSystemMessage(
            "error",
            "An unknown error while executing the button",
          )),
          ephemeral: true,
        })
      }
    }
  },
})
