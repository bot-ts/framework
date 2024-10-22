import * as app from "#app"

import testButton from "#buttons/test.ts"

export default new app.Command({
  name: "test",
  description: "The test command",
  channelType: "all",
  async run(message) {
    return message.channel.send({
      content: "Test",
      components: [
        new app.ActionRowBuilder<app.MessageActionRowComponentBuilder>().setComponents(
          testButton.create(),
        ),
      ],
    })
  },
})
