import { SocketServer } from "../socket-server";
import * as R from "ramda";
import * as rabbitJS from "rabbit.js";
import { PushSocket, ReqSocket, RepSocket } from "rabbit.js";

export class Client {
    private socket: SocketIO.Socket;
    private rabbitMQContext: rabbitJS.Context;

    private channels = {
        TEST: "TEST",
        SIGNUP_CHANNEL: "SIGNUP_CHANNEL",
        LOGIN_CHANNEL: "LOGIN_CHANNEL",
    };

    constructor(socket: SocketIO.Socket, rabbitMQContext: rabbitJS.Context) {
        this.socket = socket;
        this.rabbitMQContext = rabbitMQContext;

        this.setupHandlers();
        // this.test();
    }

    test = () => {

        this.requestToChannel(this.channels.TEST, {
            username: "chintu",
            password: "chintu",
            emailId: "blah"
        }, (data: string) => {
            console.log(JSON.stringify(data));
        });

    }

    setupHandlers = () => {
        this.socket.emit("connected", this.socket.id);

        R.forEachObjIndexed((handle, eventName) => {
            this.socket.on(eventName, handle);
        })(this.handlers);
    }

    handleLogin = (message: any) => {
        console.log("SUBMIT_LOGIN", message);

        this.requestToChannel(this.channels.LOGIN_CHANNEL, message, (response: string) => {
            if (response === "SUCCESS") {
                this.socket.emit("LOGIN_SUCCESS", message);
            }

            if ( response === "FAIL") {
                this.socket.emit("LOGIN_FAIL", response);
            }
        });
    }

    handleSignUp = (message: any) => {
        console.log("SUBMIT_SIGNUP", message);

        this.requestToChannel(this.channels.SIGNUP_CHANNEL, message, (response: string) => {
            if (response === "SUCCESS") {
                this.socket.emit("SIGNUP_SUCCESS", message);
            }

            if ( response === "FAIL") {
                this.socket.emit("SIGNUP_FAIL", response);
            }
        });
    };

    handleLogout = (message: any) => {
        console.log("LOGOUT", message);
    }

    requestToChannel = (CHANNEL: string, message: any, callback: Function) => {
        const REQ_SOCKET: ReqSocket = this.rabbitMQContext.socket("REQ", {expiration: 10000});
        REQ_SOCKET.setEncoding("utf8");

        REQ_SOCKET.connect(CHANNEL, () => {

            REQ_SOCKET.write(JSON.stringify(message));
            REQ_SOCKET.on("data", (message: string) => {
                console.log(message);
                callback(message);
                setTimeout(() => {
                    REQ_SOCKET.close();
                }, 1000);
            });

        });
    }

    public handlers: any = {
        SUBMIT_LOGIN: this.handleLogin,
        SUBMIT_SIGNUP: this.handleSignUp,
        LOGOUT: this.handleLogout
    };
}