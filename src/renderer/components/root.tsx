import React, { Component } from "react";
import "./root.scss";
import _ from "lodash";
import { ipcRenderer } from "electron";
import { Clippy } from "./clippy/clippy";
import { Baloon } from "./baloon/baloon";
import "../../../node_modules/roboto-fontface/css/roboto/roboto-fontface.css";
import { ProcessedTriviaQuestion, API, TriviaApi } from "../api/api";
import { Question } from "./question/question";
import { EVENTS, IAppConfig, IResizeEvent, IMessage } from "../../definitions";
import { Error } from "./error/error";
import { Message } from "./message/message";

interface RootState {
    questions: Array<ProcessedTriviaQuestion>;
    hasRequestFailed: boolean;
    isRequestInProgress: boolean;
    currentQuestion?: ProcessedTriviaQuestion;
    currentAnswer?: string;
    isAnswerCorrect?: boolean;
    config?: IAppConfig;
    message: IMessage;
}

class Root extends Component {
    api: TriviaApi = API();
    rootRef: React.RefObject<HTMLDivElement>; // for getting dimensions for the resize event
    autoAnswerTimeout: NodeJS.Timeout;
    nextQuestionTimeout: NodeJS.Timeout;

    constructor(props: any) {
        super(props);
        this.setupIpcMainHandler();
        this.rootRef = React.createRef();
    }

    state: RootState = {
        hasRequestFailed: false,
        questions: [],
        currentQuestion: undefined,
        currentAnswer: undefined,
        isAnswerCorrect: undefined,
        isRequestInProgress: false,
        message: undefined
    };

    componentDidMount = () => {
        if (this.state.config) {
            this.nextQuestionTimeout = setTimeout(() => {
                this.onNextQuestionHandler();
            }, this.state.config.autoDelay);
        }
    };

    // Sending the dimenstions on every update
    componentDidUpdate = () => {
        const curr = this.rootRef.current;

        ipcRenderer.send(EVENTS.RESIZE, {
            x: curr.clientWidth,
            y: curr.clientHeight,
        } as IResizeEvent);
    };

    componentWillUnmount = () => {
        clearTimeout(this.autoAnswerTimeout);
        clearTimeout(this.nextQuestionTimeout);
    };

    selectMessage = () => {
        this.setState({
            message: _.cloneDeep(_.sample(this.state.config.messageConfig))
        });
    }

    /**
     * Setting up event listeners
     * @memberof Root
     */
    setupIpcMainHandler = () => {
        ipcRenderer.on(EVENTS.CONFIG, (event: any, config: IAppConfig) => {
            this.setState({
                config: config,
                message: _.cloneDeep(_.sample(config.messageConfig))
            });

            this.nextQuestionTimeout = setTimeout(() => {
                this.onNextQuestionHandler();
            }, config.autoDelay);
        });

        ipcRenderer.on(EVENTS.WAKE, (event: any) => {
            this.selectMessage();
            this.nextQuestionTimeout = setTimeout(() => {
                this.onNextQuestionHandler();
            }, this.state.config.autoDelay);
        });
    };

    loadAndPrepareQuestions = async (config: IAppConfig) => {
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

        // Fetch new questions if we don't have any left
        if (_.size(this.state.questions) === 0) {
            this.loadAndPrepareQuestions(this.state.config);
        } else {
            // We cant modify state directly, so we need to clone it, modify it, set it
            const clonedQuestions = _.cloneDeep(this.state.questions);
            const currentQuestion = _.first(clonedQuestions.splice(0, 1));

            this.autoAnswerTimeout = setTimeout(() => {
                clearTimeout(this.autoAnswerTimeout);

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
        clearTimeout(this.autoAnswerTimeout);
        clearTimeout(this.nextQuestionTimeout);

        this.nextQuestionTimeout = setTimeout(() => {
            this.onNextQuestionHandler();
        }, this.state.config.autoDelay);

        this.setState({
            isAnswerCorrect:
                this.state.currentAnswer ===
                this.state.currentQuestion.correct_answer,
        });
    };

    onChoiceChange = (choice: string) => {
        if (this.state.isAnswerCorrect === undefined) {
            clearTimeout(this.autoAnswerTimeout);

            // If user selected answer and left, lets auto answer it for him
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
            return (
                <Message
                    title={this.state.message.title}
                    text={this.state.message.text}
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
