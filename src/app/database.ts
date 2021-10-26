import knex, { Knex } from "knex"
import discord from "discord.js"
import path from "path"
import chalk from "chalk"
import fs from "fs"

import * as logger from "./logger.js"
import * as handler from "./handler.js"

import type { MigrationData } from "../tables/migration.native.js"

export const tableHandler = new handler.Handler(
  process.env.BOT_TABLES_PATH ?? path.join(process.cwd(), "dist", "tables")
)

tableHandler.once("finish", async (pathList) => {
  const tables = await Promise.all(
    pathList.map(async (filepath) => {
      const tableFile = await import("file://" + filepath)
      return tableFile.default
    })
  )

  return Promise.all(
    tables
      .sort((a, b) => {
        return (b.options.priority ?? 0) - (a.options.priority ?? 0)
      })
      .map((table) => table.make())
  )
})

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
    filename: path.join(dataDirectory, "sqlite3.db"),
  },
})

export interface TableOptions<Type> {
  name: string
  description: string
  priority?: number
  migrations?: { [version: number]: (table: Knex.CreateTableBuilder) => void }
  setup: (table: Knex.CreateTableBuilder) => void
}

export class Table<Type> {
  constructor(public readonly options: TableOptions<Type>) {}

  get query() {
    return db<Type>(this.options.name)
  }

  async make(): Promise<this> {
    try {
      await db.schema.createTable(this.options.name, this.options.setup)
      logger.log(
        `created table ${chalk.blueBright(this.options.name)} ${chalk.grey(
          this.options.description
        )}`
      )
    } catch (error: any) {
      if (error.toString().includes("syntax error")) {
        logger.error(
          `you need to implement the "setup" method in options of your ${chalk.blueBright(
            this.options.name
          )} table!`
        )

        throw error
      } else {
        logger.log(
          `loaded table ${chalk.blueBright(this.options.name)} ${chalk.grey(
            this.options.description
          )}`
        )
      }
    }

    try {
      const migrated = await this.migrate()

      if (migrated !== false) {
        logger.log(
          `migrated table ${chalk.blueBright(
            this.options.name
          )} to version ${chalk.magentaBright(migrated)}`
        )
      }
    } catch (error: any) {
      logger.error(error, "database:Table:make", true)
    }

    return this
  }

  private async migrate(): Promise<false | number> {
    if (!this.options.migrations) return false

    const migrationCollection: discord.Collection<
      number,
      (table: Knex.CreateTableBuilder) => void
    > = new discord.Collection(
      Object.entries(this.options.migrations)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map((entry) => [Number(entry[0]), entry[1]])
    )

    let data = await db<MigrationData>("migration")
      .where("table", this.options.name)
      .first()

    if (!data)
      data = {
        table: this.options.name,
        version: migrationCollection.lastKey() ?? 0,
      }

    const baseVersion = data.version

    for (const [version, migration] of migrationCollection) {
      if (version <= data.version) continue

      await db.schema.alterTable(this.options.name, migration)

      data.version = version
    }

    await db<MigrationData>("migration")
      .insert(data)
      .onConflict("table")
      .merge()

    return baseVersion === data.version ? false : data.version
  }
}

export const tables = new Map<string, Table<any>>()
