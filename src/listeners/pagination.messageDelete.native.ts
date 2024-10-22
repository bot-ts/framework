// system file, please don't modify it

import * as app from "#app"

const listener: app.Listener<"messageDelete"> = {
  event: "messageDelete",
  description: "Remove existing deleted paginator",
  async run(message) {
    const paginator = app.Paginator.getByMessage(message)

    if (paginator) return paginator.deactivate()
  },
}

export default listener
