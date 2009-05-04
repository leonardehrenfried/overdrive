/*
* Object that connects to the delicious server
*/
function RemoteStorage(){
	
	
	this.getAllTags=function (callback) {
		var tagFeed="http://feeds.delicious.com/v2/json/tags/"+overdrive.storage.settings["username"];
		var array=[];
		$.getJSON(tagFeed+"?callback=?", function (tags){
				for (key in tags){
					callback(key, tags[key]);
				}
			}
		);
	};
	
	this.getBookmarksFromTag=function (tag) {
		var tagFeed="http://feeds.delicious.com/v2/json/"+overdrive.storage.settings["username"]+"/"+tag;
		this.getBookmarks(	tagFeed,
							function (bmark) { //processor function
								overdrive.storage.insertBookmark(bmark);
							},
							function (tag) {
								//$.jGrowl("inserted bookmark"); //onSuccess function
								overdrive.storage.markTagAsVisited(tag);
							}
							);
	};
	/*
	* All purpose fetch function for bookmarks
	* @param url a String
	* @param processor a function that is called with the bookmark as the first argument
	* @param success 
	*/
	this.getBookmarks=function (url, processor, success) {		
		var tag=url.split('/').reverse()[0];//get the tag from the url
		$.getJSON(url+"?callback=?", function(bookmarks){
			//$.jGrowl("Fetching bookmarks with tag '"+tag+"' from delicious.com.");
			$.each(bookmarks, function(){
			    var bmark=new Bookmark(this.u, this.d, this.t, this.dt);
				processor(bmark);
			});
			success(tag);
		});
	};	
}