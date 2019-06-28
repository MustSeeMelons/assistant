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
import { EVENTS } from "../../definitions";

interface RootState {
    tillTarget: number;
    questions: Array<ProcessedTriviaQuestion>;
    hasRequestFailed: boolean;
    isRequestInProgress: boolean;
    currentQuestion?: ProcessedTriviaQuestion;
    currentAnswer?: string;
    isAnswerCorrect?: boolean;
}

class Root extends Component {
    targetDate = moment("2019-07-31", "YYYY-MM-DD");

    constructor(props: any) {
        super(props);
        this.setupIpcMainHandler();
    }

    state: RootState = {
        tillTarget: this.targetDate.businessDiff(moment()),
        hasRequestFailed: false,
        questions: [],
        currentQuestion: undefined,
        currentAnswer: undefined,
        isAnswerCorrect: undefined,
        isRequestInProgress: false,
    };

    setupIpcMainHandler = () => {
        ipcRenderer.on(EVENTS.SLEEP, () => {
            console.log("hello")
            this.loadAndPrepareQuestions();
        });
    };

    componentDidMount = async () => {
        this.loadAndPrepareQuestions();
    };

    loadAndPrepareQuestions = async () => {
        try {
            this.setState({
                isRequestInProgress: true,
            });

            const questions: Array<
                ProcessedTriviaQuestion
            > = await fetchTriviaQuestions();
            const currentQuestion = _.first(questions.splice(0, 1));

            this.setState({
                questions: questions,
                hasRequestFailed: false,
                currentQuestion: currentQuestion,
                isRequestInProgress: false,
                currentAnswer: undefined,
                isAnswerCorrect: undefined,
            });
        } catch (e) {
            this.setState({
                hasRequestFailed: false,
                isRequestInProgress: false,
            });
        }
    };

    onNextQuestionHandler = () => {
        if (_.size(this.state.questions) === 0) {
            this.loadAndPrepareQuestions();
        } else {
            const clonedQuestions = _.cloneDeep(this.state.questions);
            const currentQuestion = _.first(clonedQuestions.splice(0, 1));

            this.setState({
                questions: clonedQuestions,
                currentQuestion: currentQuestion,
                currentAnswer: undefined,
                isAnswerCorrect: undefined,
            });
        }
    };

    onCloseHandler = (event: React.MouseEvent) => {
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

    onSleepHandler = () => {
        this.setState({
            currentQuestion: undefined,
            currentAnswer: undefined,
            isAnswerCorrect: undefined,
        });

        ipcRenderer.send(EVENTS.SLEEP);
    };

    render() {
        let child;
        if (this.state.currentQuestion) {
            child = (
                <Question
                    onSleepHandler={this.onSleepHandler}
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
                <Baloon
                    isRequestInProgress={this.state.isRequestInProgress}
                    onCloseHandler={this.onCloseHandler}>
                    {child}
                </Baloon>
                <Clippy />
            </div>
        );
    }
}

export { Root };
