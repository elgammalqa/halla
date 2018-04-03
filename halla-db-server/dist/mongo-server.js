"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const Mongoose = require("mongoose");
const rabbitJS = __importStar(require("rabbit.js"));
const R = __importStar(require("ramda"));
const User_1 = __importDefault(require("./models/User"));
const Room_1 = __importDefault(require("./models/Room"));
const Message_1 = __importDefault(require("./models/Message"));
class MongoServer {
    constructor() {
        this.channels = {
            SIGNUP_CHANNEL: "SIGNUP_CHANNEL",
            LOGIN_CHANNEL: "LOGIN_CHANNEL",
            CREATE_ROOM: "CREATE_ROOM",
            FETCH_ROOMS: "FETCH_ROOMS",
            FETCH_PEOPLE: "FETCH_PEOPLE",
            DIRECT_CHAT: "DIRECT_CHAT",
            JOIN_ROOM: "JOIN_ROOM",
            FETCH_ROOM_USERS: "FETCH_ROOM_USERS",
            REMOVE_USER_FROM_ROOM: "REMOVE_USER_FROM_ROOM",
            SEND_MESSAGE_TO_ROOM: "SEND_MESSAGE_TO_ROOM",
            SEND_DIRECT_MESSAGE: "SEND_DIRECT_MESSAGE"
        };
        this.createServer = () => {
            Mongoose.connect(MongoServer.MONGODB_DB);
            this.hallaDB = Mongoose.connection;
            this.hallaDB.on("error", () => { console.log("FAILED to connect to mongoose"); });
            this.hallaDB.once("open", console.log);
            this.rabbitMQContext = rabbitJS.createContext(MongoServer.rabbitMQ_SERVER);
            this.rabbitMQContext.on("ready", this.listenClients);
        };
        this.listenReplyToChannel = (CHANNEL, callback) => {
            const REPLY_SOCKET = this.rabbitMQContext.socket("REPLY");
            REPLY_SOCKET.setEncoding("utf8");
            REPLY_SOCKET.connect(CHANNEL, () => {
                REPLY_SOCKET.on("data", (data) => {
                    const dataReceived = JSON.parse(data);
                    console.log("DATA RECIEVED on", CHANNEL, " -> ", dataReceived);
                    callback(dataReceived, REPLY_SOCKET);
                });
            });
        };
        this.listenClients = () => {
            this.listenReplyToChannel(this.channels.LOGIN_CHANNEL, (dataReceived, socket) => {
                User_1.default.authenticate(dataReceived, (err, data) => {
                    if (data !== null) {
                        socket.write(JSON.stringify(data));
                    }
                    else {
                        socket.write(`FAIL`);
                    }
                });
            });
            this.listenReplyToChannel(this.channels.SIGNUP_CHANNEL, (dataReceived, socket) => {
                User_1.default.create(dataReceived, (err, data) => {
                    if (err) {
                        return socket.write(`FAIL`);
                    }
                    const newUser = R.omit(["password"], JSON.parse(JSON.stringify(data)));
                    socket.write(JSON.stringify(newUser));
                });
            });
            this.listenReplyToChannel(this.channels.CREATE_ROOM, (dataReceived, socket) => {
                Room_1.default.create(dataReceived, (err, data) => {
                    if (err) {
                        socket.write(`FAIL`);
                    }
                    else {
                        Room_1.default.find(undefined, (err, data) => {
                            if (err) {
                                socket.write(`FAIL`);
                            }
                            socket.write(JSON.stringify(data));
                        });
                    }
                });
            });
            this.listenReplyToChannel(this.channels.FETCH_ROOMS, (dataReceived, socket) => {
                Room_1.default.find(undefined, (err, data) => {
                    if (err) {
                        socket.write("FAIL");
                    }
                    socket.write(JSON.stringify(data));
                });
            });
            this.listenReplyToChannel(this.channels.FETCH_PEOPLE, (dataReceived, socket) => {
                User_1.default.find(undefined, (err, data) => {
                    if (err) {
                        socket.write("FAIL");
                    }
                    socket.write(JSON.stringify(data));
                });
            });
            this.listenReplyToChannel(this.channels.DIRECT_CHAT, (dataReceived, socket) => {
                Message_1.default.find(dataReceived, (err, messages) => {
                    if (err) {
                        return socket.write(`FAIL`);
                    }
                    socket.write(JSON.stringify(messages));
                });
            });
            this.listenReplyToChannel(this.channels.JOIN_ROOM, (dataReceived, socket) => {
                Room_1.default.findById(dataReceived.id, (err, room) => {
                    if (err) {
                        return socket.write(`FAIL`);
                    }
                    if (room) {
                        Room_1.default.addUser(room, dataReceived.userId, dataReceived.socketId, (err, newRoom) => {
                            if (err) {
                                return socket.write(`FAIL`);
                            }
                            socket.write(JSON.stringify(newRoom));
                        });
                    }
                });
            });
            this.listenReplyToChannel(this.channels.FETCH_ROOM_USERS, (dataReceived, socket) => {
                Room_1.default.getUsers(dataReceived.roomId, dataReceived.userId, (err, users) => {
                    if (err) {
                        return socket.write(`FAIL`);
                    }
                    return socket.write(JSON.stringify(users));
                });
            });
            this.listenReplyToChannel(this.channels.REMOVE_USER_FROM_ROOM, (dataReceived, socket) => {
                Room_1.default.removeUser(dataReceived.socketId, dataReceived.userId, (err, rooms) => {
                    if (err) {
                        return socket.write(`FAIL`);
                    }
                    return socket.write(JSON.stringify(rooms));
                });
            });
            this.listenReplyToChannel(this.channels.SEND_MESSAGE_TO_ROOM, (dataReceived, socket) => {
                Room_1.default.addMessage(dataReceived.roomId, dataReceived.message, (err, room) => {
                    if (err) {
                        return socket.write(`FAIL`);
                    }
                    return socket.write(JSON.stringify(room));
                });
            });
            this.listenReplyToChannel(this.channels.SEND_DIRECT_MESSAGE, (dataReceived, socket) => {
                Message_1.default.create(dataReceived, (err, message) => {
                    if (err) {
                        return socket.write(`FAIL`);
                    }
                    return socket.write(JSON.stringify(message));
                });
            });
        };
        this.createServer();
    }
    getServer() {
        return this.hallaDB;
    }
}
MongoServer.rabbitMQ_SERVER = "amqp://localhost";
MongoServer.MONGODB_DB = "mongodb://localhost/halla_db";
exports.MongoServer = MongoServer;
//# sourceMappingURL=mongo-server.js.map