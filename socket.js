var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var findIndex = require('array.prototype.findindex');

server.listen(3000, function(){
	console.log("====Listened on port 3000====");
});


function gameRoomObject(){

	this.setUserInfo = function(playerName, numberPlayers, title, socket){
		socket.playerName = playerName;
		socket.players = numberPlayers;
		socket.roomtitle = title;
	}
	this.setGameRoom = function(socket){
		socket.join(socket.id);
		var info = {
			roomId: socket.id,
			username: socket.playerName,
			numberPlayers: socket.players,
			gameRoomTitle: socket.roomtitle
		}
		//store all gamerooms into existed room
		try {
			var room = io.sockets.adapter.rooms["existed_room"];
			room.push(info);
		} catch(e) {
			// statements
			io.sockets.adapter.rooms["existed_room"] = [];
			var room = io.sockets.adapter.rooms["existed_room"];
			room.push(info);			
		}
	}
	this.getUsersInfo = function(roomId){
		try{
			var clients = io.sockets.adapter.rooms[roomId].sockets;
			var playerNames = [];
			console.log("###### CLIENT ID INSIDE GAMEROOM #######");
			for(var clientId in clients){
				console.log(clientId);
				var clientSocket = io.sockets.connected[clientId];
				console.log(clientSocket.playerName);
				playerNames.push(clientSocket.playerName);
			}
			console.log("########################################");
			return playerNames;
		} catch(err){
			console.log("error occur");
			return null;
		}
	}
	this.checkPlayerStatus = function(roomId){
		try{
			var invalid = false
			var count = 0
			var clients = io.sockets.adapter.rooms[roomId].sockets;
			console.log(clients);
			for(var clientId in clients){
				var clientSocket = io.sockets.connected[clientId];
				if(!clientSocket.status) invalid = true;
				console.log("client status = ", clientSocket.status)
				count++;
			}
			console.log(count);
			if(count != 2) invalid = true;
			return invalid;
		} catch(err){
			console.log("error occur inisde checkPlayerStatus");
			return true;
		}
	}
	this.getNumberUsers = function(roomId){
		var room = io.sockets.adapter.rooms[roomId];
		if(room){
			var numberPlayers = room.length;
			return numberPlayers;
		} else
		return 0;
	}
	this.getAllGameRooms = function(){
		// object rooms
		// {
		// 	roomId: socket.id,
		// 	username: socket.playerName,
		// 	numberPlayers: socket.players
		// 	//gameRoomTitle: socket.roomTitls
		// }
		var rooms = io.sockets.adapter.rooms["existed_room"];
		console.log("===  existed room ===");
		console.log(rooms);
		console.log("=====================");
		return rooms;
	}
	this.destroyGameRoom = function(roomId){
		var rooms = io.sockets.adapter.rooms["existed_room"];
		console.log("before rooms: ", rooms);
		var index = rooms.findIndex(function(x){ return x.roomId == roomId});
		console.log("index: ", index);
		rooms.splice(index, 1);
		console.log("after rooms: ", rooms);
		console.log("====== Below are the current room ======");

	}
}
var gameRoom = new gameRoomObject();

//how to play with socket

    // send a private message to the socket with the given id
    //client.broadcast.to(id).emit('my message', msg);

    // broadcasted to clients that have joined the given room.
    // to one room
  	//client.to('others').emit('an event', { some: 'data' });
  	// to multiple rooms
  	//client.to('room1').to('room2').emit('hello'); 

//connect room in namescape
		//io.of('/district').on('connection', function(socket){
		//	    socket.join('city');
		//});

