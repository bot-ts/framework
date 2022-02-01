import * as app from "../app.js"

const listener: app.Listener<"messageReactionAdd"> = {
  event: "messageReactionAdd",
  description: "Handle reaction for paginator",
  async run(reaction, user) {
    if (user.bot) return

    const paginator = app.Paginator.getByMessage(reaction.message)

    if (paginator) return paginator.handleReaction(reaction, user)
  },
}

export default listener
