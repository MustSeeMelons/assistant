import React from "react";
import "./message.scss";
import { Button } from "../button/button";

export interface MessageProps {
    title: string;
    text: string;
    onAccept: (event: React.MouseEvent) => void;
    onDeny: (event: React.MouseEvent) => void;
}

export const Message = (props: MessageProps) => {
    return (
        <div className="message">
            <div className="m-title">{props.title}</div>
            <div className="m-content">{props.text} </div>
            <div className="m-operations">
                <Button type="btn-next" onClick={props.onAccept}>
                    Fine
                </Button>
                <Button type="btn-sleep" onClick={props.onDeny}>
                    Go away
                </Button>
            </div>
        </div>
    );
};
