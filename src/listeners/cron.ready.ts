// system file, please don't modify it

import * as app from "#app"
import logger from "#logger"

/**
 * See the {@link https://ghom.gitbook.io/bot.ts/usage/create-a-listener listener guide} for more information.
 */
export default new app.Listener({
  event: "ready",
  description: "Launch all cron jobs",
  async run() {
    for (const cron of app.cronList.values()) {
      cron.start()
    }

    logger.success("All cron jobs launched")
  },
})
