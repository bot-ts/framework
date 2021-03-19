# bot.ts

Discord bot template in TypeScript includes:

- Advanced [file handler](./src/app/handler.ts) that includes everything you need
- [CLI](https://www.npmjs.com/package/make-bot.ts) to generate command and listener files
- Very practical file structure (all the app parts are includes and exported from [app.ts](./src/app.ts))
- [Yargs](http://yargs.js.org/) based argument system for commands
- Some basic [commands](./src/commands) and [listeners](./src/listeners) (including an advanced "eval" command)
- Some scripts in [package.json](./package.json) (including a TypeScript watcher)
- [Knex](http://knexjs.org/) database provider [here](./src/app/database.ts), configured by default with [sqlite3](https://www.npmjs.com/package/sqlite3)
- Efficient [pagination](./src/app/pagination.ts) system (example in [help](./src/commands/help.ts#L108) command)
- [ESBuild](https://esbuild.github.io) configuration for a build faster than 100ms

## Usage

### Initialize

> **⚠** This guide is **deprecated**, visit the [documentation](https://ghom.gitbook.io/bot-ts/) instead **⚠**

1. ~~Remove the "template" word from `template.env`.~~
2. ~~Replace the `{{ value }}` values inside it.~~
3. ~~Custom the "name", "version" and "author" values in [package.json](./package.json)~~
4. ~~Install dependencies with `npm install` or `yarn install`~~

### Scripts

| Name   | Script                    | Description                                           |
| ------ | ------------------------- | ----------------------------------------------------- |
| build  | `gulp build`              | Compile TypeScript from `./src` to `./dist` directory |
| start  | `npm run build && node .` | Build and run the bot from `./dist`                   |
| format | `prettier --write src`    | Beatify files in `./src` using a `--no-semi` config   |

### Generate files

- command: `make command [name]`
- listener: `make listener [event: ClientEvent]`
- database: `make database [database: sqlite3]`
- namespace: `make namespace [name]`

## Annexes

- bot.ts [documentation](https://ghom.gitbook.io/bot-ts/)
- [`make-bot.ts` CLI on NPM](https://www.npmjs.com/package/make-bot.ts)
- Discord server: [Les Laboratoires JS](https://discord.gg/3vC2XWK)
- You want to [use this template](https://github.com/CamilleAbella/bot.ts/generate) ?
