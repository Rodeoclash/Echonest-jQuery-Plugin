jQuery Based EchoNest API Plugin
================================
Access the wonderful <http://www.echonest.com/> API directly from Javascript through a simple yet expressive interface. Requires jQuery. jQuery/Underscore templates optional but you're going to be creating yourself a lot of work if you don't use it...

Introduction
------------
You want artist images?

	var echonest = new EchoNest("YOUR_API_KEY");
	echonest.artist("Radiohead").images( function(imageCollection) {
		$('body').prepend( imageCollection.to_html('<img src="${url}">') );
	});
	
Most collections received back from the plugin can either be access directly, converted to an array of strings or if you have jQuery templates installed, converted directly to a string of HTML (as in the above example). Accessing collections through jQuery templates can yield surprisingly concise and expressive code.

Audio too!

	var echonest = new EchoNest("YOUR_API_KEY");
	echonest.artist("Hybrid").audio( function(audioCollection) {
		$("body").append( audioCollection.to_html('<p>${artist} - ${length} long<br /><audio src="${url}" controls preload="none"></audio></p>') );
	});

We can output audio directly into the browser using the HTML5 audio tag.

Collections
-----------
Most queries to the EchoNest API result in collections. Collections can either be natively iterated using the jQuery templates, or particular records can be extracted using the .at(x) function. For example, lets get the second Radiohead biography (by their EchoNest ID)

	var echonest = new EchoNest("YOUR_API_KEY");
	echonest.artist("ARH6W4X1187B99274F").biographies( function(biographyCollection) {
		$("#artistBiography").append( biographyCollection.at(1).to_html('<p>${text} <br/>by: <strong>${site} - <span class="license">${license_type}</span></strong></p>') );
	});

By setting the .at(x) on a collection, any further calls to that collection will keep working with that record. To work with all records again, call .at(null)

Collections can be manually iterated over by calling .getData(). E.g.

	$.each(biographyCollection.getData(), function(count, item) {
		// your code here
	});
	
More Examples
-------------
Have a look at examples.html for details on how to access all API endpoints.

Ongoing Development
-------------------
Development is ongoing, however the interface to the API is not expected to change. Tests and documentation coming soon.

Feedback
--------
Please post all feedback to sam@richardson.co.nz.