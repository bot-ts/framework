import * as app from "../app"

const command: app.Command = {
  name: "test",
  aliases: ["?", "debug", "catch"],
  description: "Testing command for debug.",
  positional: [
    {
      name: "expected",
    },
  ],
  args: [
    {
      name: "array",
      castValue: "array",
    },
    {
      name: "number",
      castValue: "number",
    },
    {
      name: "regex",
      castValue: "regex",
    },
    {
      name: "boolean",
      castValue: "boolean",
    },
  ],
  async run(message) {
    await message.reply(
      new app.MessageEmbed()
        .setTitle("Command debugging")
        .setDescription(
          `content: ${app.CODE.stringify({
            content: message.content,
          })}rest: ${app.CODE.stringify({
            content: message.rest,
          })}`
        )
        .addField(
          "args",
          app.CODE.stringify({
            content: JSON.stringify(message.args, null, 2),
            lang: "json",
          }),
          true
        )
        .addField(
          "positional",
          app.CODE.stringify({
            content: JSON.stringify(
              Object.fromEntries(Object.entries(message.positional)),
              null,
              2
            ),
            lang: "json",
          }),
          true
        )
    )
  },
  subs: [
    {
      name: "sub",
      aliases: ["sb"],
      description: "Just a sub command",
      async run(message) {
        return message.channel.send("I'm a sub command!")
      },
    },
  ],
}

module.exports = command
