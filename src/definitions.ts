export enum EVENTS {
    SLEEP = "SLEEP",
    CONFIG = "CONFIG",
    WAKE = "WAKE",
    RESIZE = "RESIZE",
}

export interface ResizeEvent {
    x: number;
    y: number;
}

export interface Message {
    title: string;
    text: string;
}

export interface AppConfig {
    questionAmount: number;
    sleepTime: number;
    wakeDelay: number;
    autoDelay: number;
    messageConfig: Array<Message>;
}

export const DEFAULT_CONFIG: AppConfig = {
    questionAmount: 1,
    sleepTime: 5000,
    wakeDelay: 5000,
    autoDelay: 5000,
    messageConfig: [
        {
            title: "Looks like you are writing a letter",
            text: "Maybe you want to answer some trivia questions?",
        },
    ],
};

export enum API_RESPONSE_CODES {
    SUCCESS,
    NO_RESULTS,
    INVALID_PARAMETER,
    TOKEN_NOT_FOUND,
    TOKEN_EMPTY,
}
