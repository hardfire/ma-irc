var config = {}

config.secret = 'secret';
config.key = 'express.sid';
config.port = 8912;

config.irc = {
    autoRejoin: true
};

config.irc.channels = ['##javascript','#laravel','#wordpress'];

config.ircServer = 'irc.freenode.net'
config.ircNick = 'mairc';

module.exports = config;
