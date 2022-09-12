import chalk from "chalk"
import dayjs from "dayjs"
import path from "path"

export const logLevelColors = {
  warn: "#ffa600",
  error: "#ff0000",
  info: "#00ffff",
  success: "#00ff00",
}

export type LogLevel = keyof typeof logLevelColors

export const loggerPattern = (
  text: string,
  level: LogLevel,
  secondaryText?: string
) => {
  return `${chalk.grey(dayjs().format("DD/MM/YY HH:mm"))} ${chalk.hex(
    logLevelColors[level]
  )(level.toUpperCase())}${
    secondaryText ? " " + chalk.magentaBright(`${secondaryText}`) : ""
  } ${text}`
}

export function log(text: string, section?: string) {
  console.log(loggerPattern(text, "info", section))
}

export function error(text: string | Error, _path: string, full?: boolean) {
  console.error(
    loggerPattern(
      text instanceof Error ? text.message.split("\n")[0] : text,
      "error",
      path.relative(process.cwd(), _path)
    )
  )
  if (full && text instanceof Error) console.error(text)
}

export function warn(text: string, section?: string) {
  console.warn(loggerPattern(text, "warn", section))
}

export function success(text: string, section?: string) {
  console.log(loggerPattern(text, "success", section))
}

export function createLogger(section: string) {
  return {
    log: (text: string) => log(text, section),
    error: (text: string | Error, full?: boolean) => error(text, section, full),
    warn: (text: string) => warn(text, section),
    success: (text: string) => success(text, section),
  }
}
