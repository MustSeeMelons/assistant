import React from "react";
import "./baloon.scss";
import { CloseBtn } from "../close-btn/close-btn";

export interface BallonProps {
    children: React.ReactNode;
    onCloseHandler: () => void;
}

export const Baloon = (props: BallonProps) => {
    return (
        <div className="baloon">
            <CloseBtn onClick={props.onCloseHandler} />
            <div className="b-contnet">{props.children}</div>
        </div>
    );
};
