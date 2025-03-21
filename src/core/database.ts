import fs from "node:fs"
import path from "node:path"

import config from "#config"
import env from "#core/env"
import * as logger from "#core/logger"
import * as util from "#core/util"
import * as orm from "@ghom/orm"

const dataDirectory = util.rootPath("data")

if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory)

const client = new orm.ORM({
  tableLocation: util.srcPath("tables"),
  backups: {
    location: path.join(dataDirectory, "backups"),
  },
  database: {
    client: "sqlite3",
    useNullAsDefault: true,
    connection: {
      filename: path.join(dataDirectory, "sqlite3.db"),

      timezone: env.BOT_TIMEZONE || "UTC",
    },
  },
  logger,
  caching: config.ormCaching,
})

export default client
