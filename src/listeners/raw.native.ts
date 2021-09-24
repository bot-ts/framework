import * as app from "../app.js"
import apiTypes from "discord-api-types/v8"

const listener: app.Listener<"raw"> = {
  event: "raw",
  async run({ d, t: type }) {
    if (type === "MESSAGE_REACTION_ADD" || type === "MESSAGE_REACTION_REMOVE") {
      const data = d as
        | apiTypes.GatewayMessageReactionAddDispatchData
        | apiTypes.GatewayMessageReactionRemoveDispatchData

      const channel = await this.channels.fetch(data.channel_id)

      if (!channel || !channel.isText()) return

      if (channel.messages.cache.has(data.message_id)) return

      const message = await channel.messages.fetch(data.message_id)

      const emoji = data.emoji.id
        ? `${data.emoji.name}:${data.emoji.id}`
        : (data.emoji.name as string)

      const reaction = message.reactions.resolve(emoji)

      const user = await this.users.fetch(data.user_id)

      if (reaction && user) reaction.users.cache.set(data.user_id, user)
      else
        app.error(
          `MessageReaction and User objects are undefined`,
          "raw.native"
        )

      this.emit(
        {
          MESSAGE_REACTION_ADD: "messageReactionAdd",
          MESSAGE_REACTION_REMOVE: "messageReactionRemove",
        }[type],
        reaction,
        user
      )
    }
  },
}

export default listener
