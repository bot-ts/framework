import * as app from "../app"

const table = new app.Table<{
  id: string
  prefix: string
}>({
  name: "guilds",
  setup: (table) => {
    table.string("id").unique()
    table.string("prefix").nullable()
  },
})

export default table
