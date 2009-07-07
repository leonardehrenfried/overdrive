function Bookmark(url, title, tags, modified, callback){
	this.url=url;
	// replace tags with entities
	this.title=title;
	
	var that=this;
		
	this.modified=modified;
			
	if (typeof tags == 'string'){
		this.tags=tags.split(",");
	}
	else
	{
		this.tags=tags;
	}
	
	
	
	this.append=function () {
		$("#content").append("<li><a href='"+this.url+"'>"+this.title+"</a></li>");
	};
	
	
	this.getSqliteDate=function(){
		return modified.slice(0,-1);
	};
	
	this.getTagsAsString=function () {
		var tagsString="";
		$.each(this.tags, function() {
		      tagsString+=this+",";
		    });
		return tagsString;
	};
	
	this.getTitleAsEntity=function () {
		var replacements=	[
							{"code":"&", 
							 "ent":"&amp;"},
							{"code":"<", 
							 "ent":"&lt;"},
							{"code":">", 
							 "ent":"&gt;"}
							];
		var tempTitle=this.title;
		
		for (var i=0; i<replacements.length; i++)		{
			tempTitle=tempTitle.replace(replacements[i].code, replacements[i].ent);
		};
		return tempTitle;
	};
	/*
	* Callback method to be executed once the object construction is nearly finished
	*/ 
	if (callback!==undefined){
		callback(this);
	}
}