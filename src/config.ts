import * as app from "../src/app.js"

export const config: app.Config = {
  async getPrefix(message) {
    return process.env.BOT_PREFIX ?? "/"
  },
}
