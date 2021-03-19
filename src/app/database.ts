import knex from "knex"
import { Knex } from "knex"
import path from "path"
import chalk from "chalk"
import fs from "fs"

import * as logger from "./logger"

const dataDirectory = path.join(process.cwd(), "data")

if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory)

/**
 * Welcome to the database file!
 * You can get the docs of **knex** [here](http://knexjs.org/)
 */

export const db = knex({
  client: "sqlite3",
  useNullAsDefault: true,
  connection: {
    filename: path.join(process.cwd(), "data", "sqlite3.db"),
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
    logger.warn(`ignored table ${chalk.blue(name)}`, "database")
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
