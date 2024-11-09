// system file, please don't modify it

import { Listener } from "#core/listener.ts"
import { Paginator } from "#core/pagination.ts"

export default new Listener({
  event: "messageDelete",
  description: "Remove existing deleted paginator",
  async run(message) {
    const paginator = Paginator.getByMessage(message)

    if (paginator) return paginator.deactivate()
  },
})
