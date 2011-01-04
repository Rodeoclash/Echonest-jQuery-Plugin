(function(window, $) {
	
	/**
	 * Root class. This can be invoked multiple times if you want to connect to the API with different options / keys.
	 */
	function EchoNest(apiKey, options) {
		
		if( !apiKey ) { throw new Error('You must supply an API key to use the API!'); }
		
		var _en = this;
		this.apiKey = apiKey;
		
		this.defaultOptions = {
			endPoint: "http://developer.echonest.com/api/",
			endPointVersion: 'v4',
			format: 'JSON'
		};
		
		// merge options

		this.artist = function(name) {
			if( !name ) { throw new Error('You must supply a name for the artist!'); }
			return new Artist(name);
		};
		
		function missingJQueryTemplates() {
			( $.tmpl === null || $.tmpl === undefined )
		}
		
		/**
		 * Used to handle a response back from the api. Will throw errors if a problem is detected.
		 */
		var Response = function(data) {
			this.data = eval( "(" + data + ")" ); // the paranthesis avoid a JS invalid label error
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
				return _en.defaultOptions.endPoint + _en.defaultOptions.endPointVersion + "/";
			}
			
			function format() {
				return _en.defaultOptions.format
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
					dataType: 'text',
					type: options.type,
					data: data,
					success: function(data, textStatus, XMLHttpRequest) {
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
			 * @returns An array of image objects
			 */
			Artist.prototype.images = function(callback, options) {
				var	request = new Request(),
						options = $.extend({}, options, {name: this.name});
				request.get(this.endPoint + 'images', options, function(response) {
					callback( new ImageCollection( response.getData() ) );
				});
			}
			
		/**
		 * Used to interact with a collection of image objects
		 */
		var ImageCollection = function(data) {
			this.data = data;
		};
		
			/**
			 * Directly access the image hashes. This is useful for direct looping when one of the helper functions is not enough.
			 */
			ImageCollection.prototype.images = function() {
				return this.data.images;
			}
			
			/**
			 * Returns an array of image paths.
			 */
			ImageCollection.prototype.to_a = function() {
				var toReturn = [];
				$.each( this.data.images, function(count, image) {
					toReturn.push(image.url);
				});
				return toReturn;
			}
			
			/**
			 * Returns an html string based on the supplied jQuery template.
			*/
			ImageCollection.prototype.to_html = function(template) {
				console.log( this.images() );
				if( missingJQueryTemplates() ) { throw new Error('jQuery templates must be installed to convert an image collection to html') }
				return $.tmpl( template, this.images() );
			}
		
	}
	
	// setup interfaces
	window.EchoNest = EchoNest;
	
})(window, jQuery);