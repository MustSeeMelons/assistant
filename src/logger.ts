import { createLogger, Logger, format, transports } from "winston";

export const LOGGER: Logger = createLogger({
    level: "info",
    format: format.combine(
        format.json(),
        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        })
    ),
    transports: [
        new transports.File({
            filename: "app-log.log",
        }),
        new transports.Console(),
    ],
});
