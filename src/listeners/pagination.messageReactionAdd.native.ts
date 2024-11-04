// system file, please don't modify it

import * as app from "#app"

export default new app.Listener({
  event: "messageReactionAdd",
  description: "Handle the reactions for pagination",
  async run(reaction, user) {
    if (user.bot) return

    const paginator = app.Paginator.getByMessage(reaction.message)

    if (paginator) return paginator.handleReaction(reaction, user)
  },
})
