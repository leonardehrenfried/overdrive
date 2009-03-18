/**
* Object that represents the local SQL storage.
*/
function LocalStorage(){
	this.DB_VERSION="0.1";
	this.DB_NAME="overdrive delicious.com";
	this.db = openDatabase(this.DB_NAME, this.DB_VERSION);
	this.tableList=new Array();
	this.tableList["bookmarks"]="CREATE TABLE bookmarks (url TEXT NOT NULL UNIQUE, title TEXT, tags TEXT, modified DATETIME)";
	this.tableList["settings"]="CREATE TABLE settings (key TEXT NOT NULL UNIQUE, type TEXT, value TEXT)";
	
	this.resultQueue;
	this.displayQueue;
	
	/**
	* This block checks if the tables exists and creates the necessary ones.
	*/
	for (key in this.tableList)
	{
		//alert(this.tableList[key]);
		this.db.transaction(function(tx) {
			tx.executeSql("SELECT COUNT(*) FROM ?", [key], function(result) {}, function(tx, error) {
				alert(window.storage.tableList[key]);
				tx.executeSql(window.storage.tableList[key],[],
				function(result) { 
	                $.jGrowl("table '"+key+"' created");
	            });

	        });
	    });
	}
		
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
	};
	
	/**
	* Returns one of the settings values in the local storage.
	*/ 
	this.getSetting=function(key){
		return value;
	};
	
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
	};
	
	/**
	* Inserts a bookmark into the local db.
	*/
	this.insertBookmark= function(bmark) {
		this.db.transaction(function(tx){
			     tx.executeSql("INSERT INTO bookmarks (url, title, tags, modified) VALUES (?,?,?,?)",
					[bmark.url, bmark.title, bmark.getTagsAsString(),bmark.modified], 			
				 function(tx, result){       
			     }, 
				 function(tx, error){
				     tx.executeSql("UPDATE bookmarks SET url=?, title=?, tags=? WHERE url=?",[bmark.url, bmark.title, bmark.getTagsAsString(),bmark.url], 			
					 function(tx, result){       
				     }, 
					 function(tx, error){
						$.jGrowl('Could not insert or update bookmark: ' + error.message);
				     });
			     });
		});
		
	/**
	*
	*/
	this.setSetting= function (setting) {
		
		if (typeof setting == 'number'){
			setting+="";
		} 
		
		this.db.transaction(function(tx){
			     tx.executeSql("INSERT INTO bookmarks (url, title, tags, modified) VALUES (?,?,?,?)",
					[bmark.url, bmark.title, bmark.getTagsAsString(),bmark.modified], 			
				 function(tx, result){
					//nothing so far      
			     }, 
				 function(tx, error){
				     tx.executeSql("UPDATE bookmarks SET url=?, title=?, tags=? WHERE url=?",[bmark.url, bmark.title, bmark.getTagsAsString(),bmark.url], 			
					 function(tx, result){       
				     }, 
					 function(tx, error){
						$.jGrowl('Could not insert or update bookmark: ' + error.message);
				     });
			     });
		});
		};
	};
	
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
							var bmark = new Bookmark(row['url'], row['title'], row['tags'], row['modified']);	
						}
		            }
		        }, 
				function(tx, error){
			    	$.jGrowl('Failed to retrieve bookmarks from database - ' + error.message);
					return;
			    });
		});	
	};
}

function RemoteStorage(){
	var tagFeed="http://feeds.delicious.com/v2/json/veggieboy4000/ssh";
}

function Bookmark(url, title, tags, modified){
	this.url=url;
	this.title=title;
	if (typeof tags == 'string'){
		modified=modified.slice(0,-1);
	} 
	this.modified=new Date(modified);
	
			
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
	};
}



$(document).ready(function(){
    window.storage = new LocalStorage();

	var username="veggieboy4000";
	var url="http://feeds.delicious.com/v1/json/"+username+"?raw&count=100";
	
	$.getJSON(url+"&callback=?", function(bookmarks){
		$.jGrowl("Fetching data from delicious.com.");
		$.each(bookmarks, function(){
		    var bmark= new Bookmark(this.u, this.d, this.t, this.dt);
			window.storage.insertBookmark(bmark);
		});
   	});

	$(".searchBox").keyup(function (e) {
		window.storage.searchBookmarks($(this).attr("value"));
	});
	
});