import * as app from "../app.js"
import { emitMessage } from '../app/core';

const listener: app.Listener<"interactionCreate"> = {
  event: "interactionCreate",
  description: "Redirect slash commands to messageCreate listener",
  async run(interaction) {
    if (!interaction.isCommand()) return
    let cmd: app.Command<any> = app.commands.resolve(interaction.commandName) as app.Command<any>
    cmd.options.run.bind(cmd)(interaction)
  },
}

export default listener
