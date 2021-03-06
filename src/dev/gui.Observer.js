/**
 * Monitors a document for unsolicitated DOM changes in development mode. 
 * Temp patch for http://code.google.com/p/chromium/issues/detail?id=13175
 */
gui.Observer = {

	/**
	 * Enable monitoring?
	 * @type {boolean}
	 */
	observes : gui.Client.hasMutations,

	/**
	 * Throw exception on mutations not intercepted by the framework? 
	 * Observers run async, so the stack trace is anyways not usable.
	 * @type {boolean}
	 */
	fails : false,

	/**
	 * Observe document mutations in given window context.
	 * @param {Window} win
	 */
	observe : function ( win ) {
		if ( win.gui.debug ) {
			this._observe ( win );
		}
	},

	/**
	 * Suspend mutation monitoring of document associated to node;
	 * enable monitoring again after executing provided function.
	 * @param {Node} node
	 * @param @optional {function} action
	 * @param @optional {object} thisp
	 * @returns {object} if action was defined, we might return something
	 */
	suspend : function ( node, action, thisp ) {
		var res;
		if ( node.nodeType ) {
			if ( this.observes ) {
				if ( ++ this._suspend === 1 ) {
					this._connect ( node, false );
				}
			}
			if ( gui.Type.isFunction ( action )) {
				res = action.call ( thisp );
			}
			if ( this.observes ) {
				this.resume ( node );
			}
		} else {
			throw new TypeError ();
		}
		return res;
	},

	/**
	 * Resume monitoring of mutations in document associated to node.
	 * @param {Node} node
	 */
	resume : function ( node ) {
		if ( node.nodeType ) {
			if ( this.observes ) {
				if ( -- this._suspend === 0 ) {
					this._connect ( node, true );
				}
			}
		} else {
			throw new TypeError ();
		}
	},


	// Private ..............................................................

	/**
	 * Is suspended? Minimize what overhead there might 
	 * be on connecting and disconnecting the observer.
	 * @TODO do we need to track this for each window?
	 * @type {number}
	 */
	_suspend : 0,

	/**
	 * Tracking MutationObservers for window contexts by gui.$contextid
	 * @type {Map<String,MutationObserver}
	 */
	_observers : Object.create ( null ),

	/**
	 * Start observing.
	 * @param {Window} win
	 */
	_observe : function ( win ) {
		var sig = win.gui.$contextid;
		var doc = win.document;
		var obs = this._observers [ sig ];
		if ( this.observes ) {
			if ( !gui.Type.isDefined ( obs )) {
				var Observer = this._mutationobserver ();
				obs = this._observers [ sig ] = new Observer ( function ( mutations ) {
					mutations.forEach ( function ( mutation ) {
						gui.Observer._handleMutation ( mutation );
					});
				});
			}
			this._connect ( doc, true );
		}
	},

	/**
	 * Get observer.
	 * @returns {function} MutationObserver
	 */
	_mutationobserver : function () {
		return window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
	},

	/**
	 * Connect and disconnect observer.
	 * @param {Node} node
	 * @param {boolean} connect
	 */
	_connect : function ( node, connect ) {
		var doc = node.ownerDocument || node;
		var win = doc.defaultView;
		var sig = win.gui.$contextid;
		var obs = this._observers [ sig ];
		if ( obs ) {
			if ( connect ) {
				obs.observe ( doc, {
					childList: true,
					subtree: true
				});
			} else {
				obs.disconnect ();
			}			
		}
	},

	/**
	 * Handle mutation.
	 * @param {MutationRecord} mutation
	 */
	_handleMutation : function ( mutation ) {
		var action = false;
		Array.forEach ( mutation.removedNodes, function ( node ) {
			if ( node.nodeType === Node.ELEMENT_NODE ) {
				console.warn ( "Bad remove:", node );
				action = true;
			}
		});
		Array.forEach ( mutation.addedNodes, function ( node ) {
			if ( node.nodeType === Node.ELEMENT_NODE ) {
				console.warn ( "Bad append:", node );
				action = true;
			}
		});
		if ( action ) {
			console [ this.fails ? "error" : "warn" ] ( this._message ());
		}
	},

	/**
	 * Compute log message.
	 * @returns {String}
	 */
	_message : function () {
		return [ 
			"Action required: DOM mutation not intercepted, Spiritual may be out of synch.",
			"While we wait for http://code.google.com/p/chromium/issues/detail?id=13175,",
			"please use the these methods to replace innerHTML, textContent and outerHTML:",
			"    gui.DOMPlugin.html(node,string)",
			"    gui.DOMPlugin.text(node,string)",
			"    gui.DOMPlugin.outerHtml(node,string)",
			"Tip: You can use insertAdjecantHTML instead of innerHTML for bonus performance."
		].join ( "\n" );
	}
};