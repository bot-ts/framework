// system file, please don't modify it

import * as app from "#app"

const listener: app.Listener<"messageReactionAdd"> = {
  event: "messageReactionAdd",
  description: "Handle reactions for pagination",
  async run(reaction, user) {
    if (user.bot) return

    const paginator = app.Paginator.getByMessage(reaction.message)

    if (paginator) return paginator.handleReaction(reaction, user)
  },
}

export default listener
