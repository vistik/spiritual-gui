/**
 * # gui.Type
 * Type checking studio. All checks are string based not to cause 
 * confusion when checking the types of objects in another window.
 */
gui.Type = {

	/**
	 * Get type of argument. Note that response may differ between user agents.
	 * @see  http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator
	 * @param {object} o
	 * @returns {String}
	 */
	of : function ( o ) {
		var type = ({}).toString.call ( o ).match ( this._typeexp )[ 1 ].toLowerCase ();
		if ( type === "domwindow" && String ( typeof o ) === "undefined" ) {
			type = "undefined"; // some kind of degenerate bug in Safari on iPad
		}
		return type;
	},

	/**
	 * Is object defined?
	 * @todo unlimited arguments support
	 * @param {object} o
	 * @returns {boolean}
	 */
	isDefined : function ( o ) {
		return this.of ( o ) !== "undefined";
	},

	/**
	 * Is complex type?
	 * @param {object} o
	 * @returns {boolean}
	 */
	isComplex : function ( o ) {
		switch ( this.of ( o )) {
			case "undefined" :
			case "boolean" :
			case "number" :
			case "string" :
			case "null" :
				return false;
		}
		return true;
	},

	/**
	 * Is Window object?
	 * @param {object} o
	 * @returns {boolean}
	 */
	isWindow : function ( o ) {
		return o && o.document && o.location && o.alert && o.setInterval;
	},

	/**
	 * Is Event object?
	 * @pram {object} o
	 * @returns {boolean}
	 */
	isEvent : function ( o ) {
		return this.of ( o ).endsWith ( "event" ) && this.isDefined ( o.type );
	},

	/**
	 * Is spirit instance?
	 * @returns {boolean}
	 */
	isSpirit : function ( o ) {
		return o && o instanceof gui.Spirit;
	},

	/**
	 * Is function fit to be invoked via the "new" operator? 
	 * We assume true if the prototype reveals any properties.
	 * @param {function} what
	 * @returns {boolean}
	 */
	isConstructor : function ( what ) {
		return this.isFunction ( what ) && Object.keys ( what.prototype ).length > 0;
	},

	/**
	 * Is constructor for a Spirit?
	 * @todo Why can't isConstructor be used here?
	 * @todo something more reliable than "portals".
	 * @param {function} what
	 * @returns {boolean}
	 */
	isSpiritConstructor : function ( what ) {
		return this.isFunction ( what ) && this.isBoolean ( what.portals ); // lousy
	},

	/**
	 * Autocast string to an inferred type. "123" will 
	 * return a number, "false" will return a boolean.
	 * @todo move to gui.Type :)
	 * @param {String} string
	 * @returns {object}
	 */
	cast : function ( string ) {
		var result = String ( string );
		switch ( result ) {
			case "null" :
				result = null;
				break;
			case "true" :
			case "false" :
				result = ( result === "true" );
				break;
			default :
				if ( String ( parseInt ( result, 10 )) === result ) {
					result = parseInt ( result, 10 );
				} else if ( String ( parseFloat ( result )) === result ) {
					result = parseFloat ( result );
				}
				break;	
		}
		return result;
	},

	/**
	 * Resolve single argument into an array with one 
	 * or more entries. Strings to be split at spaces.
	 * @param {object} arg
	 * @returns {Array<object>}
	 */
	list : function ( arg ) {
		var list = null;
		switch ( this.of ( arg )) {
			case "array" :
				list = arg;
				break;
			case "string" :
				list = arg.split ( " " );
				break;
			case "nodelist" :
			case "arguments" :
				list = Array.prototype.slice.call ( arg );
				break;
			default :
				list = [ arg ];
				break;
		}
		return list;
	},

	// Private ...........................................................

	/**
	 * Match "Array" in "[object Array]" and so on.
	 * @type {RegExp}
	 */
	_typeexp : /\s([a-zA-Z]+)/
};

/**
 * Generate methods for isArray, isFunction, isBoolean etc.
 */
( function generatecode () {
	[	"array", 
		"function", 
		"object", 
		"string", 
		"number", 
		"boolean", 
		"null",
		"arguments",
		"file"
	].forEach ( function ( type ) {
		this [ "is" + type [ 0 ].toUpperCase () + type.slice ( 1 )] = function is ( o ) {
			return this.of ( o ) === type; 
		};
	}, this );
}).call ( gui.Type );