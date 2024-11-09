// system file, please don't modify it

import boxen from "boxen"
import figlet from "figlet"
import util from "util"

import env from "#core/env.ts"
import { Listener } from "#core/listener.ts"
import logger from "#core/logger.ts"
import { getCurrentFilename, packageJSON } from "#core/util.ts"

import config from "#config"

const __filename = getCurrentFilename(import.meta)

export default new Listener({
  event: "afterReady",
  description: "Just log that bot is ready",
  once: true,
  async run() {
    logger.success(
      `ok i'm ready! ${util.styleText(
        "blue",
        "My default prefix is",
      )} ${util.styleText(["bold", "blueBright"], env.BOT_PREFIX)}`,
    )

    if (config.printNameOnReady)
      figlet(packageJSON.name, (err, value) => {
        if (err) return logger.error(err, __filename, true)
        if (!value)
          return logger.error("No value returned from figlet", __filename, true)

        console.log(
          boxen(util.styleText("blueBright", value), {
            float: "center",
            borderStyle: {
              topLeft: " ",
              topRight: " ",
              bottomLeft: " ",
              bottomRight: " ",
              top: " ",
              left: " ",
              right: " ",
              bottom: " ",
            },
          }),
        )
      })
  },
})
