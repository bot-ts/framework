Create a new namespace (shared utility module) for this bot.ts project.

Namespaces are TypeScript modules in `src/namespaces/` that export shared code: utilities, constants, API wrappers, database helpers, middlewares, etc.

The user will provide: namespace name and its purpose.

If the user hasn't provided details, ask for:
1. Namespace name (kebab-case, e.g. `utils`, `middlewares`, `constants`, `api`)
2. What it will contain (utilities, middlewares, constants, API wrappers, etc.)

Then create the file at `src/namespaces/<name>.ts` (Biome style: tabs, no semicolons, double quotes).

**Important:** After creating the namespace, also update `package.json` to add the import alias. In the `imports` field, add:
```json
"#namespaces/<name>": "./dist/namespaces/<name>.js"
```
(Note: the CLI `bot add namespace` handles this automatically — remind the user to use it or add it manually.)

### Utility namespace example

```typescript
// src/namespaces/utils.ts

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000) % 60
  const minutes = Math.floor(ms / (1000 * 60)) % 60
  const hours = Math.floor(ms / (1000 * 60 * 60))

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)

  return parts.join(" ") || "0s"
}

export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  )
}
```

### Constants namespace example

```typescript
// src/namespaces/constants.ts

export const COLORS = {
  primary: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
} as const

export const EMOJIS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  loading: "⏳",
} as const

export const LIMITS = {
  commandsPerPage: 10,
  maxEmbedFields: 25,
  defaultCooldown: 3000,
} as const
```

### Middlewares namespace example

```typescript
// src/namespaces/middlewares.ts

import { Middleware } from "#core/command"

export const requireAdmin = new Middleware(
  "requireAdmin",
  async (context, data) => {
    if (!context.message.member?.permissions.has("Administrator")) {
      return {
        result: "You need Administrator permission to use this command.",
        data: null,
      }
    }
    return { result: true, data }
  }
)

export const requireLevel = (minLevel: number) =>
  new Middleware("requireLevel", async (context, data) => {
    // const level = await getUserLevel(context.message.author.id)
    // if (level < minLevel) return { result: `You need level ${minLevel}.`, data: null }
    return { result: true, data }
  })
```

Usage in a command:
```typescript
import { requireAdmin, requireLevel } from "#namespaces/middlewares"

export default new Command({
  name: "admin-cmd",
  middlewares: [requireAdmin, requireLevel(10)],
  // ...
})
```

### Database helpers namespace example

```typescript
// src/namespaces/db.ts

import usersTable from "#tables/users"

export async function getOrCreateUser(userId: string) {
  let user = await usersTable.query.where("id", userId).first()
  if (!user) {
    await usersTable.query.insert({ id: userId })
    user = await usersTable.query.where("id", userId).first()
  }
  return user!
}
```

### Middleware return type

```typescript
// result: true       → continue command execution
// result: false      → silently stop
// result: "message"  → stop and display error message to user
// data: any          → passed to next middleware and the command
```

### Rules

- Namespaces are plain TypeScript modules — no default export required (use named exports)
- **Must register the import alias in `package.json` `imports`** (or use `bot add namespace`)
- Import via `#namespaces/<name>` — never use relative paths into `src/namespaces/`
- Avoid circular dependencies between namespaces
- Middlewares must be in a namespace (not inline in command files)
- Middleware names should be descriptive — they appear in error logs

After creating the file, remind the user to either run `bot add namespace` (which handles the `package.json` update) or manually add the alias to `package.json`.
