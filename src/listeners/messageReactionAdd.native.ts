import * as app from "../app"

const listener: app.Listener<"messageReactionAdd"> = {
  event: "messageReactionAdd",
  async run(reaction, user) {
    if (!user.bot) {
      const message = reaction.message
      const guild = message.guild
      if (guild) {
        const paginator = app.Paginator.getByMessage(message)
        if (paginator) {
          paginator.handleReaction(reaction, user)
        }
      }
    }
  },
}

module.exports = listener
