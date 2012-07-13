(function() {

	"use strict"
	var ircClient, io, config
		, irc = require('irc')
		, ircStat = {
			status:false,
			channels:{},
		};
	

	function handleNewSocket(socket) {
		socket.emit('status', ircStat);
		socket.addListener('sendMessage', handleClientMessage);
	};

	function handleMotd(message) {
		console.log('sending motd');
		//io.sockets.emit('motd',message);
	};

	function handleMessage(nick, to, text, message) {
		io.sockets.emit('message', {from:nick, to:to, message:text});
	};

	function handleConnection(message) {
		console.log('registerd to the irc Server');
		ircStat.status = true;
		ircStat.nick = message.args[0];
		ircStat.server = config.ircServer;
		io.sockets.emit('connected', ircStat);
	};

	function handleNicks(channel, nicks) {
		ircStat.channels[channel]['nicks'] = nicks
		io.sockets.emit('nicks',{
			'channel' : channel,
			'nicks' : nicks
		})
	}

	function handleJoin(channel, nick, message) {
		if(nick !== ircStat.nick)
			return;
		ircStat.channels[channel] = {status:true , nicks:''};
		io.sockets.emit('join', channel);
		ircClient.list();
	};

	function handlePart(channel, nick, reason, message) {
		if(nick !== ircStat.nick)
			return;
		ircStat.channels[channel]['status'] = false;
		io.sockets.emit('part', channel);
	};

	function handleClientMessage(data) {
		ircClient.say(data.to,data.message);
	};
	
	exports.init = function init(_config, _io) {

		config = _config;	
		io = _io;	

		ircClient = new irc.Client(config.ircServer,config.ircNick,config.irc);
		ircClient.addListener('registered', handleConnection);
		ircClient.addListener('join', handleJoin);
		ircClient.addListener('part', handlePart);
		ircClient.addListener('message', handleMessage);
        ircClient.addListener('names',handleNicks);

		io.sockets.addListener('connection', handleNewSocket);

		return ircClient;
	}

}());
