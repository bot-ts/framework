// system file, please don't modify it

import env from "#core/env"
import * as logger from "#core/logger"
import * as orm from "@ghom/orm"
import fs from "fs"
import path from "path"

const dataDirectory = path.join(process.cwd(), "data")

if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory)

const client = new orm.ORM({
  tableLocation: path.join(process.cwd(), "dist", "tables"),
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
})

export default client
