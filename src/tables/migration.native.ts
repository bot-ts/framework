import * as app from "../app.js"

export interface MigrationData {
  table: string
  version: number
}

export default new app.Table<MigrationData>({
  name: "migration",
  description: "The migration table",
  priority: Infinity,
  setup: (table) => {
    table.string("table").unique().notNullable()
    table.integer("version").notNullable()
  },
})
