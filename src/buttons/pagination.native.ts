import * as button from "#src/app/button.ts"
import type * as pagination from "#src/app/pagination.ts"

export default new button.Button<{
  key: pagination.PaginatorKey
}>({
  key: "pagination",
  description: "The pagination button",
  async run(interaction, { key }) {
    const app = await import("#app")

    const paginator = app.Paginator.getByMessage(interaction.message)

    if (paginator) return paginator.handleInteraction(interaction, key)

    return interaction.reply({
      content: "This paginator is no longer available",
      ephemeral: true,
    })
  },
})
