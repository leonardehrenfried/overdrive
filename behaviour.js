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
	this.settings=new Array();
	
	
	
	/**
	* This block checks if the tables exists and creates the necessary ones.
	*/
	this.checkIfTableExists=function (tableName) {
		this.db.transaction(function(tx) {
				
				tx.executeSql("SELECT COUNT(*) FROM "+tableName, [], function(result) {}, function(tx, error) {
					alert(error.message);
					tx.executeSql(window.storage.tableList[tableName],[],
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
		var type;
		if (typeof value == 'number'){
			setting+="";
			type=typeof key;
		}
		
		else if (typeof value=='object'){
			type="date";
		}
		
		else if (typeof value=='boolean'){
			
			type=typeof key;
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
			type=typeof key;
		}
		
		
		this.db.transaction(function(tx){
			     tx.executeSql("INSERT INTO settings (key, value, type) VALUES (?,?,?)",
					[key, value, type], 			
				 function(tx, result){
					$.jGrowl("inserted "+key+":"+value);     
			     }, 
				 function(tx, error){
					//$.jGrowl('Could not insert setting: ' + error.message);
					tx.executeSql("UPDATE settings SET key=?, value=?, type=? WHERE key=?",
						[key, value, type, key], 			
					 function(tx, result){       
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
	this.getSettings=function(){
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
								$.jGrowl(row['key']+":"+value);
								window.storage.settings[row[key]]=value;
								
							}							
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
			var result=tx.executeSql("SELECT * FROM bookmarks WHERE tags LIKE ? OR title LIKE ?",["%"+term+"%","%"+term+"%"], 
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
	/**
	*
	* Constructor block.
	*/
	for (key in this.tableList)
	{
		this.checkIfTableExists(key);
	}
}

function RemoteStorage(){
	var tagFeed="http://feeds.delicious.com/v2/json/veggieboy4000/ssh";
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



$(document).ready(function(){

	window.storage = new LocalStorage();
	var username="veggieboy4000";
	var url="http://feeds.delicious.com/v1/json/"+username+"?raw&count=100";
	alert("seeting");
	$.getJSON(url+"&callback=?", function(bookmarks){
		$.jGrowl("Fetching data from delicious.com.");
		$.each(bookmarks, function(){
		    var bmark= new Bookmark(this.u, this.d, this.t, this.dt);
			window.storage.insertBookmark(bmark);
		});
		var date=new Date();
		
		window.storage.setSetting("lastUpdate", date);
		window.storage.setSetting("fullSync", true);
		
   	});

	$(".searchBox").keyup(function (e) {
		window.storage.searchBookmarks($(this).attr("value"));
	});
	

	window.storage.getSettings();

	
});