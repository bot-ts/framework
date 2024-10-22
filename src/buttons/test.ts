import * as app from "#app"

export type TestButtonParams = []

export default new app.Button<TestButtonParams>({
  key: "test",
  description: "The test button",
  builder: (builder) => builder.setLabel("Test"),
  async run(interaction) {
    await interaction.deferUpdate()
    await interaction.followUp({
      content: "You clicked the test button!",
      ephemeral: true,
    })
  },
})