io.on('connection', function(socket){

	console.log("==============================");
	console.log("make connection done");
	console.log("socketod: ", socket.id);
	console.log("==============================");

	socket.on('reconnecting', function(){
		console.log("========= SOCKET RECONNECTING =========");
	});

	socket.on('reconnect', function(){
		console.log("========= SOCKET RECONNECT SUCCESSFULLY =========");
	});

	socket.on('connect_failed', function() {
	    console.log("========= RECONNECT FAILED =========");
	});	

	socket.on('disconnect', disconnect);
	function disconnect(data){
		console.log("disconnected");
		socket.leave(data.roomid);
		if(gameRoom.getUsersInfo(data.roomid) != null){
			//still have user inside the room 
			socket.to(data.roomid).emit("leave_room", {username: socket.playerName});
		} else{
			//destroy the gameroom, socket io automatically distroy gameroom when it is null value
			gameRoom.destroyGameRoom(data.roomid);
		}
		//socket.disconnect(tr);
	}
	
	//create a game room
	socket.on('create_room', create_room);
	function create_room(data){
		//the socket will join inside the room
		gameRoom.setUserInfo(data.username, data.numberOfPlayers, data.title, socket);
		gameRoom.setGameRoom(socket);
		console.log("======= CREATE ROOM STAGE ========");
		console.log("roomid: " , socket.id);
		console.log("socket rooms: ", socket.rooms);
		console.log("==================================");
		//return item should be json
		socket.emit("create_room", {"socket" : socket.id, "title": data.title });
	}

	//join a gamae room dashboard
	socket.on('join_room_dashboard', join_room_dashboard);
	function join_room_dashboard(data){
		socket["playerName"] = data.username;
		var gameRooms = gameRoom.getAllGameRooms();
		socket.emit("join_room_dashboard", {gameRooms: gameRooms});
	}

	socket.on('join_room', join_room);
	function join_room(data){
		socket.join(data.roomid, function(){
			var userInfo = gameRoom.getUsersInfo(data.roomid);
			console.log("========== JOIN ROO STAGE ============");
			console.log("socketid: ", socket.id);
			console.log("roomid: ", data.roomid);
			console.log("socket rooms: ", socket.rooms);
			console.log("=======================================");
			socket.to(data.roomid).emit('join_room', {user: socket.playerName})			
		});
	}

	//send message in the chat room
	socket.on('send_message', send_message);
	function send_message(data){
		var message = data.msg;
		console.log("======== send_message ========");
		console.log("message: ", message);
		console.log("username: ", socket.playerName);
		console.log("roomid: ", data.roomid);
		console.log("userinfo: ", gameRoom.getUsersInfo(data.roomid));
		console.log("socket rooms: ", socket.rooms);
		console.log("==============================");
		socket.to(data.roomid).emit('get_message', {msg: data.msg, "username": socket.playerName})
	}

	//broadcast selected character
	socket.on('image_broadcast', image_broadcast);
	function image_broadcast(data){
		console.log("image socket: ", socket.id);
		console.log("data: ", data);
		console.log(data.roomid);
		console.log(data.character);
		socket.to(data.roomid).emit('get_character', {character: data.character})
	}


	//check all users ready and start game
	socket.on('ready', ready);
	function ready(data){
		console.log("====== Ready =======");
		console.log(data);
		socket.character = data.character;
		socket.status = true;
		//check number of players in room and the status of other players
		if(!gameRoom.checkPlayerStatus(data.roomid)){
			//Start the game
			console.log("Start Game");
			io.in(data.roomid).emit('start_game');
		}


	}

	//shooting effecting
	socket.on('shooting', shooting);
	function shooting(data){
		console.log("=============== Shooting ===================");
		console.log(data);
		socket.to(data.roomid).emit('shooting', {command: "i am shooting"})
	}

	//movement
	socket.on('movement', movement);
	function movement(data){
		console.log("=============== Shooting ===================");
		console.log(data);
		socket.to(data.roomid).emit('movement', {horizontal: data.horizontal, vertical: data.vertical})
	}	

	//detect the command from users
	socket.on('action_command', action_command);
	function action_command(playerId, characterId, action){}

	//finished the game when one of users died
	socket.on('end_game', end_game);
	function end_game(playerId){}

})