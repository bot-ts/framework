import * as app from "../app.js"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "A interactionCreate listener",
  async run(interaction) {
    if (!interaction.isCommand()) return

    // todo: use recursion to handle sub-slash-commands
    const command = app.commands.resolve(interaction.commandName)

    try {
      await command?.options.run()
    } catch (error: any) {}
  },
}

export default listener
