import React from "react";
import "./message.scss";

export interface MessageProps {
    daysLeft: number;
}

export const Message = (props: MessageProps) => {
    return (
        <div className="message">
            <div className="m-title">Did you know?</div>
            <div className="m-content">{`That Jānis only has ${
                props.daysLeft
            } days to work left?`}</div>
        </div>
    );
};
