import React from "react";
import "./close-btn.scss";

export interface CloseBtnProps {
    onClick: () => void;
}

export const CloseBtn = (props: CloseBtnProps) => {
    return <button className="close-btn" onClick={props.onClick} />;
};
