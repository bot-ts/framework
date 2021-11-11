import * as app from "../app.js"

export default new app.Command({
  name: "slash2",
  description: "The slash.native command",
  channelType: "all",
  isSlash: true,
  guildSlash: "781105165754433537",
  async run(message) {
    // todo: code here
    return message.send("slash.native command is not yet implemented.")
  }
})