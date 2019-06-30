import { URLBuilder, GET_OPTS } from "./apiConfig";
import { API_RESPONSE_CODES } from "./../../definitions";
import Axios, { AxiosResponse } from "axios";
import _ from "lodash";
import { AllHtmlEntities } from "html-entities";
import { LOGGER } from "../../logger";

const HTML_ENTITIES = new AllHtmlEntities();

export enum QUESTION_TYPE {
    MULTIPLE = "multiple",
    TRUE_FALSE = "boolean",
}

/**
 * The shared bit between the plain/processed questions.
 */
export interface BaseQuestion {
    category: string;
    type: QUESTION_TYPE;
    question: string;
    correct_answer: string;
}

/**
 * Plain response from the Open Trivia DB.
 */
export interface RawTriviaQuestion extends BaseQuestion {
    incorrect_answers: Array<string>;
}

/**
 * Processed response, all answers in one field.
 */
export interface ProcessedTriviaQuestion extends BaseQuestion {
    answers: Array<string>;
}

/**
 * Base trivia response, containes only the api status code.
 */
export interface BaseTriviaResponse extends AxiosResponse {
    data: {
        response_code: number;
    };
}

/**
 * The trivia question retrieval response.
 */
export interface TriviaResponse extends BaseTriviaResponse {
    data: {
        response_code: number;
        results: Array<RawTriviaQuestion>;
    };
}

/**
 * The trivia session retrieval response.
 */
export interface TriviaTokenResponse extends BaseTriviaResponse {
    data: {
        response_code: number;
        response_message: string;
        token: string;
    };
}

/**
 * Represents a api get call.
 */
export type IAPIGet = <R extends AxiosResponse>(url: string) => Promise<R>;

export interface TriviaApi {
    fetchTriviaQuestions: (
        questionCount: number
    ) => Promise<Array<ProcessedTriviaQuestion>>;
}

export const statusCheck = <R extends BaseTriviaResponse>(response: R) => {
    const code = response.data.response_code;
    LOGGER.info(`STATUS CHECK RESULT: ${code}`);
    if (code !== 0) {
        throw code;
    }
};

export const API = (): TriviaApi => {
    let token: string;

    const tokenCheck = async () => {
        LOGGER.info("TOKEN CHECK");
        if (!token) {
            LOGGER.info("TOKEN GET");
            const response: TriviaTokenResponse = await apiGET(
                URLBuilder.tokenGet()
            );
            statusCheck(response);
            token = response.data.token;
        }
    };

    const resetToken = async () => {
        LOGGER.info("TOKEN RESET");
        await apiGET(URLBuilder.tokenReset(token));
    };

    const apiGET: IAPIGet = async (url: string) => {
        return Axios.get(url, GET_OPTS);
    };

    const sessionWrapper = async (apiCall: () => Promise<any>) => {
        try {
            await tokenCheck();
            return await apiCall();
        } catch (e) {
            if (e === API_RESPONSE_CODES.TOKEN_EMPTY) {
                LOGGER.info("TOKEN EMPTY");
                await resetToken();
                return await apiCall();
            } else {
                LOGGER.error(`API THROW ERROR: ${e}`);
                throw e;
            }
        }
    };

    return {
        fetchTriviaQuestions: async (questionCount: number) => {
            LOGGER.info("QUESTION FETCH");
            const response = (await sessionWrapper(() => {
                return apiGET(URLBuilder.questionGet(questionCount, token));
            })) as TriviaResponse;
            return decodeAnswers(response);
        },
    };
};

const decodeAnswers = (
    response: TriviaResponse
): Array<ProcessedTriviaQuestion> => {
    return response.data.results.map((rawQuestion: RawTriviaQuestion) => {
        const unescapedCorrectAnswer = HTML_ENTITIES.decode(
            rawQuestion.correct_answer
        );
        return {
            ...rawQuestion,
            question: HTML_ENTITIES.decode(rawQuestion.question),
            correct_answer: unescapedCorrectAnswer,
            answers: _.shuffle([
                ...rawQuestion.incorrect_answers.map(answer =>
                    HTML_ENTITIES.decode(answer)
                ),
                unescapedCorrectAnswer,
            ]),
        } as ProcessedTriviaQuestion;
    });
};
