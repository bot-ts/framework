# bot.ts

Discord bot template in TypeScript includes:

- Advanced command handler
- [CLI](https://www.npmjs.com/package/make-bot.ts) to generate command and listener files
- Very practical file structure (all the app parts are includes and exported from [app.ts](./src/app.ts))
- [Yargs](http://yargs.js.org/) based argument system for commands
- Some basic [commands](./src/commands) and [listeners](./src/listeners) (including an advanced "eval" command)
- Some scripts in [package.json](./package.json) (including a TypeScript watcher)
- [Enmap](https://enmap.evie.dev/) database (not deactivatable for the moment, add your own tables [here](./src/app/database.ts))
- Some [utils](./src/app/utils.ts)...

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
- listener: `make listener [event]`

### How to use [eval](./src/commands/eval.ts) command ?

#### Pattern:

In the Discord server where you invited the bot, use the following command pattern in a channel accessible by the bot:

```shell
[your_prefix]eval your_js_code
```

For example:

```shell
.eval
return 42 + "0"
```

If you type your entire command on one line, you can ignore the keyword `return`. It will be added automatically.

```shell
.eval 42 + "0"
```

You also have the possibility to encode your code between markdown tags in order to have the indentation.

````shell
.eval ```js
return 42 + "0"
```
`````

If your code contains `async/await`, it works at top level like on Deno!

```shell
.eval await fetch("https://api.mathjs.org/v4/?expr=42+0")
```

#### Arguments:

You can install and use NPM packages in your eval with the `--use` argument. You can then use the imported packages via the `req` object:

```shell
.eval --use=prettier,esbuild,make-bot.ts
req.prettier // ok
req["make-bot.ts"] // ok
return 42 + "0"
```

If you want to run your code in silence, use the `--muted` flag.

```shell
.eval --muted
return 42 + "0"
```

## Annexes

- [`make-bot.ts` CLI on NPM](https://www.npmjs.com/package/make-bot.ts)
- Author Discord server: [Les Laboratoires JS](https://discord.gg/3vC2XWK)
- [You want to use this template ?](https://github.com/CamilleAbella/bot.ts/generate)
