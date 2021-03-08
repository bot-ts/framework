# bot.ts

Discord bot template in TypeScript includes:

- Advanced command handler
- [CLI](https://www.npmjs.com/package/make-bot.ts) to generate command and listener files
- Very practical file structure (all the app parts are includes and exported from [app.ts](./src/app.ts))
- [Yargs](http://yargs.js.org/) based argument system for commands
- Some basic [commands](./src/commands) and [listeners](./src/listeners) (including an advanced "eval" command)
- Some scripts in [package.json](./package.json) (including a TypeScript watcher)
- [Knex](http://knexjs.org/) database [here](./src/app/database.ts) provider, configured by default with [sqlite3](https://www.npmjs.com/package/sqlite3)
- Efficient [pagination](./src/app/pagination.ts) system (example in [help](./src/commands/help.ts#L108) command)

## Usage

### Initialize

1. Remove the "template" word from `template.env`.
2. Replace the `{{ value }}` values inside it.
3. Custom the "name", "version" and "author" values in [package.json](./package.json)
4. Install dependencies with `npm install` or `yarn install`

### Scripts

| Name   | Script                           | Description                                               |
| ------ | -------------------------------- | --------------------------------------------------------- |
| build  | `tsc`                            | Compile TypeScript from `./src` to `./dist` directory     |
| start  | `tsc && node .`                  | Build and run the bot from `./dist`                       |
| watch  | `tsc-watch --onSuccess "node ."` | Build, run and watch the `./src/*.ts` files to start over |
| format | `prettier --write src`           | Beatify files in `./src` using a `--no-semi` config       |

### Generate files

- command: `make command [name]`
- listener: `make listener [event: ClientEvent]`
- database: `make database [database: sqlite3]`

## Annexes

- [documentation](https://github.com/CamilleAbella/bot.ts/blob/master/docs/index.md)
- [`make-bot.ts` CLI on NPM](https://www.npmjs.com/package/make-bot.ts)
- Author Discord server: [Les Laboratoires JS](https://discord.gg/3vC2XWK)
- [You want to use this template ?](https://github.com/CamilleAbella/bot.ts/generate)
