---
description: >-
  To install bot.ts, please read these instructions very carefully, every word
  is important!
---

# Installation

## Prerequisites

First, you need to make sure that you have an environment compatible with bot.ts.

* Node `^=14`
* NPM `^=7`
* Git  `^=2.31.1`

## Install the CLI

To install bot.ts, you must first install globaly the CLI with the following command.

```bash
npm i -g make-bot.ts
```

## Generate files

Then you can go to the place where you want to place your project \(e.g. `/home`\) and run the `make bot` command.

### CLI pattern

```bash
make bot [name] [path]

Positionals:
  name                  # Bot name                             [default: "bot.ts"]
  path                  # Bot path                                  [default: "."]

Options:
      --version         # Show version number                            [boolean]
      --help            # Show help                                      [boolean]
  -p, --prefix          # Bot prefix                                [default: "."]
  -l, --locale          # Locale timezone                          [default: "en"]
  -d, --database        # Used database
                        #[choices: "sqlite3", "mysql2", "pg"] [default: "sqlite3"]
  -t, --token           # Bot token                                       [string]
  -o, --owner           # Your Discord id                                 [string]
  -h, --host            # Database host                     [default: "localhost"]
      --port            # Database port                                   [string]
  -u, --user            # Database user                                   [string]
      --password, --pw  # Database password                               [string]
      --dbname, --db    # Database name                                   [string]
```

{% hint style="warning" %}
**Giving the token is highly recommended**, it will help setup a lot of environment variables.
{% endhint %}

### Example

Setup a simple bot with sqlite3.

```bash
make bot "bot-name" --token "bot-token" --prefix "!" --locale "fr"
```

If you want to choose a database other than sqlite3, you can enter it directly with the `--database` option. Several options can then be added, such as host, port, password, etc.

```bash
make bot <name> --token "your_token" --database "pg" --schema "postgres" --user "postgres"
```

The connection data to your database are all editable in the `.env` file after the build.

## Now is installed

The `.env` file has been created and contains your bot's private information, you can now do the following command to go to the root of your project!

```bash
cd <name>
```

