define('booktype/editor', ['jquery', 'booktype/network'],       
       function(jQuery, booktypeNetwork) {
	   var jQuery = $;
	   var BOOKTYPE = window.BOOKTYPE || {};

	   // editor data
	   var currentChapters = null;
	   var currentChaptersOnHold = null;

	   function showNotification(val) {

	       if(typeof val == 'undefined')
		   jQuery("#notification").hide();
	       else
		   jQuery("#notification").show().html('<span>'+val+'</span>');
	   }

	   function setChapterTitle(chapterTitle) {
	       jQuery('.topmenu .chapter-title').html(chapterTitle);
	       BOOKTYPE.currentChapterTitle = chapterTitle;
	   }

	   function openDocument(chapterID) {
	       showNotification("Loading chapter");
	       booktypeNetwork.sendToCurrentBook({"command": "get_chapter", 
						  "chapterID": chapterID, 
						  "lock": false, 
						  "revisions": false}, 
						 function(data) {
						     showNotification();
						     BOOKTYPE.currentChapterID = chapterID;
						     setChapterTitle(data['title']);
						     jQuery("#bodypreraw").html(data['content']);
						 });	       
	   }

	   function saveDocument() {
	       var content = jQuery("#bodypreraw").html();
	       showNotification("Saving chapter");
	       booktypeNetwork.sendToCurrentBook({"command": "chapter_save", 
						  "chapterID": BOOKTYPE.currentChapterID,
						  "content": content,
						  "minor": false,
						  "continue": false,
						  "comment": '',
						  "author": '',
						  "authorcomment": ''
						 },
						 function() { 
						     showNotification();
						 });
	   };

	   function reloadChapters($dialog) {
	       // THIS IS NOT GOOD, BUT FOR NOW IT WILL BE OK
	       booktypeNetwork.sendToCurrentBook({"command": "get_chapters"}, 
						 function(dta) {
						     currentChapters = dta.chapters;
						     currentChaptersOnHold = dta.holdChapters;
						     
						     toc.items = new Array();
						     holdChapters.items = new Array();
						     
						     jQuery.each(currentChapters, function(i, elem) {
							 toc.addItem(createChapter({id: elem[0], title: elem[1], isChapter: elem[3] == 1, status: elem[4], url_title: elem[2]}));
						     });
						     
						     jQuery.each(currentChaptersOnHold, function(i, elem) {
							 holdChapters.addItem(createChapter({id: elem[0], title: elem[1], isChapter: elem[3] == 1, status: elem[4], url_title: elem[2]}));
						     });
						     
						     toc.draw();
						     holdChapters.draw();
						     
						 });
	   }

	    function getStatusDescription(statusID) {
		return '';
	    }


	    /* 
	       Creates chapter with default options.
	    */
	   
	   function createChapter(vals) {
	       var options = {
		   id: null,
		   title: '',
		   url_title: '',
		   isChapter: true,
		   isLocked: false,
		   status: null
	       };
	       
	       $.extend(options, vals);
	       
	       return options;
	   }

	   // TOC

	   function TOC(containerName) {
		this.containerName = containerName;
		this.items = new Array();
	    }

	    $.extend(TOC.prototype, {
		'addItem': function(item) {
		    this.items.push(item);
		},
		
		'delItemById': function(id) {
		    for(var i = 0; i < this.items.length; i++) {
			if(this.items[i].id == id) {
			    return this.items.splice(i, 1);
			}
		    }
		},
		
		'getItemById': function(id) {
		    for(var i = 0; i < this.items.length; i++) {
			if(this.items[i].id == id) {
			    return this.items[i];
			}
		    }

		    return null;
		},

		'getItemByURLTitle': function(URLTitle) {
		    for(var i = 0; i < this.items.length; i++) {
			if(this.items[i].url_title == URLTitle) {
			    return this.items[i];
			}
		    }

		    return null;
		},


		'update': function(order) {
		    var newOrder = new Array();

		    for(var i = 0; i < order.length; i++) {
			var item = this.getItemById(order[i])
			newOrder.push(item);
		    }
		    this.items = newOrder;
		},

		'draw': function() {
		    var $this = this;

		    $($this.containerName).empty();
		    $.each(this.items, function(i, v) {
			if(v.isChapter)
			    makeChapterLine(v.id, v.title, getStatusDescription(v.status)).appendTo($this.containerName);
			else
			    makeSectionLine(v.id, v.title).appendTo($this.containerName);

		    });

		    this.refreshLocks();

		},

		'redraw': function() {
		    var $this = this;
		    var chldrn = $($this.containerName).contents().clone(true);

		    $($this.containerName).empty();

		    $.each(this.items, function(i, v) {
			for(var n = 0; n < chldrn.length; n++) {
			    if( $(chldrn[n]).attr("id") == "item_"+v.id) {
				$(chldrn[n]).appendTo($this.containerName);
				break;
			    }
			}
		    });

		    this.refreshLocks();
		},

		'refresh': function() {
		    // should update status and other things also
		    $.each(this.items, function(i, v) {
			$("#item_"+v.id+"  .title").html(v.title);
			$("#item_"+v.id+" n .status").html('<a href="javascript:void(0)" onclick="$.booki.editor.editStatusForChapter('+v.id+')">'+getStatusDescription(v.status)+'</a>');
		    });

		    this.refreshLocks();
		},

		'refreshLocks': function() {
//		    $(".extra").html("");

		    $.each(this.items, function(i, v) {
			var item = $(".edit", $("#item_"+v.id));
			item.find('.chapterLinks').show();
			item.find('.lock').hide();
		    });
/*
		    $.each(chapterLocks, function(i, v) {
			var item = $(".edit", $("#item_"+i));
			item.find('.chapterLinks').hide();
			item.find('.lock').show();
			item.find('.lockUser').text(v);
		    });
*/
		}
		
	    });


	    /*
	      Get chapter object by it's Chapter ID.
	     */
	    function getChapter(chapterID) {
		var chap = toc.getItemById(chapterID);
		if(!chap)
		    chap = holdChapters.getItemById(chapterID);
		return chap;
	    }

	    function getChapterByURLTitle(URLTitle) {
		var chap = toc.getItemByURLTitle(URLTitle);

		return chap;
	    }

	    var _isEditingSmall = false;
	    
	    /*
	      Creates HTML code for the Section line in TOC.
	     */
	    function makeSectionLine(chapterID, name) {
//		var line = $.booki.ui.getTemplate('sectionLine');
		var line = jQuery(".sectionLine.template").clone().removeClass("template");

		line.attr('id', 'item_'+chapterID);
		line.find('.title').text(name);
		return line;
	    }
	    
	    /*
	      Creates HTML code for the Chapter line in TOC. It also binds different events.	      
	    */
	    function makeChapterLine(chapterID, name, status) {
//		var line = $.booki.ui.getTemplate('chapterLine');
		var line = jQuery(".chapterLine.template").clone().removeClass("template");

		line.attr('id', 'item_'+chapterID);
//		$.booki.ui.fillTemplate(line, {'title': name});
		line.find('.title').text(name);
		line.find('.viewLink').click(function() {
		    openDocument(chapterID);

		    jQuery("#panel-toc").hide();
		    jQuery("body").css('overflow', 'auto');
		});

		return line;
	    }


	    var toc = new TOC("#chapterslist");   // Holds all chapters and sections currently in TOC 
	    var holdChapters = new TOC("#holdchapterslist"); // Holds all chapters currently on hold

	   // events

	   function showJoined(username) {
	       jQuery("#booktypechat .content").append('<p><span class="icon">JOINED</span> <span class="notice">'+username+'</span></p>');
	       jQuery("#booktypechat .content").attr({ scrollTop: jQuery("#booktypechat .content").attr("scrollHeight") });
	   }
	   
	   function showInfo(from, message) {
	       jQuery("#booktypechat .content").append('<p><span class="info">INFO</span> <span class="notice">'+from+' : '+message+'</span></p>');
	       jQuery("#booktypechat .content").attr({ scrollTop: jQuery("#booktypechat .content").attr("scrollHeight") });
	   }
	   
	   function showMessage(from, message) {
	       jQuery("#booktypechat .content").append('<p><b>' +from+ '</b>: '+message+'</p>');
	       jQuery("#booktypechat .content").attr({ scrollTop: jQuery("#booktypechat .content").attr("scrollHeight") });
	   }
	   
	   function _initChat() {
	       booktypeNetwork.subscribeToChannel("/chat/"+BOOKTYPE.currentBookID+"/", function(message) {
		   console.debug(message);
		   if(message.command == "user_joined") {			   
		       showJoined(message.user_joined);
		   }
		   
		   if(message.command == "message_info") {
		       showInfo(message.message);
		   }
		   
		   if(message.command == "message_received") {
		       showMessage(message.from, message.message);
		   }
	       });
	       
	       jQuery("#booktypechat FORM").submit(function() {
		   var _text = jQuery("INPUT", jQuery(this)).val();
		   jQuery("INPUT", jQuery(this)).val("");
		   showMessage(BOOKTYPE.username, _text);
		   booktypeNetwork.sendToChannel("/chat/"+BOOKTYPE.currentBookID+"/",{"command": "message_send", "message": _text}, function() {} );
		   
		   return false;
	       });
	   }
	   
	   function _initTOC() {
	       jQuery('.topmenu A[name=toc]').click(function() {
		   $("#dialog-confirm").dialog({
		       resizable: false,
		       height:140,
		       modal: true,
		       buttons: {
			   "Yes": function() {
			       $( this ).dialog( "close" );
			       window.location = '../_info/';
			   },
			   "No": function() {
			       $( this ).dialog( "close" );
			   }
		       }
		   });		   
		   

	       });
	       
	       
	       jQuery( "#chapterslist, #holdchapterslist" ).sortable({
		   connectWith: ".connectedSortable",
		   'dropOnEmpty': true,  
		   'stop': function(event, ui) { 
		       var result     = jQuery('#chapterslist').sortable('toArray'); 
		       var holdResult = jQuery('#holdchapterslist').sortable('toArray'); 
		       
		       if(toc.items.length > result.length) {
			   for(var i = 0; i < toc.items.length; i++) {
			       var wasFound = false;
			       for(var n = 0; n < result.length; n++) {
				   if(toc.items[i].id == result[n].substr(5)) {
				       wasFound = true;
				   }
			       }
			       
			       if(!wasFound) {
				   var itm = toc.getItemById(toc.items[i].id);
				   if((""+itm.id).substring(0,1) != 's') {
				       holdChapters.addItem(itm);
				   } else {
				       jQuery("#item_"+toc.items[i].id).remove();
				   }

				   toc.delItemById(toc.items[i].id);
				   
				   booktypeNetwork.sendToCurrentBook({"command": "chapters_changed", 
								      "chapters": result,
								      "hold": holdResult,
								      "kind": "remove",
								      "chapter_id": itm.id}, 
								     function() {

								     });
                                    
				    break;
				}
			    }
		       }  else if(toc.items.length < result.length) {
			   for(var i = 0; i < holdChapters.items.length; i++) {
			       var wasFound = false;
			       for(var n = 0; n < holdResult.length; n++) {
				   if(holdChapters.items[i].id == holdResult[n].substr(5)) {
				       wasFound = true;
				   }
			       }
			       
			       if(!wasFound) {
				   var itm = holdChapters.getItemById(holdChapters.items[i].id);
				   toc.addItem(itm);
				   holdChapters.delItemById(itm.id);
				   
				   booktypeNetwork.sendToCurrentBook({"command": "chapters_changed", 
								      "chapters": result,
								      "hold": holdResult,
								      "kind": "add",
								      "chapter_id": itm.id}, 
								     function() {
									 toc.refreshLocks(); 
									 holdChapters.refreshLocks(); 
								     });
				    break;
				} 
			    }

		       } else if (toc.items.length == result.length) {
			   booktypeNetwork.sendToCurrentBook({"command": "chapters_changed", 
							      "chapters": result,
							      "hold": holdResult,
							      "kind": "order",
							      "chapter_id": null
							     }, 
							     function() {
								 toc.refreshLocks(); 
								 holdChapters.refreshLocks();
							     });
		       }

		       var $dialog = $("#panel-toc");
		       
		       reloadChapters($dialog);
		   },
		   'placeholder': 'ui-state-highlight', 
		   'scroll': true
	       }).disableSelection();
	       
	       var $dialog = $("#panel-toc");
	       
	       jQuery("A[name=chapter]", $dialog).button({icons: { primary: "ui-icon-circle-plus" }}).click(function() {
		   jQuery("#dialog-chapter").dialog('open');
	       });
	       jQuery("A[name=section]", $dialog).button({icons: { primary: "ui-icon-circle-plus" }}).click(function() {
		   jQuery("#dialog-section").dialog('open');
	       });
//	       jQuery("A[name=import]", $dialog).button({icons: { primary: "ui-icon-arrowreturnthick-1-s" }});

//	       jQuery("A[name=save]", $dialog).button({icons: { primary: "ui-icon-check" }});
	       jQuery("A[name=cancel]", $dialog).button({icons: { primary: "ui-icon-closethick" }}).click(function() {
		   jQuery("#panel-toc").hide();

		   //pagination._disabled = false;
		   jQuery("body").css('overflow', 'auto');
	       });


	       // PUBLISH DIALOG

	       $dialog = $("#panel-publish");

	       jQuery("A[name=cancel]", $dialog).button({icons: { primary: "ui-icon-closethick" }}).click(function() {
		   jQuery("#panel-publish").hide();

		   //pagination._disabled = false;
		   jQuery("body").css('overflow', 'auto');
	       });


	       jQuery("A[name=publishbook]", $dialog).button({icons: { primary: "ui-icon-closethick" }}).click(function() {
		   var publishMode = $("FORM[name=formexport] INPUT[name=publish]:checked", $dialog).val();
		   var commands = {"command": "publish_book2",
				   "publish_mode": publishMode};

//		   jQuery('a[name=publishbook]').button("option", "disabled", true);
		   console.debug(commands);
		   booktypeNetwork.sendToCurrentBook(commands,						  
                                                     function(data) {
							 console.debug(data);
							 jQuery(".downloadlink", $dialog).html('<a href="'+data.dta+'">'+data.dta+'</a>');
							 //data.dta
							 //jQuery('a[name=exportbutton]').button("option", "disabled", false);							 
                                                     } );


	       });


	       // create new chapter
	       jQuery("#dialog-chapter").dialog({
		   resizable: true,
		   height:170,
		   modal: true,
                   autoOpen: false,
		   buttons: {
		       "Create": function() {
			   var $dialog = $(this);
			   showNotification("Creating new chapter");
			   booktypeNetwork.sendToCurrentBook({"command": "create_chapter",
							      "chapter": jQuery("INPUT", $dialog).val()},
							     function(data) {
								 showNotification();
								 reloadChapters($dialog);
								 $dialog.dialog( "close" );
							     });

		       },
		       "Cancel": function() {
			   jQuery( this ).dialog( "close" );
		       }
		   },
		   open: function(event,ui) {
		       $("INPUT", $(this)).val('Enter new Chapter title.').select();
		   },

	       });

	       // create new section
	       jQuery("#dialog-section").dialog({
		   resizable: true,
		   height:170,
		   modal: true,
                   autoOpen: false,
		   buttons: {
		       "Create": function() {
			   var $dialog = $(this);
			   showNotification("Creating new section");
			   booktypeNetwork.sendToCurrentBook({"command": "create_section",
							      "chapter": jQuery("INPUT", $dialog).val()},
							     function(data) {
								 showNotification();
								 reloadChapters($dialog);
								 $dialog.dialog( "close" );
							     });
		       },
		       "Cancel": function() {
			   jQuery( this ).dialog( "close" );
		       }
		   },
		   open: function(event,ui) {
		       $("INPUT", $(this)).val('Enter new Section title.').select();
		   },

	       });

	   }

	   function _openTOC() {
		   var $panel = jQuery("#panel-toc");

		   jQuery("#chapterslist", $panel).empty();
		   jQuery("#holdchapterslist", $panel).empty();
		   jQuery(".infomessage", $panel).html('<span class="alert-box info">Loading chapters</span>');

		   booktypeNetwork.sendToCurrentBook({"command": "get_chapters"}, 
						     function(data) {
							 jQuery(".infomessage", $panel).empty();

							 var $sortable1 = jQuery("#chapterslist");
							 var $sortable2 = jQuery("#holdchapterslist");

							 var $y = jQuery('.menu-bar').position().top;
							 
							 $panel.css("top", $y + 50);
							 $panel.css("left", 100);
							 $panel.css("right", 100);
							 $panel.css("bottom", 100);
							 $panel.css("height", jQuery(window).height()-$y-3-40-10 - 100);
							 $panel.show();
							 // THIS MUST HAPPEN

							 //pagination._disabled = true;
							 //jQuery("#bodypreraw").hide();
							 //jQuery("#bodypre").hide();
							 jQuery("body").css('overflow', 'hidden');


							 jQuery(".inner", $panel).css("height", jQuery(window).height()-$y-3-40 - 50 - 20 -100 -20);
							 
							 currentChapters = data.chapters;
							 currentChaptersOnHold = data.holdChapters;

							 toc.items = new Array();
							 holdChapters.items = new Array();

							 jQuery.each(currentChapters, function(i, elem) {
							     toc.addItem(createChapter({id: elem[0], title: elem[1], isChapter: elem[3] == 1, status: elem[4], url_title: elem[2]}));
							 });

							 jQuery.each(currentChaptersOnHold, function(i, elem) {
							     holdChapters.addItem(createChapter({id: elem[0], title: elem[1], isChapter: elem[3] == 1, status: elem[4], url_title: elem[2]}));
							 });

							 toc.draw();
							 holdChapters.draw();

						     });
		       }

	   function openPublish() {
	       var $panel = jQuery("#panel-publish");

	       jQuery(".downloadlink", $panel).empty();

	       var $y = jQuery('.menu-bar').position().top;
	       
	       $panel.css("top", $y + 50);
	       $panel.css("left", 200);
	       $panel.css("right", 200);
	       $panel.css("bottom", 200);
	       $panel.css("height", jQuery(window).height()-$y-3-40-10 - 200);
	       $panel.show();
	       // THIS MUST HAPPEN
	       
	       //pagination._disabled = true;
	       //jQuery("#bodypreraw").hide();
	       //jQuery("#bodypre").hide();
	       jQuery("body").css('overflow', 'hidden');

	       jQuery(".inner", $panel).css("height", jQuery(window).height()-$y-3-40 - 50 - 20 -100 -20);	       
	   }

	   
	   
	   function _initEditor() {
	       jQuery('.topmenu .book-title').html(BOOKTYPE.currentBook);

	       setChapterTitle(BOOKTYPE.currentChapterTitle);

	       jQuery('.topmenu .userinfo').html(BOOKTYPE.username);		   


	       jQuery('.topmenu  A[name=savebutton]').button().click(function() {
		   saveDocument();
	       });

	       jQuery('.topmenu  A[name=publishbutton]').button().click(function() {
		   openPublish();
	       });
	       
	       _initChat();
	       _initTOC();

	       pagination.applyBookLayout();

	   }
	   
	   
	   return {'initEditor': _initEditor, 
		   'openTOC': _openTOC,
		   'openPublish': openPublish,
		   'openDocument': openDocument,
 		   'setChapterTitle': setChapterTitle};
       }
      );
