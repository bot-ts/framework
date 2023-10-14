// system file, please don't modify it

import type * as command from "./command.js"

export interface Config {
  getPrefix: (message: command.NormalMessage) => Promise<string>
}
