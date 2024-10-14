// system file, please don't modify it

import * as app from "#app"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Handle interactions for pagination",
  async run(interaction) {
    if (!app.cache.ensure<boolean>("turn", true)) return

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("pagination-")
    ) {
      const paginator = app.Paginator.getByMessage(interaction.message)

      if (paginator) return paginator.handleInteraction(interaction)

      return interaction.reply({
        content: "This paginator is no longer available",
        ephemeral: true,
      })
    }
  },
}

export default listener
