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
			Artist.prototype.biography = function(callback, options) {
				var request = new Request(options, {name: this.name});
				request.get(this.endPoint + 'biographies', function(response) {
					callback( new BiographyCollection( response.getData() ) );
				});
			}
		
		/**
		 * Base class used for collections in the API.
		 */
		var Collection = function() {
			this.workingWith = null;
		};
		
		/**
		 * Getter for the data stored in the collection.
		 * @returns Array Data stored on the collection.
		 */
			Collection.prototype.getData = function() {
				return this.data[this.name];
			}
			
			Collection.prototype.setWorkingWith = function(count) {
				this.workingWith = count;
				return this.workingWith;
			}
			
			Collection.prototype.getWorkingWith = function(count) {
				return this.workingWith;
			}
		
			/**
			 * Used to interact with a collection of images
			 * @returns String Formatted according to the template passed in.
			 */
			Collection.prototype.to_html = function(template) {
				if( missingJQueryTemplates() ) { throw new Error('jQuery templates must be installed to convert a collection to html') }
				return ( this.getWorkingWith() ) ? $.tmpl( template, this.getData()[this.getWorkingWith()] ) : $.tmpl( template, this.getData() )
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
		 * Used to interact with a collection of images
		 * Inherits from Collection
		 */
		var ImageCollection = function(data) {
			this.data = data;
			this.name = "images";
		};
		ImageCollection.prototype = new Collection(); ImageCollection.prototype.constructor = ImageCollection;
		
		/**
		 * Used to interact with a collection of biographies
		 * Inherits from Collection
		 */
		var BiographyCollection = function(data) {
			this.data = data;
			this.name = "biographies";
		};
		BiographyCollection.prototype = new Collection(); BiographyCollection.prototype.constructor = BiographyCollection;
		
	}
	
	// setup interfaces
	window.EchoNest = EchoNest;
	
})(window, jQuery);