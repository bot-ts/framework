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

export interface TableOptions {
  name: string
  setup: (table: Knex.CreateTableBuilder) => void
}

export class Table<Type> {
  constructor(public readonly options: TableOptions) {}

  get query() {
    return db<Type>(this.options.name)
  }

  async make(): Promise<this> {
    try {
      await db.schema.createTable(this.options.name, this.options.setup)
      logger.log(`created table ${chalk.blue(this.options.name)}`, "database")
    } catch (error) {
      logger.log(`loaded table ${chalk.blue(this.options.name)}`, "database")
    }
    return this
  }
}

export const tablesPath =
  process.env.TABLES_PATH ?? path.join(process.cwd(), "dist", "tables")

export const tables = new Map<string, Table<any>>()
