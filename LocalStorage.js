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
	this.deleteTable=function(table){
		this.db.transaction(function(tx) {    
				tx.executeSql("DROP TABLE "+table, [], 
					function(result) { 
						$.jGrowl("Deleted table "+table);
					}, 
					function(tx, error) {
						$.jGrowl("Could not delete table:"+error.message);
				});
		});		
	};
	
	/**
	* Inserts a bookmark into the local db.
	*/
	this.insertBookmark= function(bmark) {
		this.db.transaction(function(tx){
			     tx.executeSql("INSERT INTO bookmarks (url, title, tags, modified) VALUES (?,?,?,datetime(?))",
					[bmark.url, bmark.getTitleAsEntity(), bmark.getTagsAsString(),bmark.getSqliteDate()], 			
				 function(tx, result){       
			     }, 
				 function(tx, error){
				     tx.executeSql("UPDATE bookmarks SET url=?, title=?, tags=?, modified=datetime(?) WHERE url=?",
						[bmark.url, bmark.getTitleAsEntity(), bmark.getTagsAsString(),bmark.url, bmark.getSqliteDate()], 			
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
		if (typeof value === 'number'){
			setting+="";
			type=typeof key;
		}
		
		else if (typeof value==='object'){
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
						$.jGrowl("Could not find the requested setting");
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
			var terms=term.split(" ");
			var array=[];
			
			var sql="SELECT * FROM bookmarks WHERE (tags LIKE ?";
			array.push("%"+terms[0]+"%");
			
			for (var i=1; i<terms.length; i++){
				sql+=" AND tags LIKE ? ";
				array.push("%"+terms[i]+"%");
			}
			
			sql+=") ";
			sql+="OR (";
			
			sql+=" title LIKE ? ";
			array.push("%"+terms[0]+"%");
			
			for (i=1; i<terms.length; i++){
				sql+="AND title LIKE ? ";
				array.push("%"+terms[i]+"%");
			}
			
			sql+=") ";
			
			if (terms.lenght>1){
				sql+="OR (";
				
				

				for (i=1; i<terms.length; i++){
					sql+=" title LIKE ? AND tags LIKE ? ";
					array.push("%"+terms[i]+"%");
					array.push("%"+terms[i]+"%");
				}

				sql+=") ";	
			}
			
			sql+="ORDER BY modified DESC";
			
			window.console.log(sql);
			var result=tx.executeSql(sql,array, 
				function(tx, result){
					if (!result.rows.length){
						$("#content").empty();
						return false;
					}
					else{
						$("#content").empty();
						for (var i = 0; i < result.rows.length; ++i) {
							var row = result.rows.item(i);
							var bmark = new Bookmark(row['url'], row['title'], row['tags'], row['modified'],
							function (obj) {
								obj.append();
							}
							);	
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
			var result=tx.executeSql("SELECT * FROM bookmarks ORDER BY modified DESC LIMIT 400",[], 
				function(tx, result){
					if (!result.rows.length){
						$("#content").empty();
						return false;
					}
				
					else{
						$("#content").empty();
						for (var i = 0; i < result.rows.length; ++i) {
							var row = result.rows.item(i);
							var bmark = new Bookmark(row['url'], row['title'], row['tags'], row['modified'],
							//callback function to be passed into the Bookmark object for execution after db fetch
							function (obj) {
								
								obj.append();
							}
							
							);	
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
							$.jGrowl("finished with tags");
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