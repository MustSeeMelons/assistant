import React, { Component } from "react";
import "./root.scss";
import { CloseBtn } from "./close-btn/close-btn";
import { remote, ipcRenderer } from "electron";
import { Clippy } from "./clippy/clippy";
import { Baloon } from "./baloon/baloon";
import * as moment from "moment-business-days";
import "../../../node_modules/roboto-fontface/css/roboto/roboto-fontface.css";
import { Message } from "./message/message";

/**
 * Root component of the app, stores the state.
 */
class Root extends Component {
    targetDate = moment("2019-7-31");

    state = {
        tillTarget: this.targetDate.businessDiff(moment()),
    };

    onCloseHandler = () => {
        const window = remote.getCurrentWindow();
        window.minimize();
    };

    render() {
        const msg = <Message daysLeft={this.state.tillTarget} />;

        return (
            <div className="root">
                <Baloon onCloseHandler={this.onCloseHandler}>{msg}</Baloon>
                <Clippy />
            </div>
        );
    }
}

export { Root };
