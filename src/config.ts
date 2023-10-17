import * as app from "../src/app.js"

export const config: app.Config = {
  async getPrefix() {
    return process.env.BOT_PREFIX!
  },
}
