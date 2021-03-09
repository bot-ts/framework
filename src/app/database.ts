import knex from "knex"
import { Knex } from "knex"
import chalk from "chalk"
import * as logger from "./logger"

/**
 * Welcome to the database file!
 * You can get the docs of **knex** [here](http://knexjs.org/)
 */

export const db = knex({
  client: "pg",
  useNullAsDefault: true,
  connection: {
    port: +(process.env.PORT ?? 5432),
    host: process.env.HOST ?? "localhost",
    user: process.env.USER ?? "postgres",
    password: process.env.PASSWORD,
    database: process.env.DATABASE ?? "postgres",
  },
})

async function _createTable(
  name: string,
  modifier: (table: Knex.CreateTableBuilder) => void
) {
  try {
    await db.schema.createTable("prefixes", modifier)
    logger.log(`created table ${chalk.blue(name)}`, "database")
  } catch (error) {
    if (error.message.includes("already exists")) {
      logger.log(`loaded table ${chalk.blue(name)}`, "database")
    } else {
      logger.error(error, "database")
    }
  }
}

/**
 * This function is auto-loaded on bot start. <br>
 * Please use the `_createTable()` method for error catching.
 */
export async function _createTables() {
  await _createTable("prefixes", (table) => {
    table.string("guild_id").unique()
    table.string("prefix")
  })

  // place here your own tables!
}

export const prefixes = () => db<Prefix>("prefixes")

export interface Prefix {
  id: number
  guild_id: string
  prefix: string
}
