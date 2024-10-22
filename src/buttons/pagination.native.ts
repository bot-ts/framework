import * as app from "#app"

export type PaginationButtonParams = [key: app.PaginatorKey]

export default new app.Button<PaginationButtonParams>({
  key: "pagination",
  description: "The pagination button",
  builder: (builder) => builder.setLabel("Pagination"),
  async run(interaction, key) {
    const paginator = app.Paginator.getByMessage(interaction.message)

    if (paginator) return paginator.handleInteraction(interaction, key)

    return interaction.reply({
      content: "This paginator is no longer available",
      ephemeral: true,
    })
  },
})
