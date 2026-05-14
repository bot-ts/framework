# bot.ts Framework — Claude Code Guide

## What is this project?

**bot.ts** (`@ghom/bot.ts`) is a TypeScript framework for building Discord bots on top of [discord.js](https://discord.js.org). It provides a structured, opinionated file-based architecture with automatic file loading, CLI generation, ORM integration, and multi-runtime support (Node.js, Bun, Deno).

- Documentation: https://ghom.gitbook.io/bot-ts/
- GitHub: https://github.com/bot-ts/framework
- CLI package: `@ghom/bot.ts-cli`

---

## Project Architecture

```
src/
├── index.ts              # Bootstrap — initializes all handlers then logs in
├── config.ts             # Discord.js client config + env schema (Zod)
├── types.ts              # Custom type resolvers for textual commands
├── core/                 # Framework internals — DO NOT EDIT (*.native.ts)
│   ├── argument.ts       # Type resolver engine
│   ├── button.ts         # Button handler
│   ├── client.ts         # discord.js Client setup
│   ├── command.ts        # Textual command handler
│   ├── config.ts         # Config class
│   ├── cron.ts           # Cron scheduler
│   ├── database.ts       # ORM (Knex via @ghom/orm)
│   ├── env.ts            # Env vars (Zod-validated)
│   ├── listener.ts       # Event listener handler
│   ├── logger.ts         # @ghom/logger
│   ├── pagination.ts     # Reaction-based pagination
│   ├── slash.ts          # Slash command handler
│   └── util.ts           # Utilities
├── commands/             # Textual (prefix) commands  — *.ts or *.native.ts
├── slash/                # Slash commands             — *.ts or *.native.ts
├── listeners/            # Discord event listeners    — category.event.ts
├── buttons/              # Button interaction handlers
├── cron/                 # Scheduled cron jobs
├── tables/               # Database table definitions
└── namespaces/           # Shared utilities / middlewares
```

### Path aliases (tsconfig + package.json `imports`)

| Alias | Resolves to |
|---|---|
| `#core/*` | `src/core/*` |
| `#config` | `src/config.ts` |
| `#types` | `src/types.ts` |
| `#tables/*` | `src/tables/*` |
| `#buttons/*` | `src/buttons/*` |
| `#namespaces/*` | `src/namespaces/*` |
| `#all` | re-exports everything |

---

## Code Style

This project uses **Biome** for formatting and linting. Always follow these rules:

- **Indentation**: tabs (not spaces)
- **Semicolons**: none (no-semi)
- **Quotes**: double quotes `""`
- **Import order**: organized by Biome (run `bun run format`)
- **No `any`**: `no-explicit-any` is enforced
- **No non-null assertions** (`!`): avoid them
- **No `void` type**: use `undefined` instead

Run `bun run format` after any edits. Run `bun run lint` to check.

---

## Environment Variables

Defined in `.env` (copy from `.template.env`):

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Discord bot token (required) |
| `BOT_PREFIX` | Command prefix (e.g. `!`) |
| `BOT_OWNER` | Bot owner Discord user ID |
| `BOT_ID` | Bot's own Discord application ID |
| `BOT_MODE` | `development` \| `production` \| `test` |
| `BOT_GUILD` | Guild ID for development (slash commands register instantly) |
| `BOT_NAME` | Bot display name |
| `BOT_LOCALE` | Default locale (e.g. `en`) |
| `BOT_TIMEZONE` | Timezone for cron jobs (e.g. `Europe/Paris`) |
| `DB_*` | Database connection credentials |
| `PACKAGE_MANAGER` | `npm` \| `yarn` \| `pnpm` \| `bun` |
| `RUNTIME` | `node` \| `bun` \| `deno` |

Custom env vars must be added to the Zod schema in `src/config.ts`:

```typescript
envSchema: z.object({
  MY_VAR: z.string(),
})
```

Then access them via `app.env.MY_VAR` (fully typed).

---

## Native Files Rule

Files ending in `.native.ts` are **framework core files**. Never modify them directly. To override a native file, copy it and remove the `.native` suffix — the framework will load the custom version instead.

---

## Creating Project Files

Always prefer using the CLI to scaffold new files:

```bash
bot add command     # textual command in src/commands/
bot add slash       # slash command in src/slash/
bot add listener    # event listener in src/listeners/
bot add button      # button handler in src/buttons/
bot add cron        # cron job in src/cron/
bot add table       # database table in src/tables/
bot add namespace   # shared module in src/namespaces/
bot config database # configure database engine
bot config engine   # switch runtime/package manager
```

If the CLI is not available, use the patterns documented below.

---

## Textual Commands (`src/commands/`)

Import from `#core/command`. File name = command name.

```typescript
import { Command } from "#core/command"

export default new Command({
  name: "ping",
  description: "Replies with pong",
  channelType: "all", // "guild" | "dm" | "all"
  // optional:
  // botOwnerOnly: true,
  // cooldown: { duration: 5000, type: CooldownType.Global },
  // middlewares: [myMiddleware],
  // positional: [{ name: "target", description: "...", type: "member", required: true }],
  // options: [{ name: "reason", description: "...", type: "string" }],
  // flags: [{ name: "silent", flag: "s", description: "..." }],
  // rest: { name: "content", description: "...", required: true },
  async run(message) {
    await message.channel.send("Pong!")
  },
})
```

### Argument types (textual commands only)

Basic: `string`, `number`, `boolean`, `regex`, `date`, `duration`, `json`
Arrays: `array`, `string[]`, `number[]`, `boolean[]`, `date[]`
Discord: `user`, `member`, `channel`, `role`, `emote`, `invite`
Bot: `command`, `slashCommand`
Custom types are defined in `src/types.ts`.

### Argument categories

- **positional** — positional values (`!cmd value`)
- **options** — named flags with values (`!cmd --name value`)
- **flags** — boolean switches (`!cmd -s` or `!cmd --silent`)
- **rest** — captures remaining text (`!cmd all the rest`)

---

## Slash Commands (`src/slash/`)

Import from `#core/slash`. File name = command name.

```typescript
import { SlashCommand } from "#core/slash"

export default new SlashCommand({
  name: "hello",
  description: "Greet someone",
  // guildOnly: true,
  // botOwnerOnly: true,
  // userPermissions: ["ManageMessages"],
  // middlewares: [myMiddleware],
  build(builder) {
    builder.addStringOption((opt) =>
      opt.setName("user").setDescription("Who to greet").setRequired(true)
    )
  },
  async run(interaction) {
    const user = interaction.options.getString("user", true)
    await interaction.reply(`Hello, ${user}!`)
  },
})
```

Slash commands are auto-registered on bot start. Set `BOT_GUILD` for instant dev registration (global commands take up to 1 hour).

---

## Listeners (`src/listeners/`)

File naming: `category.eventName.ts`

```typescript
import { Listener } from "#core/listener"

export default new Listener({
  event: "guildMemberAdd",
  description: "Welcome new members",
  // once: true,
  async run(member) {
    await member.guild.systemChannel?.send(`Welcome ${member}!`)
  },
})
```

### Extra events (beyond Discord.js)

- `afterReady` — fires after ALL `clientReady` listeners have completed
- `raw` — raw Gateway packets (`GatewayDispatchPayload`)

---

## Buttons (`src/buttons/`)

```typescript
import { Button } from "#core/button"

export type MyButtonParams = { userId: string }

export default new Button<MyButtonParams>({
  key: "my-button",
  description: "My button",
  builder: (builder) => builder.setLabel("Click me"),
  async run(interaction, { userId }) {
    await interaction.deferUpdate()
    await interaction.followUp({ content: `Clicked by ${userId}`, ephemeral: true })
  },
})
```

Use the button in a command:

```typescript
import discord from "discord.js"
import myButton from "#buttons/my-button"

await channel.send({
  components: [
    new discord.ActionRowBuilder().addComponents(
      myButton.create({ userId: "123" })
    ),
  ],
})
```

---

## Cron Jobs (`src/cron/`)

```typescript
import { Cron } from "#core/cron"

export default new Cron({
  name: "daily-report",
  description: "Sends the daily report",
  // Interval key: "minutely" | "hourly" | "daily" | "weekly" | "monthly" | "yearly"
  schedule: "daily",
  // Or simple interval: { type: "hour", duration: 6 }
  // Or advanced: { minute: 0, hour: 8, dayOfWeek: CronDayOfWeek.Monday }
  runOnStart: false,
  async run() {
    // task code here
  },
})
```

Timezone is read from `BOT_TIMEZONE` env var.

---

## Database Tables (`src/tables/`)

Uses `@ghom/orm` (Knex-based with SQLite3 by default).

```typescript
import { Table } from "@ghom/orm"

export interface User {
  id: number
  username: string
  score?: number
}

export default new Table<User>({
  name: "users",
  description: "Bot users",
  // priority: 1,       // higher = loads first
  // caching: 600_000,  // ms, enables built-in cache
  setup: (table) => {
    table.increments("id").primary()
    table.string("username").notNullable()
    table.integer("score").defaultTo(0)
  },
  migrations: {
    1: (table) => table.boolean("is_premium").defaultTo(false),
  },
})
```

Query examples:

```typescript
import usersTable from "#tables/users"

const user = await usersTable.query.where("id", 1).first()
await usersTable.query.insert({ username: "Alice" })
await usersTable.query.where("id", 1).update({ score: 100 })

// With cache:
const cached = await usersTable.cache.get("user:1", (q) => q.where("id", 1))
```

---

## Namespaces (`src/namespaces/`)

Shared utilities, constants, API wrappers, and middlewares.

```typescript
// src/namespaces/utils.ts
export function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}m ${s % 60}s`
}
```

Import via `#namespaces/utils`. Must be registered via CLI (`bot add namespace`) to update `package.json` imports.

