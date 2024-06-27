// system file, please don't modify it

import { ORM } from "@ghom/orm"
import * as logger from "./logger.ts"
import env from "./env.ts"
import path from "path"

const orm = new ORM({
  location: path.join(process.cwd(), "dist", "tables"),
  database: {
    client: "pg",
    useNullAsDefault: true,
    connection: {
      port: env.DB_PORT ?? 5432,
      host: env.DB_HOST ?? "localhost",
      user: env.DB_USER ?? "postgres",
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE ?? "postgres",
      timezone: env.BOT_TIMEZONE || "UTC",
    },
  },
  logger,
})

export * from "@ghom/orm"

export default orm