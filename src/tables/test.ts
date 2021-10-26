import * as app from "../app.js"

export interface Test {
  cool: number
}

export default new app.Table<Test>({
  name: "test",
  description: "The test table",
  migrations: {
    1: () =>
      app.db.schema.alterTable("test", (table) => {
        table.integer("cool").notNullable()
      }),
  },
  setup: (table) => {
    // setup table columns => http://knexjs.org/#Schema-Building
  },
})
