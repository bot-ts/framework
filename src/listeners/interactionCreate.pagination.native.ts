import * as app from "../app.js"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "A interactionCreate listener",
  async run(interaction) {
    if (
      interaction.isButton() &&
      interaction.customId.startsWith("pagination-")
    ) {
      const paginator = app.Paginator.getByMessage(interaction.message)

      if (paginator) return paginator.handleInteraction(interaction)
    }
  },
}

export default listener
