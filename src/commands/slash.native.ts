import * as app from "../app.js"

export default new app.Command({
  name: "slash",
  description: "The slash.native command",
  channelType: "all",
  slash: new app.SlashCommandBuilder()
    .setName("slash")
    .setDescription("test slash command"),
  async run(message) {},
})
