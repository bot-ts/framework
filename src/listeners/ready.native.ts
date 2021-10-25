import figlet from "figlet"
import boxen from "boxen"
import chalk from "chalk"
import cron from "cron"

import * as app from "../app.js"

const listener: app.Listener<"ready"> = {
  event: "ready",
  description: "Just log that bot is ready",
  once: true,
  async run() {
    cron.job({
      cronTime: "",
      onTick: async () => {
        const guilds = Array.from(this.guilds.cache.values())
        const slashCommands = app.getSlashCommands()
        const restClient = app.getRestClient()

        if (!app.isFullClient(this)) return

        for (const guild of guilds) {
          await app.reloadSlashCommands(this, guild, slashCommands, restClient)
        }
      },
    })

    app.log(
      `Ok i'm ready! ${chalk.blue(
        "My default prefix is"
      )} ${chalk.bgBlueBright.black(process.env.BOT_PREFIX)}`
    )

    figlet(app.fetchPackageJson().name, (err, value) => {
      if (err) return app.error(err, "ready.native", true)

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
        })
      )
    })
  },
}

export default listener
