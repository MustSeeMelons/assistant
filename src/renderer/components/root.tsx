import React, { Component } from "react";
import ReactDOM from "react-dom";
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
import { EVENTS, AppConfig, ResizeEvent } from "../../definitions";
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
    rootRef: React.RefObject<HTMLDivElement>;
    autoAnswerTimeout: NodeJS.Timeout;
    nextQuestionTimeout: NodeJS.Timeout;

    constructor(props: any) {
        super(props);
        this.setupIpcMainHandler();
        this.rootRef = React.createRef();
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

    componentDidMount = () => {
        this.nextQuestionTimeout = setTimeout(() => {
            this.onNextQuestionHandler();
        }, this.state.config.autoDelay);
    };

    componentDidUpdate = () => {
        const curr = this.rootRef.current;

        ipcRenderer.send(EVENTS.RESIZE, {
            x: curr.clientWidth,
            y: curr.clientHeight,
        } as ResizeEvent);
    };

    componentWillUnmount = () => {
        clearTimeout(this.autoAnswerTimeout);
        clearTimeout(this.nextQuestionTimeout);
    };

    setupIpcMainHandler = () => {
        ipcRenderer.on(EVENTS.CONFIG, (event: any, config: AppConfig) => {
            this.setState({
                config: config,
            });
        });

        ipcRenderer.on(EVENTS.WAKE, (event: any) => {
            this.nextQuestionTimeout = setTimeout(() => {
                this.onNextQuestionHandler();
            }, this.state.config.autoDelay);
        });
    };

    loadAndPrepareQuestions = async (config: AppConfig) => {
        clearTimeout(this.nextQuestionTimeout);

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

            this.autoAnswerTimeout = setTimeout(() => {
                this.autoAnswerHandler(currentQuestion);
            }, this.state.config.autoDelay);
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

    /**
     * Creates a timeout to auto answer a question.
     */
    autoAnswerHandler = (currentQuestion: ProcessedTriviaQuestion) => {
        this.setState({
            currentAnswer: currentQuestion.correct_answer,
            isAnswerCorrect: true,
        });

        this.nextQuestionTimeout = setTimeout(() => {
            this.onNextQuestionHandler();
        }, this.state.config.autoDelay);
    };

    /**
     * Handler for selecting the next question.
     */
    onNextQuestionHandler = () => {
        // Clearing the next question timeout
        clearTimeout(this.nextQuestionTimeout);

        if (_.size(this.state.questions) === 0) {
            this.loadAndPrepareQuestions(this.state.config);
        } else {
            const clonedQuestions = _.cloneDeep(this.state.questions);
            const currentQuestion = _.first(clonedQuestions.splice(0, 1));

            this.autoAnswerTimeout = setTimeout(() => {
                this.autoAnswerHandler(currentQuestion);
            }, this.state.config.autoDelay);

            this.setState({
                questions: clonedQuestions,
                currentQuestion: currentQuestion,
                currentAnswer: undefined,
                isAnswerCorrect: undefined,
            });
        }
    };

    onAcceptAnswerHandler = (event: React.MouseEvent) => {
        // TODO: add class, delay state change
        this.setState({
            isAnswerCorrect:
                this.state.currentAnswer ===
                this.state.currentQuestion.correct_answer,
        });
    };

    onChoiceChange = (choice: string) => {
        if (this.state.isAnswerCorrect === undefined) {
            clearTimeout(this.autoAnswerTimeout);
            this.autoAnswerTimeout = setTimeout(() => {
                this.autoAnswerHandler(this.state.currentQuestion);
            }, this.state.config.autoDelay);

            this.setState({
                currentAnswer: choice,
            });
        }
    };

    /**
     * Resetting state so we get a message on wake.
     */
    onSleepHandler = () => {
        clearTimeout(this.nextQuestionTimeout);
        clearTimeout(this.autoAnswerTimeout);

        this.setState(
            () => {
                return {
                    currentQuestion: undefined,
                    currentAnswer: undefined,
                    isAnswerCorrect: undefined,
                    hasRequestFailed: false,
                    isRequestInProgress: false,
                    questions: [],
                };
            },
            () => {
                ipcRenderer.send(EVENTS.SLEEP);
            }
        );
    };

    renderMessage = () => {
        if (
            !this.state.currentQuestion &&
            !this.state.hasRequestFailed &&
            this.state.config
        ) {
            const message = _.sample(this.state.config.messageConfig);
            return (
                <Message
                    title={message.title}
                    text={message.text}
                    onAccept={() => {
                        this.loadAndPrepareQuestions(this.state.config);
                    }}
                    onDeny={() => {
                        this.onSleepHandler();
                    }}
                />
            );
        }
    };

    /**
     * Renders a trivia question.
     */
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
            <div ref={this.rootRef} className="root">
                <Baloon
                    isRequestInProgress={this.state.isRequestInProgress}
                    onSleepHandler={this.onSleepHandler}>
                    {this.renderMessage()}
                    {this.renderQuestion()}
                    {this.renderError()}
                </Baloon>
                <Clippy />
            </div>
        );
    }
}

export { Root };
