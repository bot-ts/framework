import * as app from "../app.js"

export interface Test2 {
  // type of table
}

export default new app.Table<Test2>({
  name: "test2",
  description: "The test2 table",
  setup: (table) => {
    // setup table columns => http://knexjs.org/#Schema-Building
  },
})