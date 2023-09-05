import path from "path"
import chalk from "chalk"
import discord from "discord.js"
import { Knex } from "knex"

import * as handler from "@ghom/handler"
import * as logger from "./logger.js"
import * as database from "./database.js"

import { filename } from "dirname-filename-esm"

const __filename = filename(import.meta)

import type { MigrationData } from "../tables/migration.native.js"

export const tableHandler = new handler.Handler(
  path.join(process.cwd(), "dist", "tables")
)

tableHandler.once("finish", async (pathList) => {
  const tables = await Promise.all(
    pathList.map(async (filepath) => {
      const file = await import("file://" + filepath)
      const item: Table<any> = file.default
      if (filepath.endsWith(".native.js")) item.options.native = true
      item.filepath = filepath
      return item
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

export interface TableOptions<Type extends {}> {
  name: string
  description: string
  priority?: number
  migrations?: { [version: number]: (table: Knex.CreateTableBuilder) => void }
  setup: (table: Knex.CreateTableBuilder) => void
  /**
   * This property is automatically setup on bot running.
   * @deprecated
   */
  native?: boolean
}

export class Table<Type extends {}> {
  filepath?: string

  constructor(public readonly options: TableOptions<Type>) {}

  get query() {
    return database.db<Type>(this.options.name)
  }

  async make(): Promise<this> {
    try {
      await database.db.schema.createTable(
        this.options.name,
        this.options.setup
      )
      logger.log(
        `created table ${chalk.blueBright(this.options.name)}${
          this.options.native ? ` ${chalk.green("native")}` : ""
        } ${chalk.grey(this.options.description)}`
      )
    } catch (error: any) {
      if (error.toString().includes("syntax error")) {
        logger.error(
          `you need to implement the "setup" method in options of your ${chalk.blueBright(
            this.options.name
          )} table!`,
          this.filepath ?? __filename
        )

        throw error
      } else {
        logger.log(
          `loaded table ${chalk.blueBright(this.options.name)}${
            this.options.native ? ` ${chalk.green("native")}` : ""
          } ${chalk.grey(this.options.description)}`
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
      logger.error(error, this.filepath ?? __filename, true)
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
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map((entry) => [Number(entry[0]), entry[1]])
    )

    const fromDatabase = await database
      .db<MigrationData>("migration")
      .where("table", this.options.name)
      .first()

    const data = fromDatabase || {
      table: this.options.name,
      version: 0,
    }

    const baseVersion = data.version

    await database.db.schema.alterTable(this.options.name, (builder) => {
      migrationCollection.forEach((migration, version) => {
        if (version <= data.version) return
        migration(builder)
        data.version = version
      })
    })

    await database
      .db<MigrationData>("migration")
      .insert(data)
      .onConflict("table")
      .merge()

    return baseVersion === data.version ? false : data.version
  }
}

export const tables = new Map<string, Table<any>>()
