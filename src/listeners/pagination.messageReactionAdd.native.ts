// system file, please don't modify it

import { Listener } from "#core/listener"
import { Paginator } from "#core/pagination"

export default new Listener({
  event: "messageReactionAdd",
  description: "Handle the reactions for pagination",
  async run(reaction, user) {
    if (user.bot) return

    const paginator = Paginator.getByMessage(reaction.message)

    if (paginator) return paginator.handleReaction(reaction, user)
  },
})
