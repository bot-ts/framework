import * as app from "../app"

const command: app.Command = {
  name: "turn",
  botOwner: true,
  async run(message) {
    if (!message.content) {
      const turn = app.cache.ensure("turn", true)
      app.cache.set("turn", !turn)
    } else if (/on|off/.test(message.content)) {
      app.cache.set("turn", message.content === "on")
    } else {
      return message.channel.send(
        "C'est `on` ou `off` <:oof:672056824395988992>"
      )
    }
    const turn = app.cache.get("turn")
    return message.channel.send(
      turn
        ? "Bonjour <:haroldpeek:681598035897221182>"
        : "Au revoir <:harold:556967769304727564>"
    )
  },
}

module.exports = command
