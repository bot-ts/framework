import figlet from "figlet"
import path from "path"
import boxen from "boxen"
import chalk from "chalk"

import * as app from "../app"

const listener: app.Listener<"ready"> = {
  event: "ready",
  once: true,
  async run() {
    app.log("Ok i'm ready!", "system")
    figlet(
      require(path.join(process.cwd(), "package.json")).name,
      (err, value) => {
        if (err) return
        console.log(
          boxen(chalk.blueBright(value), {
            float: "center",
            borderStyle: {
              topLeft: " ",
              topRight: " ",
              bottomLeft: " ",
              bottomRight: " ",
              horizontal: " ",
              vertical: " ",
            },
          })
        )
      }
    )
  },
}

module.exports = listener
