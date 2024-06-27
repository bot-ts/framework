// system file, please don't modify it

import { ORM } from "@ghom/orm"
import * as logger from "./logger.ts"
import env from "./env.ts"
import path from "path"
import fs from "fs"

const dataDirectory = path.join(process.cwd(), "data")

if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory)

const orm = new ORM({
  location: path.join(process.cwd(), "dist", "tables"),
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

export * from "@ghom/orm"

export default orm