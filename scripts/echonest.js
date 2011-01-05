(function(window, $) {
	
	/**
	 * Root class. This can be invoked multiple times if you want to connect to the API with different options / keys.
	 */
	function EchoNest(apiKey, options) {
		
		function missingJQueryTemplates() {
			( $.tmpl === null || $.tmpl === undefined )
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
				
				$.extend(data, options.extendedDetails); // merge in extended details, this allows customised calls
				
				return {
					url: url() + options.endPoint,
					dataType: 'jsonp',
					type: options.type,
					data: data,
					success: function(data, textStatus, XMLHttpRequest) {
						console.log('success');
						if (options.success) { options.success(new Response(data)) }
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						throw {
							name: 'API Communication Error',
							message: "Their was a problem communicating with the API. " + errorThrown
						}
					}
				}
			}
			
		};
		
			Request.prototype.get = function(endPoint, extendedDetails, callbackSuccess) {
				$.ajax( this.settings({endPoint: endPoint, extendedDetails: extendedDetails, success: callbackSuccess, type: 'GET'}) );
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
				var	request = new Request(),
						options = $.extend({}, options, {name: this.name});
						
				request.get(this.endPoint + 'images', options, function(response) {
					callback( new ImageCollection( response.getData() ) );
				});
			}
			
			/**
			 * Get all audio associated with this artist.
			 * @returns An AudioCollection object.
			 */
			Artist.prototype.audio = function(callback, options) {
				var request = new Request(),
						options = $.extend({}, options, {name: this.name});

				request.get(this.endPoint + 'audio', options, function(response) {
					callback( new AudioCollection( response.getData() ) );
				});
			}
		
		/**
		 * Base class used for collections in the API.
		 */
		var Collection = function() {
			
		};
		
		/**
		 * Getter for the data stored in the collection.
		 * @returns Array Data stored on the collection.
		 */
			Collection.prototype.getData = function() {
				return this.data[this.name];
			}
		
			/**
			 * Used to interact with a collection of images
			 * @returns String Formatted according to the template passed in.
			 */
			Collection.prototype.to_html = function(template) {
				if( missingJQueryTemplates() ) { throw new Error('jQuery templates must be installed to convert a collection to html') }
				return $.tmpl( template, this.getData() );
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
		
	}
	
	// setup interfaces
	window.EchoNest = EchoNest;
	
})(window, jQuery);