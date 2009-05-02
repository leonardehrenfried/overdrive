/**
* Object that represents the local SQL storage.
*/
function LocalStorage(){
	this.DB_VERSION="0.1";
	this.DB_NAME="overdrive delicious.com";
	this.db = openDatabase(this.DB_NAME, this.DB_VERSION);
	this.tableList=[];
	this.tableList["bookmarks"]="CREATE TABLE bookmarks (url TEXT NOT NULL UNIQUE, title TEXT, tags TEXT, modified DATETIME)";
	this.tableList["settings"]="CREATE TABLE settings (key TEXT NOT NULL UNIQUE, type TEXT, value TEXT)";
	this.tableList["tags"]="CREATE TABLE tags (tag TEXT NOT NULL UNIQUE, amount INT, visited INT)";
	this.resultQueue;
	this.displayQueue;
	this.settings=new Array();
	
	/**
	* This block checks if the tables exists and creates the necessary ones.
	*/
	this.checkIfTableExists=function (tableName) {
		this.db.transaction(function(tx) {
				
				tx.executeSql("SELECT COUNT(*) FROM "+tableName, [], function(result) {}, function(tx, error) {
					tx.executeSql(overdrive.storage.tableList[tableName],[],
					function(result) { 
		                $.jGrowl("table '"+tableName+"' created");
		            },
					function(error) {
						alert("could not create table "+error.message);
					}
					);

		        });
		    
		});
	};	
		
	
		
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
	* Inserts a bookmark into the local db.
	*/
	this.insertBookmark= function(bmark) {
		this.db.transaction(function(tx){
			     tx.executeSql("INSERT INTO bookmarks (url, title, tags, modified) VALUES (?,?,?,datetime(?))",
					[bmark.url, bmark.title, bmark.getTagsAsString(),bmark.getSqliteDate()], 			
				 function(tx, result){       
			     }, 
				 function(tx, error){
				     tx.executeSql("UPDATE bookmarks SET url=?, title=?, tags=?, modified=datetime(?) WHERE url=?",
						[bmark.url, bmark.title, bmark.getTagsAsString(),bmark.url, bmark.getSqliteDate()], 			
					 function(tx, result){       
				     }, 
					 function(tx, error){
						$.jGrowl('Could not insert or update bookmark: ' + error.message);
				     });
			     });
		});
	};	
	/**
	*
	*/
	this.setSetting = function (key, value) {
		this.settings[key]=value;
		var type=typeof value;
		if (typeof value == 'number'){
			setting+="";
			type=typeof key;
		}
		
		else if (typeof value=='object'){
			type="date";
		}
		
		else if (type=='boolean'){
			
			
			if (value)
			{
				value="True";
			}
			else{
				value="False";
			}
		}
		
		else
		{
			type=typeof value;
		}
		
		
		this.db.transaction(function(tx){
			     tx.executeSql("INSERT INTO settings (key, value, type) VALUES (?,?,?)",
					[key, value, type], 			
				 function(tx, result){
					overdrive.storage.settings[key]=value;     
			     }, 
				 function(tx, error){
					tx.executeSql("UPDATE settings SET key=?, value=?, type=? WHERE key=?",
						[key, value, type, key], 			
					 function(tx, result){
						overdrive.storage.settings[key]=value;       
				     }, 
					 function(tx, error){
						$.jGrowl('Could not insert or update setting: ' + error.message);
				     });
			     });
		});
	};
			
	/**
	* Returns one of the settings values in the local storage.
	*/ 
	this.getSettings=function(callback){
		this.db.transaction(function(tx){
			     tx.executeSql("SELECT key,value,type FROM settings",
					[], 			
				 function(tx, result){
					if (!result.rows.length){
						$.jGrowl("could not find the requested setting");
					}

					else{
							for (var i = 0; i < result.rows.length; ++i) {
								var row = result.rows.item(i);
								var value=row['value'];
								var type=row['type'];

								if (type=="boolean"){
									if (value=="True"){
										value=true;
									}
									else{
										value=false;
									}
								}
								else if (type=='date')
								{
									value=Date.parse(value);
								}
								
								overdrive.storage.settings[row['key']]=value;	
							}							
		            }
					/*
					* Executes code after data has been fetched from the DB
					*/
					if (callback!==undefined)
					{
						callback();
					}
			     }, 
				 function(tx, error){
					$.jGrowl("query wrong:"+error.message);
			     });
		});
	};
	
	/**
	* Searches for a bookmark across title, url and tags.
	* @param: the search term
	*/
	this.searchBookmarks=function(term) 
	{
		this.db.transaction(function(tx) 
		{
			var result=tx.executeSql("SELECT * FROM bookmarks WHERE tags LIKE ? OR title LIKE ? ORDER BY modified DESC",["%"+term+"%","%"+term+"%"], 
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
	this.getAllBookmarks=function(){
		this.db.transaction(function(tx) 
		{
			var result=tx.executeSql("SELECT * FROM bookmarks ORDER BY modified DESC",[], 
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
	
	this.insertTag=function (tag, bookmarks) {
		this.db.transaction(function(tx){
				tx.executeSql("INSERT INTO tags (tag, amount) VALUES(?,?)",
					[tag, bookmarks], 			
				 function(tx, result){
					 //$.jGrowl("tag inserted:"+result);				
		            }, 
				 function(tx, error){
					$.jGrowl("Could not insert tag into database:"+error.message);
			     });
		});
	};
	
	/*
	* Return the next tag that has not been visited yet
	*/
	this.getNextTag=function(callback) {
		var tagString="SELECT tag, amount FROM tags WHERE visited IS NULL ORDER BY amount DESC LIMIT 1";
		
		this.db.transaction(function(tx){
				tx.executeSql(tagString,
					[], 			
				 function(tx, result){
						
						if (!result.rows.length){
							overdrive.storage.setSetting("bookmarksComplete", true);	
						}

						else{
							var row = result.rows.item(0);
							callback(row["tag"]);
			            }			
		            }, 
				 function(tx, error){
					$.jGrowl("Could not fetch tag from database: "+error.message);
			     });
		});
	};
	
	this.markTagAsVisited=function(tag){
		var sql="UPDATE tags SET visited=1 WHERE tag=?";
		this.db.transaction(function(tx){
				tx.executeSql(sql,
					[tag], 			
				 function(tx, result){
					//$.jGrowl("Downloaded bookmarks for tag'"+tag+"'.");		
		            }, 
				 function(tx, error){
					$.jGrowl("Could not mark tag as visited: "+error.message);
			     });
		});
	};
	/**
	*
	* Constructor block.
	*/
	for (key in this.tableList)
	{
		this.checkIfTableExists(key);
	}
}
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

function Bookmark(url, title, tags, modified){
	this.url=url;
	this.title=title;
	this.modified=modified;
	
			
	if (typeof tags == 'string'){
		this.tags=tags.split(",");
	}
	else
	{
		this.tags=tags;
	}
	
	$("#content").append("<li><a href='"+this.url+"'>"+this.title+"</a></li>");
	
	this.getSqliteDate=function()
	{
		return modified.slice(0,-1);
	};
	
	this.getTagsAsString=function () {
		var tagsString="";
		$.each(this.tags, function() {
		      tagsString+=this+",";
		    });
		return tagsString;
	};
}

var overdrive=new Object();
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
			overdrive.storage.getNextTag(function (tag) {
					overdrive.remote.getBookmarksFromTag(tag);
			});
			
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
			
			if (lastUpdate<now)
			{
				overdrive.sync(20); //get the last 20 bookmarks
			}
			
		}, 500);

	$(".searchBox").keyup(function (e) {
		overdrive.storage.searchBookmarks($(this).attr("value"));
	});
	
});