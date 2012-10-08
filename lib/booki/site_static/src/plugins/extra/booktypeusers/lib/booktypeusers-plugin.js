define([ 'aloha/plugin', 'jquery', 'ui/ui', 'ui/Button', 'booktype/network' ], function(plugin, jquery, Ui, Button, booktypeNetwork) 
{
    "use strict";
    return plugin.create( 'booktypeusers-plugin', {
        init: function() 
        {
	    var chatShow = false;
	    var $this = this;

	    function getLabel() {
		if(typeof window.BOOKTYPE.numberOfUsers == 'undefined')
		    return '';
		
		return 'Online '+window.BOOKTYPE.numberOfUsers+' users';
	    }

	    function setLabel(text) {
		if($this._button && typeof $this._button.items != 'undefined' && $this._button.items.length > 0) 
		    $this._button.items[0].setText(text);
	    }

	    function clearLabel() {
		
	    }

            this._button = Ui.adopt('usersButton', Button, {
                tooltip: getLabel(),
                click: function () {
		    // clean everything when switch on/off
		    chatShow = !chatShow;
		    var _w = jquery("DIV.document").width();
		    if(chatShow) {
			jquery("DIV.document").css("width", _w-250);
			jquery("#booktypechat").css("visibility", "visible");

			if($this._button.items && $this._button.items.length > 0)
			    $this._button.items[0].el.removeClass('user-joined');

		    } else {
			jquery("DIV.document").css("width", _w+250);
			jquery("#booktypechat").css("visibility", "hidden");
		    }
                }
            });

	    this._button.show(true);

	    if(this._button.items && this._button.items.length > 0)
		this._button.items[0].el.addClass('right-align');
	    
	    var i = 0;

	    booktypeNetwork.subscribeToChannel("/chat/"+window.BOOKTYPE.currentBookID+"/", function(message) {
		console.debug(message);
		if(message.command == "user_joined") {	
		    $this._button.items[0].el.addClass('user-joined');
		}
		if(message.command == "message_received") {
		    $this._button.items[0].setText(getLabel()+'<a href="#" style="color: red; float: right; margin: 0 4px;" class="ui-icon ui-icon-comment"></a>');
		}
	    });

	    
	    function _checkLabel() {
		setTimeout(function() {
		    if(typeof window.BOOKTYPE.numberOfUsers == 'undefined')
			_checkLabel();

		    setLabel(getLabel());
		}, 1000);
	    };

	    _checkLabel();

        }
    });
});

