import * as app from "../app.js"

export interface Test {
  // type of table
}

export default new app.Table<Test>({
  name: "test",
  description: "The test table",
  setup: (table) => {
    // setup table columns => http://knexjs.org/#Schema-Building
  },
})