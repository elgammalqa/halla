import { combineEpics } from "redux-observable";
import { websocketEpics } from "./websocket-epics";
import { authEpics } from "./auth-epics";
import { roomsEpics } from "./rooms-epics";
import { notificationEpics } from "./notifications-epics";
import { chatRoomEpics } from "./chatRoom-epics";
import { peopleEpics } from "./people-epics";

export const rootEpic = combineEpics(
	websocketEpics,
	authEpics,
	roomsEpics,
	notificationEpics,
	chatRoomEpics,
	peopleEpics
);