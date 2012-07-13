// http://iamtherockstar.com/blog/2012/02/14/nnodejs-and-socketio-authentication-all-way-down/
"use strict"

var config = require('./config')
	, express = require('express')
	, app = express.createServer()
	, io = require('socket.io')
	, irc = require('irc');

app.configure(function() {
	app.set('views',__dirname+'/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({secret:config.secret, key: config.key}));
	app.use(app.router);
	app.use(express.static(__dirname+'/public'));
});

app.get('/', function(req, res) {
	res.render('index',{
		title: 'Main Page'
	});
});

if(!module.parent) {
app.listen(config.port);
console.log('Server started on port ' + config.port);
}

var io = io.listen(app);
io.set('log level',1);
var mairc = require('./mairc').init(config,io);
