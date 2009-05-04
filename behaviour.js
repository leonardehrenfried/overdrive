var overdrive={};
/*
* Download the latest bookmarks from delicious
*/
overdrive.sync=function(count) {
	var url="http://feeds.delicious.com/v1/json/"+overdrive.storage.settings['username']+"?raw&count="+count;
	$.getJSON(url+"&callback=?", function(bookmarks){
		$.jGrowl("Fetching data from delicious.com.");
		$.each(bookmarks, function(){
		    var bmark=new Bookmark(this.u, this.d, this.t, this.dt);
			overdrive.storage.insertBookmark(bmark);
		});
		var date=new Date();
		overdrive.storage.setSetting("lastUpdate", date);
		overdrive.storage.setSetting("fullSync", true);
   	});
};
/*
* Click event callbacks
*/ 
overdrive.ui={};
overdrive.ui.reset=function () {

	var list=["bookmarks","tags","settings"];
	for (i=0; i<list.length; i++){
		overdrive.storage.deleteTable(list[i]);
	}
	return false;
};



$(document).ready(function(){
	
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
		var uiFields=["username"];
		for (i=0; i<uiFields.length; i++)
		{
			$("#"+uiFields[i]).text(overdrive.storage.settings[uiFields[i]]);
		}
		
		// if the tags have not been downloaded yet
		if (!overdrive.storage.settings["tagsDownloaded"])
		{
			$.jGrowl("Downloading tags from delicious.com"); 
			
			var tags=overdrive.remote.getAllTags(function (tag, bookmarks) {
					overdrive.storage.insertTag(tag, bookmarks);
			});
			overdrive.storage.setSetting("tagsDownloaded", true);
		}
		
		/*
		* Starts the the download of all bookmarks through the tag feed
		*/
		overdrive.startBookmarkTimeout=function () {
			// if the user has entered his username
			if (overdrive.storage.settings["username"]!=undefined) {
				overdrive.storage.getNextTag(function (tag) {
						overdrive.remote.getBookmarksFromTag(tag);
				});
			};
			
			if (overdrive.storage.settings["bookmarksComplete"]===undefined){
				window.setTimeout(function () {
					overdrive.startBookmarkTimeout();
				},2000);
			}
		};
		
		window.setTimeout(function (argument) {
			overdrive.startBookmarkTimeout();
		},2000);

	});
	
	overdrive.storage.getAllBookmarks();
		
	//wait for 500ms for the DB to be initialised, then start syncing with delicious.com
	window.setTimeout(function(){
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
			
		}, 500);

	$(".searchBox").keyup(function (e) {
		overdrive.storage.searchBookmarks($(this).attr("value"));
	});
	
	// catchall for click events with class="function"
	$(".function").click(function () {
		var fn=$(this).attr("href");
		overdrive.ui[fn]();
		return false;
	});
});