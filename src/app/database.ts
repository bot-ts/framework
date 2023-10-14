// system file, please don't modify it

import { ORM } from "@ghom/orm"
import path from "path"
import fs from "fs"

import * as logger from "./logger.js"

const dataDirectory = path.join(process.cwd(), "data")

if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory)

export const orm = new ORM({
  location: path.join(process.cwd(), "src", "tables"),
  database: {
    client: "sqlite3",
    useNullAsDefault: true,
    connection: {
      filename: path.join(dataDirectory, "sqlite3.db"),
    },
  },
  logger: logger.createLogger("database"),
})

export * from "@ghom/orm"
