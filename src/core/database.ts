import pg from "pg"

import * as orm from "@ghom/orm"
import config from "#config"
import env from "#core/env"
import * as logger from "#core/logger"
import * as util from "#core/util"

setTypeParsers()

const client = new orm.ORM({
	tableLocation: util.srcPath("tables"),
	backups: {
		location: util.rootPath("data", "backups"),
	},
	database: {
		client: "pg",
		useNullAsDefault: true,
		connection: {
			port: env.DB_PORT ?? 5432,
			host: env.DB_HOST ?? "127.0.0.1",
			user: env.DB_USER ?? "postgres",
			password: env.DB_PASSWORD,
			database: env.DB_DATABASE ?? "postgres",

			timezone: env.BOT_TIMEZONE || "UTC",
		},
	},
	logger,
	caching: config.ormCaching,
})

export default client

function setTypeParsers() {
	const int = (value: string) => Number.parseInt(value)
	const float = (value: string) => Number.parseFloat(value)

	pg.types.setTypeParser(pg.types.builtins.INT2, int)
	pg.types.setTypeParser(pg.types.builtins.INT4, int)
	pg.types.setTypeParser(pg.types.builtins.INT8, int)
	pg.types.setTypeParser(pg.types.builtins.FLOAT4, float)
	pg.types.setTypeParser(pg.types.builtins.FLOAT8, float)
}
