var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000, function(){
	console.log("Listen on port 3000");
});


function gameRoomObject(){

	this.setUserInfo = function(playerId, playerName){
		socket.playerId = playerId;
		socket.playerName = playerName;
	}
	this.getNumberUsers = function(roomId){
		var room = io.sockets.adapter.rooms[roomId];
		if(room){
			var numberPlayers = room.length;
			return numberPlayers;
		} else
		return 0;
	}
}
var gameRoom = new gameRoomObject();

io.on('connection', function(socket){

	socket.on('disconnect', disconnect);
		function disconnect(){}
	
	//join a game room
	socket.on('join_room', join_room);
	function join_room(room, playerId, playerName){
		//the socket will join inside the room
		socket.join(room);
	}

	//check all users ready and start game
	socket.on('ready', ready);
	function ready(characterId, playerLimited, room){
		console.log("ready");
		//check charcter id not null
		if(characterId != null)
			socket.characterId = characterId;

		//check enough people --> start()
		if(gameRoomObject.getNumberUsers(room) == playerLimited)
			start();
	}
	function start(){
		console.log("start");
	}

	//detect the command from users
	socket.on('action_command', action_command);
	function action_command(playerId, characterId, action){}

	//finished the game when one of users died
	socket.on('end_game', end_game);
	function end_game(playerId){}

})