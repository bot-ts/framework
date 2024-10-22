// system file, please don't modify it

import * as app from "#app"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Handle the interactions for buttons",
  async run(interaction) {
    if (!app.cache.ensure<boolean>("turn", true)) return

    if (!interaction.isButton()) return

    const [key, ...params] = app.decodeButtonCustomId(interaction.customId)

    const button = app.buttons.get(key)

    if (!button)
      return interaction.reply({
        ...(await app.getSystemMessage(
          "error",
          "This button is no longer available",
        )),
        ephemeral: true,
      })

    const error = await app.prepareButton(interaction as any, button)

    if (error)
      return interaction.reply({
        ...error,
        ephemeral: true,
      })

    try {
      await button.options.run.bind(interaction)(interaction as any, ...params)
    } catch (error) {
      if (error instanceof Error) {
        app.error(error, button.filepath!, true)

        return interaction.reply({
          ...(await app.getSystemMessage("error", error)),
          ephemeral: true,
        })
      } else {
        return interaction.reply({
          ...(await app.getSystemMessage(
            "error",
            "An unknown error while executing the button",
          )),
          ephemeral: true,
        })
      }
    }
  },
}

export default listener
