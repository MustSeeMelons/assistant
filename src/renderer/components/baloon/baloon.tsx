import React from "react";
import "./baloon.scss";
import { Button } from "../button/button";
import { Spinner } from "../spinner/spinner";
import classNames from "classnames";

export interface BallonProps {
    children: React.ReactNode;
    onSleepHandler: (event: React.MouseEvent) => void;
    isRequestInProgress: boolean;
}

export const Baloon = (props: BallonProps) => {
    return (
        <div
            className={classNames("baloon", {
                "in-progress": props.isRequestInProgress,
            })}>
            <Button type="btn-close" onClick={props.onSleepHandler} />
            {props.isRequestInProgress && <Spinner />}
            <div className="b-contnet">{props.children}</div>
        </div>
    );
};
