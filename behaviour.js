var overdrive={};
/*
* Download the latest bookmarks from delicious
*/
overdrive.sync=function(count) {
	var url="http://feeds.delicious.com/v1/json/"+overdrive.storage.settings['username']+"?raw&count="+count;
	$.getJSON(url+"&callback=?", function(bookmarks){
		$.jGrowl("Fetching data from delicious.com.");
		$.each(bookmarks, function(){
		    var bmark=new Bookmark(this.u, this.d, this.t, this.dt, 
				//asynchronous callback parameter
				function (obj) {
					window.console.log(obj);
					obj.append();
				});
			overdrive.storage.insertBookmark(bmark);
		});
		var date=new Date();
		overdrive.storage.setSetting("lastUpdate", date);
		overdrive.storage.setSetting("fullSync", true);
   	});
};

/*
* Starts the the download of all bookmarks through the tag feed
*/
overdrive.startBookmarkTimeout=function () {
	if (overdrive.storage.settings["tagsDownloaded"]===true || overdrive.storage.settings["tagsDownloaded"]==="True") {
		
		overdrive.storage.getNextTag(function (tag) {	
				overdrive.remote.getBookmarksFromTag(tag);		
		});
	};
	
	if (overdrive.storage.settings["bookmarksComplete"]!==true){
		window.setTimeout(function () {
			overdrive.startBookmarkTimeout();
		},2000);
	}
};

/*
* Click event callbacks
*/ 
overdrive.ui={};
overdrive.ui.bottomTabs=["username"];
overdrive.ui.reset=function () {
	var list=["bookmarks","tags","settings"];
	for (i=0; i<list.length; i++){
		overdrive.storage.deleteTable(list[i]);
	}
	window.setTimeout(function () {
		try{
			window.location.reload();
		}
		catch(err){
			alert(err);
		}
	}, 1000);
	return false;
};

overdrive.ui.showFeedback=function () {
    UserVoice.Popin.show(); 
    return false;
};



$(document).ready(function(){
	
	$('#mainSearch').focus();
	
	try{
		overdrive.storage = new LocalStorage();
		overdrive.remote=new RemoteStorage();
	}
	catch(err){
		// Error message for browsers that don't support HTML5 offline storage
		$.get("error.html", function(data){
		  $("#errorConsole").empty().append(data);
		});
		$("#errorConsole").modal();
	}
	
	// callbacks to this will execute after all the settings have been fetched from the db
	overdrive.storage.getSettings(function (argument) {
		
		// if the user hasn't entered the username yet
		if (overdrive.storage.settings["username"]===undefined){	
			$.get("dataentry.html", function(data){
				$("#errorConsole").empty().append(data);
				// create the special case for sqlForms, their elements will not be submitted but stored in the db 
				$(":submit").click(function (){
					var form=$(this).parent();
					form.children().each(function (){
					        if ($(this).attr("type")!="submit" && $(this).hasClass("sql")){
								var key=$(this).attr("name");
								var value=$(this).attr("value");
								overdrive.storage.setSetting(key, value);						
							}
				});
				$.modal.close();
				$("#errorConsole").empty();
				window.location.reload();
				});
			});
			$("#errorConsole").modal();
		}
		
		// intialise the user interface with variable from the db, uses a XHTML tag with the id of the settings in
		// question
		var uiFields=overdrive.ui.bottomTabs;
		for (i=0; i<uiFields.length; i++)
		{
			$("#"+uiFields[i]).text(overdrive.storage.settings[uiFields[i]]);
		}
		
		// get the bookmarks and start the download timer
		window.setTimeout(function (argument) {
			// if the tags have not been downloaded yet
			if (overdrive.storage.settings["tagsDownloaded"]!==true && overdrive.storage.settings["username"]!==undefined)
			{
				$.jGrowl("Downloading tags from delicious.com"); 
				
				overdrive.remote.getAllTags(
					//process callback function
					function (tag, bookmarks) {
						overdrive.storage.insertTag(tag, bookmarks);
					},
					// success callback
					function () {
						overdrive.storage.setSetting("tagsDownloaded", true);
						window.setTimeout(function (argument) {
							overdrive.startBookmarkTimeout();
						}, 500);
						
					}
				);

			}
		}, 500);
		
		window.setTimeout(function  (argument) {
			if (overdrive.storage.settings["tagsDownloaded"]===true && overdrive.storage.settings["tagsDownloaded"]==="True") {
				overdrive.startBookmarkTimeout();
			};
		},1500);
		
		
		//wait for 500ms for the DB to be initialised, then start syncing with delicious.com
		if (!overdrive.storage.settings["fullSync"] && overdrive.storage.settings["username"]!=undefined)
		{
			overdrive.sync(100);
		}
		
		var mins=13;//minutes in between syncs
		var lastUpdate=new Date(overdrive.storage.settings["lastUpdate"]+(60000*mins));
		var now=new Date();
		
		if (lastUpdate<now && overdrive.storage.settings["username"]!=undefined)
		{
			overdrive.sync(20); //get the last 20 bookmarks
		}
		

	});
	

	
	overdrive.storage.getAllBookmarks();

	$(".searchBox").keyup(function (e) {
		if ($(this).attr("value")===""){
			overdrive.storage.getAllBookmarks();
		}
		else{
			overdrive.storage.searchBookmarks($(this).attr("value"));
		}
		
	});
	// for when the user returns to an unfinished bookmark download
	window.setTimeout(function function_name (argument) {
		overdrive.startBookmarkTimeout();
	}, 2500);
	
	// catchall for click events with class="function"
	$(".function").click(function () {
		var fn=$(this).attr("href");
		overdrive.ui[fn]();
		return false;
	});
});