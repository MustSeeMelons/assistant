import React, { Component } from "react";
import _ from "lodash";
import "./root.scss";
import { remote, ipcRenderer } from "electron";
import { Clippy } from "./clippy/clippy";
import { Baloon } from "./baloon/baloon";
import * as moment from "moment-business-days";
import "../../../node_modules/roboto-fontface/css/roboto/roboto-fontface.css";
import { Message } from "./message/message";
import { ProcessedTriviaQuestion, fetchTriviaQuestions } from "../api/api";
import { Question } from "./question/question";

interface RootState {
    tillTarget: number;
    questions: Array<ProcessedTriviaQuestion>;
    hasRequestFailed: boolean;
    currentQuestion?: ProcessedTriviaQuestion;
    currentAnswer?: string;
    isAnswerCorrect?: boolean;
}

class Root extends Component {
    targetDate = moment("2019-7-31");

    state: RootState = {
        tillTarget: this.targetDate.businessDiff(moment()),
        hasRequestFailed: false,
        questions: [],
        currentQuestion: undefined,
        currentAnswer: undefined,
        isAnswerCorrect: undefined,
    };

    componentDidMount = async () => {
        try {
            const questions: Array<
                ProcessedTriviaQuestion
            > = await fetchTriviaQuestions();
            const currentQuestion = _.first(questions.splice(0, 1));

            this.setState({
                questions: questions,
                hasRequestFailed: false,
                currentQuestion: currentQuestion,
            });
        } catch (e) {
            console.log(e);
            this.setState({
                hasRequestFailed: true,
            });
        }
    };

    onNextQuestionHandler = async () => {
        if(_.size(this.state.questions) > 0) {
            const clonedQuestions = _.cloneDeep(this.state.questions);
            const currentQuestion = _.first(clonedQuestions.splice(0, 1));

            this.setState({
                questions: clonedQuestions,
                currentQuestion: currentQuestion,
                currentAnswer: undefined,
                isAnswerCorrect: undefined,
            })
        } else {
            // TODO: fetch moar questions
        }
    }

    onCloseHandler = () => {
        const window = remote.getCurrentWindow();
        window.minimize();
    };

    onAcceptAnswerHandler = (event: React.MouseEvent) => {
        this.setState({
            isAnswerCorrect:
                this.state.currentAnswer ===
                this.state.currentQuestion.correct_answer,
        });
    };

    onChoiceChange = (choice: string) => {
        if (this.state.isAnswerCorrect === undefined) {
            this.setState({
                currentAnswer: choice,
            });
        }
    };

    render() {
        let child;
        if (this.state.currentQuestion) {
            child = (
                <Question
                    isAnswerCorrect={this.state.isAnswerCorrect}
                    currentAnswer={this.state.currentAnswer}
                    onChoiceChange={this.onChoiceChange}
                    onAcceptAnswer={this.onAcceptAnswerHandler}
                    onNextQuestionHandler={this.onNextQuestionHandler}
                    {...this.state.currentQuestion}
                />
            );
        } else {
            child = <Message daysLeft={this.state.tillTarget} />;
        }

        return (
            <div className="root">
                <Baloon onCloseHandler={this.onCloseHandler}>{child}</Baloon>
                <Clippy />
            </div>
        );
    }
}

export { Root };
