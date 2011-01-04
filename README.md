jQuery Based EchoNest API Plugin
================================
Access the wonderful <http://www.echonest.com/> API directly from Javascript.

Examples
--------
You want images?

	var echonest = new EchoNest("KTY7T5L87IZ1OG2TM");
	echonest.artist("Radiohead").images( function(imageCollection) {
		$('body').prepend( imageCollection.to_html('<img src="${url}">') );
	});
	
Most collections received back from the plugin can either be access directly, converted to an array of strings or if you have jQuery templates instealled, converted directly to a string of HTML (as in the above example).