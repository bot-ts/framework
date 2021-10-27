import * as app from "../app.js"

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Redirect slash commands to messageCreate listener",
  async run(interaction) {
    if (!interaction.isCommand() || !interaction.isMessageComponent()) return
    this.emit("messageCreate", interaction.message as app.Message)
    console.log(interaction.message)
  },
}

export default listener
