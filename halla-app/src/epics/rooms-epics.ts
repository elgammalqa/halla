import { combineEpics, ActionsObservable } from "redux-observable";
import { sendMessage } from "../websockets/websocket";
import { ROOMS_NSC, CHATROOM_NSC } from "../../halla-shared/src/Namespaces";
import { Observable } from "rxjs/Observable";
import { CREATE_ROOM, FETCH_ROOMS, CREATE_ROOM_SUCCESSFUL, CREATE_ROOM_FAIL, JOIN_ROOM } from "../../halla-shared/src/Actions";
import { addNotification } from "../actions/auth";
import { fetchRooms } from "../actions/RoomsList";

const createRoomEpic = (action$: ActionsObservable<any>, store) =>
	action$.ofType(CREATE_ROOM)
	.do(({payload}) => {
		sendMessage({
			route: CREATE_ROOM,
			message: {
				title: payload,
				admin: store.getState().auth.user.username
			}
		}, ROOMS_NSC);
	})
	.switchMap(() =>
		Observable.race(
			action$.ofType(CREATE_ROOM_SUCCESSFUL)
				.take(1)
				.switchMap(({payload: {title, admin}}) => Observable.concat(
					Observable.of(addNotification({type: "success", title: "Room created!", message: `Room ${title} added by ${admin}!`})),
					Observable.of(fetchRooms())
				))
			,
			action$.ofType(CREATE_ROOM_FAIL)
				.take(1)
				.map(() => addNotification({type: "error", title: "Error!", message: "A room with the name exists!"}))
		)
	);

export const updateRoomsEpic = (action$: ActionsObservable<any>) =>
	action$.ofType(CREATE_ROOM_SUCCESSFUL)
		.switchMap(({payload: {title, admin}}) => Observable.concat(
			Observable.of(addNotification({type: "success", title: "Room created!", message: `Room ${title} added by ${admin}!`})),
			Observable.of(fetchRooms())
		));

export const fetchRoomsEpic = (action$: ActionsObservable<any>) =>
	action$.ofType(FETCH_ROOMS)
		.do(() => sendMessage({route: FETCH_ROOMS}, ROOMS_NSC))
		.ignoreElements();


export const joinRoomEpic = (action$: ActionsObservable<any>, store) =>
	action$.ofType(JOIN_ROOM)
		.do(({payload}) => {
			sendMessage({
				route: JOIN_ROOM,
				message: {
					id: payload,
					userId: store.getState().auth.user._id
				}
			}, CHATROOM_NSC);
		})
		.ignoreElements();

export const roomsEpics = combineEpics(
	createRoomEpic,
	updateRoomsEpic,
	fetchRoomsEpic,
	joinRoomEpic
);