// system file, please don't modify it

import * as app from "#app"

export default new app.Listener({
  event: "messageDelete",
  description: "Remove existing deleted paginator",
  async run(message) {
    const paginator = app.Paginator.getByMessage(message)

    if (paginator) return paginator.deactivate()
  },
})
