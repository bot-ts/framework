// system file, please don't modify it

import { ORM } from "@ghom/orm"
import { logger } from "@ghom/logger"
import path from "path"

export const orm = new ORM({
  location: path.join(process.cwd(), "dist", "tables"),
  database: {
    client: "pg",
    useNullAsDefault: true,
    connection: {
      port: +(process.env.DB_PORT ?? 5432),
      host: process.env.DB_HOST ?? "localhost",
      user: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE ?? "postgres",
      timezone: process.env.BOT_TIMEZONE || "UTC",
    },
  },
  logger,
})

export * from "@ghom/orm"