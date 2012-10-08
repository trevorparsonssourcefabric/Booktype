define([ 'aloha/plugin', 'jquery', 'ui/ui', 'ui/Button', 'booktype/network', 'booktype/editor' ], function(plugin, jquery, Ui, Button, booktypeNetwork, booktypeEditor) 
{
    "use strict";
    return plugin.create( 'booktypetoc-plugin', {
        init: function() 
        {
	    var $this = this;

            this._button = Ui.adopt('tocButton', Button, {
                tooltip: 'Table of contents',
                click: function () {
		    booktypeEditor.openTOC();
                }
            });

	    this._button.show(true);
        }
    });
});

