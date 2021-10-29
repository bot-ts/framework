import * as app from "../app.js"

const listener: app.Listener<"messageDelete"> = {
  event: "messageDelete",
  description: "Remove existing paginator",
  async run(message) {
    const paginator = app.StaticPaginator.getByMessage(message)

    if (paginator) return paginator.deactivate()
  },
}

export default listener
