// system file, please don't modify it

import { cronList } from "#core/cron"
import { Listener } from "#core/listener"
import logger from "#core/logger"

/**
 * See the {@link https://ghom.gitbook.io/bot.ts/usage/create-a-listener listener guide} for more information.
 */
export default new Listener({
	event: "clientReady",
	description: "Launch all cron jobs",
	once: true,
	async run() {
		let launched = 0

		for (const cron of cronList.values()) {
			try {
				cron.start()
				launched++
			} catch (error) {
				if (typeof error === "string" || error instanceof Error)
					logger.error(error, cron.filepath, true)
				else
					logger.error(
						"an error occurred while starting the cron job",
						cron.filepath,
					)
			}
		}

		if (launched > 0) {
			logger.log(`launched ${launched} cron jobs`)
			if (cronList.size > launched)
				logger.error(`failed to launch ${cronList.size - launched} cron jobs`)
		} else if (cronList.size > 0) logger.log("failed to launch any cron jobs")
	},
})
