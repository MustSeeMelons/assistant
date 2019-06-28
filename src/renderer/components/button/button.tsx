import React from "react";
import "./button.scss";

export interface CloseBtnProps {
    onClick?: (event: React.MouseEvent) => void;
    type: "btn-next" | "btn-sleep" | "btn-accept" | "btn-close";
    children?: React.ReactNode;
}

export const Button = (props: CloseBtnProps) => {
    return (
        <button className={props.type} onClick={props.onClick}>
            {props.children}
        </button>
    );
};
