import React, { Component } from "react";
import _ from "lodash";
import "./root.scss";
import { remote, ipcRenderer } from "electron";
import { Clippy } from "./clippy/clippy";
import { Baloon } from "./baloon/baloon";
import * as moment from "moment-business-days";
import "../../../node_modules/roboto-fontface/css/roboto/roboto-fontface.css";
import { Message } from "./message/message";
import { ProcessedTriviaQuestion, API, TriviaApi } from "../api/api";
import { Question } from "./question/question";
import { EVENTS, AppConfig } from "../../definitions";
import { Error } from "./error/error";

interface RootState {
    tillTarget: number;
    questions: Array<ProcessedTriviaQuestion>;
    hasRequestFailed: boolean;
    isRequestInProgress: boolean;
    currentQuestion?: ProcessedTriviaQuestion;
    currentAnswer?: string;
    isAnswerCorrect?: boolean;
    config?: AppConfig;
}

class Root extends Component {
    targetDate = moment("2019-07-31", "YYYY-MM-DD");
    api: TriviaApi = API();
    retryTimeout: NodeJS.Timeout;

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

    componentWillUnmount = () => {
        if (this.retryTimeout) {
            this.retryTimeout.unref();
        }
    };

    setupIpcMainHandler = () => {
        ipcRenderer.on(EVENTS.SLEEP, () => {
            this.loadAndPrepareQuestions(this.state.config);
        });

        ipcRenderer.on(EVENTS.CONFIG, (event: any, config: AppConfig) => {
            this.setState({
                config: config,
            });

            this.loadAndPrepareQuestions(config);
        });
    };

    loadAndPrepareQuestions = async (config: AppConfig) => {
        try {
            this.setState({
                isRequestInProgress: true,
            });

            const questions: Array<
                ProcessedTriviaQuestion
            > = await this.api.fetchTriviaQuestions(config.questionAmount);

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
                hasRequestFailed: true,
                isRequestInProgress: false,
            });

            setTimeout(() => {
                this.loadAndPrepareQuestions(this.state.config);
            }, config.sleepTime);
        }
    };

    onNextQuestionHandler = () => {
        if (_.size(this.state.questions) === 0) {
            this.loadAndPrepareQuestions(this.state.config);
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

    renderGoodbye = () => {
        if (!this.state.currentQuestion && !this.state.hasRequestFailed) {
            return <Message daysLeft={this.state.tillTarget} />;
        }
    };

    renderQuestion = () => {
        if (this.state.currentQuestion && !this.state.hasRequestFailed) {
            return (
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
        }
    };

    renderError = () => {
        if (this.state.hasRequestFailed) {
            return <Error />;
        }
    };

    render() {
        return (
            <div className="root">
                <Baloon
                    isRequestInProgress={this.state.isRequestInProgress}
                    onCloseHandler={this.onCloseHandler}>
                    {this.renderGoodbye()}
                    {this.renderQuestion()}
                    {this.renderError()}
                </Baloon>
                <Clippy />
            </div>
        );
    }
}

export { Root };
