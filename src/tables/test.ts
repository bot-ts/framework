import * as app from "../app.js"

export interface Test {
  coucou?: string
  kappa: string
}

export default new app.Table<Test>({
  name: "bite",
  description: "Big dick table",
  migrations: {
    3: (table) => {
      table.string("kappa").notNullable()
      table.dropColumn("cool")
    },
    1: (table) => {
      table.integer("cool").notNullable()
    },
  },
  setup: (table) => {
    table.string("coucou")
    // setup table columns => http://knexjs.org/#Schema-Building
  },
})
