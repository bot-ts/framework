import { Button } from "#core/button.ts"
import type * as pagination from "#core/pagination.ts"

export default new Button<{
  key: pagination.PaginatorKey
}>({
  name: "pagination",
  description: "The pagination button",
  async run(interaction, { key }) {
    const app = await import("#core/pagination.ts")

    const paginator = app.Paginator.getByMessage(interaction.message)

    if (paginator) return paginator.handleInteraction(interaction, key)

    return interaction.reply({
      content: "This paginator is no longer available",
      ephemeral: true,
    })
  },
})
