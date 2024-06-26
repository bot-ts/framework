// system file, please don't modify it

import figlet from "figlet"
import boxen from "boxen"
import chalk from "chalk"

import * as app from "#app"

import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

const listener: app.Listener<"afterReady"> = {
  event: "afterReady",
  description: "Just log that bot is ready",
  once: true,
  async run() {
    app.log(
      `ok i'm ready! ${chalk.blue(
        "My default prefix is",
      )} ${chalk.bgBlueBright.black(app.env.BOT_PREFIX)}`,
    )

    figlet(app.packageJSON.name, (err, value) => {
      if (err) return app.error(err, __filename, true)

      console.log(
        boxen(chalk.blueBright(value), {
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
