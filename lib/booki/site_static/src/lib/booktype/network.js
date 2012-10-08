define('booktype/network', ['jquery'], 
//define('booktype/network', ['/site_static/src/lib/vendor/jquery-1.7.2.js'], 
       
	   function(jQuery) {
	       var jQuery = $;
	       var BOOKTYPE = window.BOOKTYPE || {};
    
	       BOOKTYPE._network = {};
    
	       BOOKTYPE._network._results = null;
	       BOOKTYPE._network._lastAccess = null;
	       BOOKTYPE._network._isInitialized = false;
	       BOOKTYPE._network._messages = null;
	       BOOKTYPE._network._uid = 1;
	       BOOKTYPE._network.options = {'poll': true,
					    'iteration': 5000};    
	       
	       BOOKTYPE._network._subscribedChannels = null;

	       function Sputnik() {
		   this.init();
	       }
	       
	       jQuery.extend(Sputnik.prototype, {
		   showError: function() {
                    },
		    
		   init: function() {
		       var $this = this;

		       BOOKTYPE._network._messages = new Array();
		       BOOKTYPE._network._results  = new Array();
		       BOOKTYPE._network._subscribedChannels = new Array();
		   },
		    
		   connect: function(_options) {
		       var $this = this;
		       if(_options) {
			   // XXX requirements differ between parts of client
			   // jQuery.extend(options, _options);
		       }
		       
		       if (BOOKTYPE._network._isInitialized) return;

		       this.interval();
		       
		       BOOKTYPE._network._isInitialized = true;
		       
		       var channels = new Array(); 
		       
		       for(var key in BOOKTYPE._network._subscribedChannels) {
			   // this sux
			   if(key != "isArray" && key != "contains" && key != "append")
			       channels.push(key);
		       }
		       
		       BOOKTYPE._network._messages = $.merge([{"channel": "/booki/",
							       "command": "connect",
							       "uid": BOOKTYPE._network._uid,
							       "channels": channels}], 
							     BOOKTYPE._network._messages);
		       BOOKTYPE._network._results[BOOKTYPE._network._uid] = [function(result) {
			   BOOKTYPE.clientID = result.clientID;
			   $this.sendData();
		       }, null];
		       
		       BOOKTYPE._network._uid += 1;
		       
		       this.sendData();
		   },
		   
		   subscribeToChannel: function(channelName, callback) {
		       var ch = BOOKTYPE._network._subscribedChannels;

		       if(!ch[channelName]) 
			   ch[channelName] = [callback];
		        else 
			   ch[channelName].push(callback);

		       if (BOOKTYPE._network._isInitialized) {
			   this.sendMessage({"channel": "/booki/", 
					     "command": "subscribe", 
					     "channels": [channelName]});
		       }
		   },
		   
		   interval: function() {
		       if(!BOOKTYPE._network.options['poll']) return;
		       
		       /* should be setTimeout and not setInterval */
		       var a = this;
		       
		       setInterval(function() {
			   var d = new Date();
			   
			   /*
			     if(d.getTime()-_lastAccess < 2000) {
			     }
			   */
			   
			   if (BOOKTYPE.clientID && BOOKTYPE._network._messages.length == 0) {
			       a.sendMessage({"channel": "/booki/", "command": "ping"}, function() {});
			   } 
			   if (BOOKTYPE.clientID)
			       a.sendData();
			   
			   BOOKTYPE._network._lastAccess = d;
		       }, BOOKTYPE._network.options['iteration']);
		    },
		    
		   receiveMessage: function(message, result) {
		       
		       if(message.uid) {
			   var res = BOOKTYPE._network._results[message.uid];
			   
			   if(res) {
			       // 0 or 1 depending of the result
			       res[0](message);
			       delete BOOKTYPE._network._results[message.uid];
			   }
		       } else {
			   for(var a = 0; a< BOOKTYPE._network._subscribedChannels[message.channel].length; a++) {
                               BOOKTYPE._network._subscribedChannels[message.channel][a](message);
			   }
		       }
		   },
		   
		   sendMessage: function(message, callback, errback) {
		       if(callback) 
			   BOOKTYPE._network._results[BOOKTYPE._network._uid] = [callback, errback];
		       
		       message["uid"] = BOOKTYPE._network._uid;
		       
		       BOOKTYPE._network._messages.push(message);
		       BOOKTYPE._network._uid += 1;
		       
		       /* bash i ne bi trebao ovdje ovako ali eto */
		       if (BOOKTYPE.clientID)
			   this.sendData();
		   },
		   
		   sendData: function() {
                       if(!BOOKTYPE._network._isInitialized) return;
                       if(!BOOKTYPE._network._messages.length) return;
		       var $this = this;
                       var msgs;	
      		       
                       if (typeof JSON == 'undefined')	
                           msgs = $.toJSON(BOOKTYPE._network._messages);
                       else
                           msgs = JSON.stringify(BOOKTYPE._network._messages);

                       BOOKTYPE._network._messages = new Array();
		       
		       /*
			 what to do in case of errors?!
		       */
                       var a = this;
                       $.post(BOOKTYPE.sputnikDispatcherURL, {"clientID": BOOKTYPE.clientID, "messages": msgs  }, function(data, textStatus) {
			   if(data) {
			       $.each(data.messages, function(i, msg) {
				   a.receiveMessage(msg, data.result);
			       });
			   } else {
			       $this.showError();
			   }
		       }, "json");
		   },
		   sendToCurrentBook: function(message, callback, errback) {
		       return this.sendToChannel("/booki/book/"+BOOKTYPE.currentBookID+"/"+BOOKTYPE.currentVersion+"/", message, callback, errback);
		   },

		   sendToChannel: function(channelName, message, callback, errback) {
		       message["channel"] = channelName;
		       this.sendMessage(message, callback, errback);
  		   },

	       });
	       
	       
	       return {"transport": new Sputnik(),
		       "subscribeToChannel": function(channelName, callback) { return this.transport.subscribeToChannel(channelName, callback); },
		       "sendToCurrentBook": function(message, callback, errback) { return this.transport.sendToCurrentBook(message, callback, errback); },
		       "sendToChannel": function(channelName, message, callback, errback) { 
			   return this.transport.sendToChannel(channelName, message, callback, errback); 
		       }
		      };
	       
	       
	   }
      );
