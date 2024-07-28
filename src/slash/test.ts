import * as app from "#app"

export default new app.SlashCommandGroup({
  name: "test",
  description: "The test command",
  commands: [
    new app.SlashCommand({
      name: "sub",
      description: "The sub command",
      run(interaction) {
        return interaction.base.reply({
          content: "sub command is not yet implemented.",
          ephemeral: true,
        })
      },
    }),
  ],
})
