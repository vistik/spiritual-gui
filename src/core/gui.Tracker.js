/**
 * Comment goes here.
 * @extends {gui.Plugin}
 */
gui.Tracker = gui.Plugin.extend ({

	/**
	 * Construction time.
	 * @param {Spirit} spirit
	 */
	onconstruct : function () {
		this._super.onconstruct ();
		this._trackedtypes = Object.create ( null );
		if ( this.spirit ) {
			this._sig = this.spirit.window.gui.$contextid;
		}
	},

	/**
	 * Cleanup on destruction.
	 */
	ondestruct : function () {
		this._super.ondestruct ();
		gui.Object.each ( this._trackedtypes, function ( type, list ) {
			list.slice ().forEach ( function ( checks ) {
				this._cleanup ( type, checks );
			}, this );
		}, this );
	},

	/**
	 * @TODO Toggle type(s).
	 * @param {object} arg
	 * @returns {gui.Tracker}
	 */
	toggle : function ( arg, checks ) {
		console.error ( "@TODO SpiritTracker#toggle" );
	},

	/**
	 * Contains handlers for type(s)? Note that handlers might 
	 * assert criterias other than type in order to be invoked.
	 * @param {object} arg
	 * @returns {boolean}
	 */
	contains : function ( arg ) {
		return this._breakdown ( arg ).every ( function ( type ) {
			return this._trackedtypes [ type ];
		}, this );
	},
	
	
	// Private .....................................................
		
	/**
	 * Global mode? This doesn't nescessarily makes 
	 * sense for all {gui.Tracker} implementations.
	 * @type {boolean}
	 */
	_global : false,

	/**
	 * Bookkeeping types and handlers.
	 * @type {Map<String,Array<object>}
	 */
	_trackedtypes : null,

	/**
	 * Containing window's gui.$contextid.
	 * @TODO: Get rid of it
	 * @type {String}
	 */
	_sig : null,

	/**
	 * Execute operation in global mode. Note that sometimes it's still 
	 * needed to manually flip the '_global' flag back to 'false' in 
	 * order to avoid the mode leaking the into repeated (nested) calls.
	 * @param {function} operation
	 * @returns {object}
	 */
	_globalize : function ( operation ) {
		this._global = true;
		var res = operation.call ( this );
		this._global = false;
		return res;
	},

	/**
	 * Can add type of given checks?
	 * @param {String} type
	 * @param {Array<object>} checks
	 * @returns {boolean}
	 */
	_addchecks : function ( type, checks ) {
		var result = false;
		var list = this._trackedtypes [ type ];
		if ( !list ) {
			list = this._trackedtypes [ type ] = [];
			result = true;
		} else {
			result = !this._haschecks ( list, checks );
		}
		if ( result ) {
			list.push ( checks );
		}
		return result;
	},

	/**
	 * Can remove type of given checks? If so, do it now.
	 * @param {String} type
	 * @param {Array<object>} checks
	 * @returns {boolean}
	 */
	_removechecks : function ( type, checks ) {
		var result = false;
		var list = this._trackedtypes [ type ];
		if ( list ) {
			var index = this._checksindex ( list, checks );
			if ( index > -1 ) {
				result = true;
				if ( gui.Array.remove ( list, index ) === 0 ) {
					delete this._trackedtypes [ type ];
				}
			}
		}
		return result;
	},

	/**
	 * Has list for type AND given checks?
	 * @param {String} type
	 * @param {Array<object>} checks 
	 */
	_containschecks : function ( type, checks ) {
		var result = false;
		var list = this._trackedtypes [ type ];
		if ( list ) {
			result = this._haschecks ( list, checks );
		}
		return result;
	},

	/**
	 * Has checks indexed?
	 * @param {Array<Array<object>>} list
	 * @param {Array<object>} checks
	 * @returns {boolean}
	 */
	_haschecks : function ( list, checks ) {
		var result = false;
		list.every ( function ( a ) {
			if ( a.every ( function ( b, i ) {
				return b === checks [ i ];
			})) {
				result = true;
			}
			return !result;
		});
		return result;
	},

	/**
	 * All checks removed?
	 * @returns {boolean}
	 */
	_hashandlers : function () {
		return Object.keys ( this._trackedtypes ).length > 0;
	},

	/**
	 * Get index of checks.
	 * @param {Array<Array<object>>} list
	 * @param {Array<object>} checks
	 * @returns {number}
	 */
	_checksindex : function ( list, checks ) {
		var result = -1;
		list.every ( function ( a, index ) {
			if ( a.every ( function ( b, i ) {
				return b === checks [ i ];
			})) {
				result = index;
			}
			return result === -1;
		});
		return result;
	},

	/**
	 * Resolve single argument into array with one or more entries.
	 * @param {Array<String>|String} arg
	 * @returns {Array<String>}
	 */
	_breakdown : function ( arg ) {
		var result = null;
		switch ( gui.Type.of ( arg )) {
			case "array" :
				result = arg;
				break;
			case "string" :
				result = arg.split ( " " );
				break;
		}
		return result;
	},

	/**
	 * Isolated for subclass to overwrite.
	 * @param {String} type
	 * @param {Array<object>} checks
	 */
	_cleanup : function ( type, checks ) {
		if ( this._removechecks ( type, checks )) { 
			// do cleanup here (perhaps overwrite all this to perform _removechecks elsewhere)
		}
	}

});