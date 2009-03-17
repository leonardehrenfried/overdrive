/**
* Object that represents the local SQL storage.
*/
function LocalStorage(){
	this.DB_VERSION="0.1";
	this.DB_NAME="overdrive delicious.com";
	this.db = openDatabase(this.DB_NAME, this.DB_VERSION);
	this.tableList=["bookmarks", "settings"];
	
	/**
	* This block checks if the database exists and creates the necessary tables.
	*/
	this.db.transaction(function(tx) {
        tx.executeSql("SELECT COUNT(*) FROM bookmarks", [], function(result) {}, function(tx, error) {
			tx.executeSql("CREATE TABLE bookmarks (url TEXT NOT NULL UNIQUE, title TEXT, tags TEXT, modified DATETIME)",[],
			function(result) { 
                $.jGrowl("table 'bookmarks' created");
            });
			tx.executeSql("CREATE TABLE settings (id TEXT NOT NULL UNIQUE, type TEXT, value TEXT)", [],
			function(result) { 
                $.jGrowl("table 'settings' created");
            },
			function(tx, error) { 
                $.jGrowl("Could not create tables.");
            });
        });
    });
	
	/**
	* Deletes all local tables.
	*/
	this.deleteTables=function(){
		this.db.transaction(function(tx) {
	        for (i=0; i<this.tableList.length; i++){
				tx.executeSql("DROP TABLE ?", [this.tableList[i]], 
				function(result) { }, 
				function(tx, error) { 
				});
			}
		});
	}
	
	/**
	* Returns one of the settings values in the local storage.
	*/ 
	this.getSetting=function(key){
		return value;
	}
	
	/**
	* Returns one of the settings values in the local storage.
	*/ 
	this.setSetting=function(key, value){
		this.db.transaction(function(tx) {
			tx.executeSql("SELECT id FROM settings WHERE id=?", [key], 
			function(result) { }, 
			function(tx, error) { 
			});
		});
		return value;
	}
	
	/**
	* Inserts a bookmark into the local db.
	*/
	this.insertBookmark= function(bmark) {
		$.jGrowl('date: ' + bmark.modified);
		this.db.transaction(function(tx){
			     tx.executeSql("INSERT INTO bookmarks (url, title, tags, modified) VALUES (?,?,?,?)",
					[bmark.url, bmark.title, bmark.getTagsAsString(),bmark.modified], 			
				 function(tx, result){       
			     }, 
				 function(tx, error){
			     	 //$.jGrowl('Could not insert: ' + error.message);
				     tx.executeSql("UPDATE bookmarks SET url=?, title=?, tags=? WHERE url=?",[bmark.url, bmark.title, bmark.getTagsAsString(),bmark.url], 			
					 function(tx, result){       
				     }, 
					 function(tx, error){
						$.jGrowl('Could not insert or update bookmark: ' + error.message);
				     });
			     });
		});
	}
	
	/**
	* Searches for a bookmark across title, url and tags.
	* @param: the search term
	*/
	this.searchBookmarks=function(term) 
	{
		this.db.transaction(function(tx) 
		{
			var result=tx.executeSql("SELECT * FROM bookmarks WHERE tags LIKE '%"+term+"%'",[], 
				function(tx, result){
					if (!result.rows.length){
						$("#content").empty();
						return false;
					}
				
					else{
						$("#content").empty();
						for (var i = 0; i < result.rows.length; ++i) {
							var row = result.rows.item(i);
							var bmark = new Bookmark(row['url'], row['title'], row['tags']);	
						}
		            }
		        }, 
				function(tx, error){
			    	$.jGrowl('Failed to retrieve bookmarks from database - ' + error.message);
					return;
			    });
		});	
	}
}

function RemoteStorage(){
	var tagFeed="http://feeds.delicious.com/v2/json/veggieboy4000/ssh";
}

function Bookmark(url, title, tags, modified){
	this.url=url;
	this.title=title;
	this.modified=modified.slice(0,-1)
		
	if (typeof tags == 'string'){
		this.tags=tags.split(",");
	}
	else
	{
		this.tags=tags;
	}
	$("#content").append("<li><a href='"+this.url+"'>"+this.title+"</a></li>");
	this.getTagsAsString=function () {
		var tagsString="";
		$.each(this.tags, function() {
		      tagsString+=this+",";
		    });
		return tagsString;
	}
}



$(document).ready(function(){
    var storage = new LocalStorage();

	var username="veggieboy4000";
	var url="http://feeds.delicious.com/v1/json/"+username+"?raw&count=100";
	
	$.getJSON(url+"&callback=?", function(bookmarks){
		$.jGrowl("Fetching data from delicious.com.");
		$.each(bookmarks, function(){
		    var bmark= new Bookmark(this.u, this.d, this.t, this.dt)
			storage.insertBookmark(bmark);
		});
   	});

	$(".searchBox").keyup(function (e) {
		storage.searchBookmarks($(this).attr("value"));
	});
	
});