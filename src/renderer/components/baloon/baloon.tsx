import React from "react";
import "./baloon.scss";
import { CloseBtn } from "../close-btn/close-btn";
import { Spinner } from "../spinner/spinner";
import classNames from "classnames";

export interface BallonProps {
    children: React.ReactNode;
    onCloseHandler: () => void;
    isRequestInProgress: boolean;
}

export const Baloon = (props: BallonProps) => {
    return (
        <div
            className={classNames("baloon", {
                "in-progress": props.isRequestInProgress,
            })}>
            <CloseBtn onClick={props.onCloseHandler} />
            {props.isRequestInProgress && <Spinner />}
            <div className="b-contnet">{props.children}</div>
        </div>
    );
};
