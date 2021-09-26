import figlet from "figlet"
import path from "path"
import boxen from "boxen"
import chalk from "chalk"

import * as app from "../app.js"

const listener: app.Listener<"ready"> = {
  event: "ready",
  description: "Just log bot is ready",
  once: true,
  async run() {
    app.log("Ok i'm ready!")
    figlet(app.fetchPackageJson().name, (err, value) => {
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
    })
  },
}

export default listener
