import { Options, Partials } from "discord.js"
import { z } from "zod"
import { Config } from "#core/config"

export const config = new Config({
	ignoreBots: true,
	openSource: true,
	envSchema: z.object({}),
	permissions: ["Administrator"],
	client: {
		intents: [
			"Guilds",
			"GuildMessages",
			"GuildMessageReactions",
			"GuildMessageTyping",
			"DirectMessages",
			"DirectMessageReactions",
			"DirectMessageTyping",
			"MessageContent",
		],
		partials: [Partials.Channel],
		makeCache: Options.cacheWithLimits({
			...Options.DefaultMakeCacheSettings,

			// don't cache reactions
			ReactionManager: 0,
		}),
		sweepers: {
			...Options.DefaultSweeperSettings,
			messages: {
				// every hour (in second)
				interval: 60 * 60,

				// 6 hours
				lifetime: 60 * 60 * 6,
			},
		},
	},
})

export default config.options
