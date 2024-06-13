import { logger } from "@ghom/logger"

const log = logger.log.bind(logger)
const warn = logger.warn.bind(logger)
const error = logger.error.bind(logger)
const success = logger.success.bind(logger)

export { log, warn, error, success }

export { Logger } from "@ghom/logger"