### Middlewares (in namespaces)

```typescript
import { Middleware } from "#core/command"

export const requireAdmin = new Middleware(
  "requireAdmin",
  async (context, data) => {
    if (!context.message.member?.permissions.has("Administrator"))
      return { result: "You need Administrator permission.", data: null }
    return { result: true, data }
  }
)
```

---

## Scripts

| Script | Command | Description |
|---|---|---|
| Build | `bun run build` | Compile `src/` → `dist/` via Rollup |
| Start | `bun run start` | Build then run bot |
| Watch | `bun run watch` | Build, run, and watch for changes |
| Test | `bun run test` | TypeScript type check + boot test |
| Format | `bun run format` | Biome format `src/` |
| Lint | `bun run lint` | Biome lint `src/` |
| Update | `bun run update` | Update core/native framework files |
| Readme | `bun run readme` | Generate README from bot metadata |
| Final | `bun run final` | Production-optimized build |

---

## Important Constraints

1. **Never edit `src/core/*.native.ts`** — copy + remove `.native` suffix to customize
2. **Never edit `src/*/**.native.ts`** without very good reason
3. **Always run `bun run format`** after editing TypeScript files
4. **Use path aliases** (`#core/*`, `#tables/*`, etc.) — never use relative imports into `src/core/`
5. **Namespaces must be registered via CLI** (`bot add namespace`) to add the `imports` entry in `package.json`
6. **Slash commands take up to 1 hour** to propagate globally — set `BOT_GUILD` during development
7. **Custom argument types** go in `src/types.ts`, not in slash commands (not supported there)
