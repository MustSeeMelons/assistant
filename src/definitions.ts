export enum EVENTS {
    SLEEP = "SLEEP",
    CONFIG = "CONFIG",
}

export interface AppConfig {
    questionAmount: number;
    sleepTime: number;
}

export const DEFAULT_CONFIG: AppConfig = {
    questionAmount: 1,
    sleepTime: 5000,
};

export enum API_RESPONSE_CODES {
    SUCCESS,
    NO_RESULTS,
    INVALID_PARAMETER,
    TOKEN_NOT_FOUND,
    TOKEN_EMPTY
} 
