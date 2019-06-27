import Axios, { AxiosResponse } from "axios";
import _ from "lodash";
import { AllHtmlEntities } from "html-entities";

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
 * The full fat Axios Trivia response.
 */
export interface TriviaResponse extends AxiosResponse {
    data: {
        response_code: number;
        results: Array<RawTriviaQuestion>;
    };
}

const TRIVIA_URL = "https://opentdb.com/api.php";

export const fetchTriviaQuestions = async (): Promise<
    Array<ProcessedTriviaQuestion>
> => {
    const response = (await Axios.get(`${TRIVIA_URL}?amount=1`, {
        timeout: 60000,
    })) as TriviaResponse;

    return decodeAnswers(response);
};

export const decodeAnswers = (
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
