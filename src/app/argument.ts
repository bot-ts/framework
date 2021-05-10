import * as core from "./core"
import * as command from "./command"

export interface Argument {
  name: string
  description: string
}

export interface Rest<Message extends command.CommandMessage> extends Argument {
  required?: core.Scrap<boolean, [message: Message]>
  default?: core.Scrap<string, [message: Message]>
}

export interface Option<Message extends command.CommandMessage>
  extends Argument {
  aliases?: string[] | string
  default?: core.Scrap<string, [message: Message]>
  required?: core.Scrap<boolean, [message: Message]>
  castValue?:
    | "number"
    | "date"
    | "json"
    | "boolean"
    | "regex"
    | "array"
    | "user"
    | "member"
    | "channel"
    | "message"
    | ((value: string, message: Message) => any)
  /**
   * If returns string, it used as error message
   */
  checkValue?:
    | RegExp
    | core.Scrap<boolean | RegExp | string, [value: string, message: Message]>
  typeDescription?: core.Scrap<string, [value: string, message: Message]>
}

export type Positional<Message extends command.CommandMessage> = Omit<
  Option<Message>,
  "aliases"
>

export interface Flag<Message extends command.CommandMessage>
  extends Pick<Option<Message>, "name" | "aliases" | "description"> {
  flag: string
}

export function getTypeDescriptionOf<Message extends command.CommandMessage>(
  arg: Option<Message>
) {
  if (arg.typeDescription) return arg.typeDescription
  if (!arg.castValue) return "string"
  if (typeof arg.castValue === "string") {
    if (arg.castValue === "array") return "Array<string>"
    return arg.castValue
  }
  return "any"
}

export function isFlag<Message extends command.CommandMessage>(
  arg: Option<Message>
): arg is Flag<Message> {
  return arg.hasOwnProperty("flag")
}
