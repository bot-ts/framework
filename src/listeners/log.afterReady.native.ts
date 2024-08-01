// system file, please don't modify it

import figlet from "figlet"
import boxen from "boxen"
import util from "util"

import * as app from "#app"

import config from "#config"

import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

const listener: app.Listener<"afterReady"> = {
  event: "afterReady",
  description: "Just log that bot is ready",
  once: true,
  async run() {
    app.success(
      `ok i'm ready! ${util.styleText(
        "blue",
        "My default prefix is",
      )} ${util.styleText(["bold", "blueBright"], app.env.BOT_PREFIX)}`,
    )

    if (config.printNameOnReady)
      figlet(app.packageJSON.name, (err, value) => {
        if (err) return app.error(err, __filename, true)
        if (!value)
          return app.error("No value returned from figlet", __filename, true)

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
}

export default listener
