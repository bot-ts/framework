# bot.ts

Discord bot template in TypeScript includes:

- Advanced command handler
- [CLI](https://www.npmjs.com/package/make-bot.ts) to generate command and listener files
- Very practical file structure (all the app parts are includes and exported from [app.ts](./src/app.ts))
- [Yargs](http://yargs.js.org/) based argument system for commands
- Some basic [commands](./src/commands) and [listeners](./src/listeners)
- Watching script in [package.json](./package.json) (including the watcher)
- [Enmap](https://enmap.evie.dev/) database
- Some [utils](./src/app/utils.ts)...

## Usage

### Initialize

1. Remove the "template" word from `template.env`.
2. Replace the `{{ value }}` values inside it.
3. Custom the "name", "version" and "author" values in [package.json](./package.json)

### Scripts

| Name   | Script                           | Description                                               |
| ------ | -------------------------------- | --------------------------------------------------------- |
| build  | `tsc`                            | Compile TypeScript from `./src` to `./dist` directory     |
| start  | `tsc && node .`                  | Build and run the bot from `./dist`                       |
| watch  | `tsc-watch --onSuccess "node ."` | Build, run and watch the `./src/*.ts` files to start over |
| format | `prettier --write src`           | Beatify files in `./src` using a `--no-semi` config       |

### Generate files

- command: `make command [name]`
- listener: `make listener [event]`

## Annexes

- [`make-bot.ts` CLI on NPM](https://www.npmjs.com/package/make-bot.ts)
- Author Discord server: [Les Laboratoires JS](https://discord.gg/3vC2XWK)
- [You want to use this template ?](https://github.com/CamilleAbella/bot.ts/generate)
