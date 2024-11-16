// system file, please don't modify it

import util from "node:util"

import env from "#core/env"
import { Listener } from "#core/listener"
import logger from "#core/logger"

export default new Listener({
  event: "afterReady",
  description: "Just log that bot is ready",
  once: true,
  async run() {
    logger.success(
      `ok i'm ready! ${util.styleText(
        "blue",
        "My default prefix is",
      )} ${util.styleText(
        "bold",
        util.styleText("blueBright", env.BOT_PREFIX),
      )}`,
    )
  },
})
