(function(window, $) {
	
	/**
	 * Root class. This can be invoked multiple times if you want to connect to the API with different options / keys.
	 */
	function EchoNest(apiKey, options) {
		
		function missingJQueryTemplates() {
			( $.tmpl === null || $.tmpl === undefined )
		}
		
		function isInteger(s){
			return (s%(parseInt(s)/Number(s)))===0;
		}
		
		// used to flatten nested json and preserve structure via keyname, this allows easy access to nested JSON values in jQuery templates
		function flatten_json(obj, includePrototype, into, prefix) {
			into = into || {};
			prefix = prefix || "";

			for (var k in obj) {
				if (includePrototype || obj.hasOwnProperty(k)) {
					var prop = obj[k];
					if (prop && typeof prop === "object" &&
						!(prop instanceof Date || prop instanceof RegExp)) {
						flatten_json(prop, includePrototype, into, prefix + k + "_");
					}
					else {
						into[prefix + k] = prop;
					}
				}
			}
			return into;
		}

		
		if( !apiKey ) { throw new Error('You must supply an API key to use the API!'); }
		
		var _en = this;
		this.apiKey = apiKey;
		
		// constants
		this.constants = {
			endPoint: "http://developer.echonest.com/api/",
			endPointVersion: 'v4',
			format: 'jsonp'
		};
		
		// user settable options
		this.options = {
			// none yet
		};
		$.extend(this.options, options);

		// interface to the EchoNest object
		this.artist = function(name) {
			if( !name ) { throw new Error('You must supply a name for the artist!'); }
			return new Artist(name);
		};
		
		/**
		 * Used to handle a response back from the api. Will throw errors if a problem is detected.
		 */
		var Response = function(data) {
			this.data = data;
			if(this.data.status && this.data.status.code && this.data.status.code != 0) {
				throw {
					name: 'API Response Error',
					message: this.data.status.message
				}
			}
		};
		
			Response.prototype.getData = function() {
				return this.data.response;
			}
		
		/**
		 * Used to build a request to the API
		 */
		var Request = function() {

			// merge any extended api details together
			this.extendedDetails = $.extend.apply(true, arguments);
			
			function url() {
				return _en.constants.endPoint + _en.constants.endPointVersion + "/";
			}
			
			function format() {
				return _en.constants.format
			}
			
			function apiKey() {
				return _en.apiKey;
			}
			
			// returns a settings object for use with jQuery ajax requests
			this.settings = function(options) {
				var data = {
					format: format(),
					api_key: apiKey()
				};
				
				$.extend(data, this.extendedDetails); // merge in extended details, this allows customised calls
				
				return {
					url: url() + options.endPoint,
					dataType: 'jsonp',
					type: options.type,
					data: data,
					success: function(data, textStatus, XMLHttpRequest) {
						if (options.success) { options.success(new Response(data)) }
					}
				}
			}
			
		};
		
			Request.prototype.get = function(endPoint, callbackSuccess) {
				$.ajax( this.settings({endPoint: endPoint, success: callbackSuccess, type: 'GET'}) );
			}

		/**
		 * Artist class. Created by passing in a string name of the artist.
		 */
		var Artist = function(name) {
			this.name = name;
			this.endPoint = 'artist/'
		};

			/**
			 * Get all audio associated with this artist.
			 * @returns An AudioCollection object.
			 */
			Artist.prototype.audio = function(callback, options) {
				var request = new Request(options, {name: this.name});
				request.get(this.endPoint + 'audio', function(response) {
					callback( new AudioCollection( response.getData() ) );
				});
			}
			
			/**
			 * Get all biographies associated with this artist.
			 * @returns An BiographyCollection object.
			 */
			Artist.prototype.biographies = function(callback, options) {
				var request = new Request(options, {name: this.name});
				request.get(this.endPoint + 'biographies', function(response) {
					callback( new BiographyCollection( response.getData() ) );
				});
			}
			
			/**
			 * Get all biographies associated with this artist.
			 * @returns An BiographyCollection object.
			 */
			Artist.prototype.blogs = function(callback, options) {
				var request = new Request(options, {name: this.name});
				request.get(this.endPoint + 'blogs', function(response) {
					callback( new BlogCollection( response.getData() ) );
				});
			}
			
			/**
			 * Get all biographies associated with this artist.
			 * @returns An BiographyCollection object.
			 */
			Artist.prototype.familiarity = function(callback, options) {
				var request = new Request(options, {name: this.name});
				request.get(this.endPoint + 'familiarity', function(response) {
					callback( new Familiarity( response.getData() ) );
				});
			}
			
			/**
			 * Get all images associated with this artist.
			 * @returns An ImageCollection object
			 */
			Artist.prototype.images = function(callback, options) {
				var request = new Request(options, {name: this.name});
				request.get(this.endPoint + 'images', function(response) {
					callback( new ImageCollection( response.getData() ) );
				});
			}
		
		/**
		 * Base class used for singular items returned from the API.
		 */
		var Singular = function() {
		}
		
			/**
			 * Getter for the data stored in the singular.
			 * @returns Array Hash of data
			 */
			Singular.prototype.getData = function() {
				return this.data[this.name]
			}
		
			Singular.prototype.to_html = function(template) {
				if( missingJQueryTemplates() ) { throw new Error('jQuery templates must be installed to convert a collection to html') }
				return $.tmpl( template, this.getData() )
			}
		
		/**
		 * Base class used for collections returned from the API.
		 */
		var Collection = function() {
			this.workingWith = null; // used if we want to work with a singular item out of the collection.
		};
		
			/**
			 * Getter for the data stored in the collection. If working with is set, return only that record.
			 * @returns Array Data stored on the collection.
			 */
			Collection.prototype.getData = function() {
				return ( this.getWorkingWith() ) ? this.data[this.name][this.getWorkingWith()] : this.data[this.name]
			}
			
			Collection.prototype.setWorkingWith = function(count) {
				this.workingWith = count;
				return this.workingWith;
			}
			
			Collection.prototype.getWorkingWith = function(count) {
				return this.workingWith;
			}
			
			/**
			 * Returns where results recieved from the server started from.
			 * @returns Integer Start point
			 */
			Collection.prototype.start = function(count) {
				return parseInt(this.data.start, 10);
			}
			
			/**
			 * Returns a total count for the collection on the server
			 * @returns Integer Total results available on the server
			 */
			Collection.prototype.total = function(count) {
				return parseInt(this.data.total, 10);
			}
			
			/**
			 * Returns the size of the collection
			 * @returns Integer Number of items in the collection
			 */
			Collection.prototype.size = function(count) {
				return this.getData().length;
			}
		
			/**
			 * Used to interact with a collection of images
			 * @returns String Formatted according to the template passed in.
			 */
			Collection.prototype.to_html = function(template) {
				if( missingJQueryTemplates() ) { throw new Error('jQuery templates must be installed to convert a collection to html') }
				return $.tmpl( template, this.getData() )
			}
			
			/**
			 * Set a specific item in the collection to work with. Setting this will make the collection always work with that item until set again.
			 * To go back to working with the full collection, set to any non integer value.
			 * @returns String Formatted according to the template passed in.
			 */
			Collection.prototype.at = function(count) {
				( isInteger(count) ) ? this.setWorkingWith(count) : this.setWorkingWith(null);
				return this;
			}
		
		/**
		 * Used to interact with a collection of audio objects
		 * Inherits from Collection
		 */
		var AudioCollection = function(data) {
			this.data = data;
			this.name = "audio";
		};
		AudioCollection.prototype = new Collection(); AudioCollection.prototype.constructor = AudioCollection;
		
		/**
		 * Used to interact with a collection of blogs
		 * Inherits from Collection
		 */
		var BlogCollection = function(data) {
			this.data = data;
			this.name = "blogs";
		};
		BlogCollection.prototype = new Collection(); BlogCollection.prototype.constructor = BlogCollection;
		
		/**
		 * Used to interact with a collection of biographies
		 * Inherits from Collection
		 */
		var BiographyCollection = function(data) {
			var that = this;
			this.data = data;
			this.name = "biographies";
			
			// flatten the json so we have access to nested items from inside the template
			$.each( this.data[this.name], function(count, item) {
				that.data[that.name][count] = flatten_json(item);
			});
			
		};
		BiographyCollection.prototype = new Collection(); BiographyCollection.prototype.constructor = BiographyCollection;
		
		var Familiarity = function(data) {
			this.data = data;
			this.name = "artist";
		};
		Familiarity.prototype = new Singular(); Familiarity.prototype.constructor = Familiarity;
		
		/**
		 * Used to interact with a collection of images
		 * Inherits from Collection
		 */
		var ImageCollection = function(data) {
			this.data = data;
			this.name = "images";
		};
		ImageCollection.prototype = new Collection(); ImageCollection.prototype.constructor = ImageCollection;
		
	}
	
	// setup interfaces
	window.EchoNest = EchoNest;
	
})(window, jQuery);