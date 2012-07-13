var irc = (function(window,$,io) {
	"use strict";

	var my={}
		, socket
		, status
		, activeChannel = false
		, tabList = [];


	//linkify function taken from http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
	function linkify(text) {
		// http://, https://, ftp://
		var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

		// www. sans http:// or https://
		var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

		// Email addresses *** here I've changed the expression ***
		var emailAddressPattern = /(([a-zA-Z0-9_\-\.]+)@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6}))+/gim;

		return text
		.replace(urlPattern, '<a target="_blank" href="$&">$&</a>')
		.replace(pseudoUrlPattern, '$1<a target="_blank" href="http://$2">$2</a>')
		.replace(emailAddressPattern, '<a target="_blank" href="mailto:$1">$1</a>');
	};

	//escape html
	function escape(text)
	{
		return $('<div/>').text(text).html();
	}

	//process the message recieved
	function process(message)
	{
		return linkify(escape(message));
	}


	//function to add a new channel
	function addChannel(channel) {
		if(document.getElementById(channel) === null) {
			$('#channels').append(
				$('<li />').append(
						$('<a />').attr('href','#').append(channel).append(
							$('<span />').attr('class','unread').append('0')
						)
					).attr({
						'id' : channel,
						'class' : 'channelList'
					}).click(handleChannelChange)
				);

			$('#talks').append(
				$('<div />').attr({
						'id' : channel+'-box',
						'class' : 'talksdiv'
					})
				);
		}
	}

	//function to remove a channel
	function removeChannel(channel) {
		if(document.getElementById(channel) !== null) {
			$(document.getElementById(channel)).remove();
			$(document.getElementById(channel+'-box')).remove();
		}
	}

	//initially create all the channels
	function createChannels() {
		var channel;
		for(channel in status.channels) {
			addChannel(channel);
		}
	}

	// update the app when connected to the IRC Server
	function initializeApp() {
		var channel, names;
		createChannels();
		for(channel in status.channels) {
			console.log(channel);
			for(names in status.channels[channel].nicks) {
				if(tabList[channel] === undefined)
				{
					tabList[channel] = [];
				}
				tabList[channel].push(names);
			}
		}
		console.log(tabList);
	}

	//handle the nicks
	function handleNicks(data) {
		var name;
		console.log('got new nicks');
		for(name in data.nicks)
		{
			if(tabList[data.channel] === undefined)
			{
				tabList[data.channel] = [];
			}
        	tabList[data.channel].push(name);
		}
		status.channels[data.channel]['nicks'] = data.nicks
	}

	// update the status initially or after t'))server is connected to the server
	function setStatus(data) {
		status = data;
		console.log(data);
		if(status.status == true) {
			initializeApp();
		}
	}

	//add message to requried tab
	
	function handleMessage(data){
		var message;
		if(document.getElementById(data.to+'-box') !== null) {
			var el = $(document.getElementById(data.to+'-box')),
				elList = $(document.getElementById(data.to));
			if(elList.hasClass('active') === false) {
				elList.find('span.unread').html(parseInt(elList.find('span.unread').html())+1);
			}
			message = process(data.message)	;
			el.append('<p><strong>'+data.from+' : </strong> '+message+'</p>');
		}
	}

	//handle when the irc server joins a new channel	
	function handleJoin(channel) {
		status.channels[channel] = {status:true, nicks:''}
		addChannel(channel);
	}
	
	//handle when the irc server is disconnected from a channel
	function handlePart(channel) {
		removeChannel(channel);
	}

	function handleChannelChange(){
		activeChannel = $(this).attr('id');
		$('.channelList.active').removeClass('active');
		$(this).addClass('active');
		$(this).find('span.unread').html('0');
		$('.talksdiv.active').removeClass('active');
		$(document.getElementById(activeChannel+'-box')).addClass('active');
	}

	function sendMessage(event) {
		if(activeChannel !== false)
		{
			var keypressed = event.keyCode || event.which
				, message,
				toSend;
			if(keypressed == 9)
			{
				console.log('tab pressed');
				var text = this.value
					, length = this.value.length
					, pos = text.lastIndexOf(' ') + 1 
					, str = text.slice(pos)
					, complete;
				complete = autocomplete(str);
				console.log('got somethign');
				console.log(complete);
				if(complete !== false)
				{
					text = text.substr(0, pos) + complete + text.substr(pos + complete.length );
					$(this).val(text);
					window.setTimeout(
							function() {
								$('#message').focus();
							},1000);
				}
				return false;
			}
			if (keypressed == 13) {
				message = $(this).val();
				if(message != '') {
					toSend = {
						from : status.nick,
						to : activeChannel,
						message : message
					};
					socket.emit('sendMessage', toSend);
					handleMessage(toSend);
					$(this).val('');
					$(this).focus();
				}
			}
		}
	}


	// from http://stackoverflow.com/questions/1837555/ajax-autocomplete-or-autosuggest-with-tab-completion-autofill-similar-to-shell
	function autocomplete(input) {
	    var data = tabList[activeChannel]
			, candidates = []
			, returnVal;
			// filter data to find only strings that start with existing value
			for (var i=0; i < data.length; i++) {
				if (data[i].indexOf(input) == 0 && data[i].length > input.length)
					candidates.push(data[i])
			}

		if (candidates.length > 0) {
			// some candidates for autocompletion are found
			if (candidates.length == 1) returnVal = candidates[0]
			else returnVal = longestInCommon(candidates, input.length)
				return returnVal
		}
		return false
	}

	function longestInCommon(candidates, index) {
		var i, ch, memo
			do {
				memo = null
					for (i=0; i < candidates.length; i++) {
						ch = candidates[i].charAt(index)
							if (!ch) break
								if (!memo) memo = ch
								else if (ch != memo) break
					}
			} while (i == candidates.length && ++index)

		return candidates[0].slice(0, index)
	}


	my.init = function() {
		socket = io.connect('http://localhost');

		//handle socket events
		socket.on('status', setStatus);
		socket.on('connected', setStatus);
		socket.on('join', handleJoin);
		socket.on('part', handlePart);
		socket.on('message', handleMessage);
		socket.on('nicks', handleNicks);

		//handle UI evnets
		$("#message").keydown(sendMessage);
		
	};

	return my;
}(window,$,io));

$(irc.init);
