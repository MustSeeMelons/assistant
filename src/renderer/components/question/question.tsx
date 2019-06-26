import React from "react";
import "./question.scss";
import _ from "lodash";
import { ProcessedTriviaQuestion } from "../../api/api";

export interface QuestionProps extends ProcessedTriviaQuestion {
    onAcceptAnswer: (event: React.MouseEvent) => void;
    onChoiceChange: (choice: string) => void;
    onNextQuestionHandler: () => void;
    currentAnswer: string;
    isAnswerCorrect?: boolean;
}

export const Question = (props: QuestionProps) => {
    const renderResult = () => {
        if (props.isAnswerCorrect !== undefined) {
            return props.isAnswerCorrect ? (
                <div className="result-wrap correct">Correct!</div>
            ) : (
                <div className="result-wrap wrong">{props.correct_answer}</div>
            );
        }
    };

    const renderOperations = () => {
        return props.isAnswerCorrect !== undefined ? (
            <div className="operations">
                <button
                    className="btn-next"
                    onClick={props.onNextQuestionHandler}>
                    Another!
                </button>
                <button className="btn-sleep">Sleep..</button>
            </div>
        ) : (
            <div className="operations">
                <button className="btn-accept" onClick={props.onAcceptAnswer}>
                    Accept!
                </button>
            </div>
        );
    };

    return (
        <div className="question">
            <div className="description">{props.question}</div>
            <div className="radio-wrap">
                {props.answers.map((option, index) => {
                    return (
                        <label key={index} className="option">
                            <input
                                type="radio"
                                checked={option === props.currentAnswer}
                                onChange={() => props.onChoiceChange(option)}
                            />
                            {option}
                        </label>
                    );
                })}
            </div>

            {renderResult()}
            {renderOperations()}
        </div>
    );
};
