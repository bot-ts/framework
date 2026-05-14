Create a new database table for this bot.ts project.

The framework uses `@ghom/orm` (Knex-based ORM with SQLite3 by default).

The user will provide: table name, description, and columns.

If the user hasn't provided details, ask for:
1. Table name (snake_case, e.g. `guild_members`)
2. Short description
3. Columns: name, type, nullable/required, unique, primary key

Then create the file at `src/tables/<name>.ts` (Biome style: tabs, no semicolons, double quotes).

### Basic example

```typescript
import { Table } from "@ghom/orm"

export interface GuildMember {
  id: number
  guild_id: string
  user_id: string
  score?: number
  joined_at: Date
}

export default new Table<GuildMember>({
  name: "guild_members",
  description: "Members tracked per guild",
  setup: (table) => {
    table.increments("id").primary().unsigned()
    table.string("guild_id").notNullable()
    table.string("user_id").notNullable()
    table.integer("score").defaultTo(0)
    table.timestamp("joined_at").defaultTo(table.client.fn.now())
  },
})
```

### With migrations (add columns in future versions)

```typescript
export default new Table<GuildMember>({
  name: "guild_members",
  description: "Members tracked per guild",
  setup: (table) => {
    table.increments("id").primary().unsigned()
    table.string("guild_id").notNullable()
    table.string("user_id").notNullable()
  },
  migrations: {
    1: (table) => {
      table.integer("score").defaultTo(0)
    },
    2: (table) => {
      table.boolean("is_premium").defaultTo(false)
    },
  },
})
```

### With caching

```typescript
export default new Table<GuildMember>({
  name: "guild_members",
  description: "Members tracked per guild",
  caching: 300_000, // cache for 5 minutes
  setup: (table) => {
    // ...
  },
})
```

### Knex column types reference

```typescript
table.increments("id")           // auto-increment integer PK
table.string("name")             // VARCHAR(255)
table.text("content")            // TEXT
table.integer("count")           // INTEGER
table.bigInteger("big_id")       // BIGINT
table.float("ratio")             // FLOAT
table.boolean("active")          // BOOLEAN
table.timestamp("created_at")    // TIMESTAMP
table.date("birthday")           // DATE
table.json("metadata")           // JSON

// Modifiers
.notNullable()
.nullable()
.defaultTo(value)
.unique()
.unsigned()
.primary()
.references("id").inTable("other_table").onDelete("cascade")
```

### Using the table in commands/listeners

```typescript
import guildMembersTable from "#tables/guild_members"

// SELECT
const member = await guildMembersTable.query
  .where("guild_id", guildId)
  .where("user_id", userId)
  .first()

// INSERT
await guildMembersTable.query.insert({ guild_id: guildId, user_id: userId })

// UPDATE
await guildMembersTable.query
  .where("user_id", userId)
  .update({ score: newScore })

// DELETE
await guildMembersTable.query.where("id", id).delete()

// With cache:
const cached = await guildMembersTable.cache.get(
  `member:${guildId}:${userId}`,
  (q) => q.where("guild_id", guildId).where("user_id", userId)
)
```

### Rules

- The `name` in `Table()` must match the actual database table name
- The TypeScript interface must have `?` for nullable/optional columns
- Migrations run automatically in ascending numeric order on each bot start
- Higher `priority` number = loads before lower priority tables (useful for foreign keys)
- Configure database engine with `bot config database` — defaults to SQLite3
- Full Knex docs: https://knexjs.org/guide/schema-builder.html

After creating the file, remind the user to run `bun run format`.
