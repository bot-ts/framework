import * as app from "../app"

const listener: app.Listener<"messageDelete"> = {
  event: "messageDelete",
  async run(message) {
    const paginator = app.Paginator.getByMessage(message)

    if (paginator) return paginator.deactivate()
  },
}

module.exports = listener
