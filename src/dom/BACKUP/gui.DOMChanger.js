/**
 * Spiritualizing documents by overloading DOM methods.
 */
gui.DOMChanger = {

	/**
	 * Tracking success with overloading `innerHTML`.
	 * 
	 * - Firefox, Opera and Explorer does this on an Element.prototype level
	 * - Webkit must do this on all *instances* of Element (pending WebKit issue 13175)
	 * - Safari on iOS fails completely and must fallback to use the jQquery module
	 * @type {Map<String,boolean>}
	 */
	innerhtml : {
		global : false,
		local : false, 
		missing : false 
	},

	/**
	 * Declare "spirit" as a fundamental property of things 
	 * and extend native DOM methods in given window scope.
	 * @TODO WeakMap<Element,gui.Spirit> in supporting agents
	 * @param {Window} win
	 */
	change : function ( win ) {
		var element = win.Element.prototype;
		if ( gui.Type.isDefined ( element.spirit )) {
			throw new Error ( "Spiritual loaded twice?" );
		} else {
			element.spirit = null; // defineProperty fails in iOS5
			switch ( win.gui.mode ) {
				case gui.MODE_MANAGED :
				case gui.MODE_NATIVE :
				case gui.MODE_OPTIMIZE : 
					this.upgrade ( win, gui.DOMCombos.getem ());
					break;
				case gui.MODE_JQUERY :
					this._jquery ( win );
					break;
			}
		}
	},

	/**
	 * Upgrade DOM methods in window. 
	 * @param {Window} win
	 * @param {Map<String,function>} combos
	 */
	upgrade : function ( win, combos ) {
		this._change ( win, combos );
	},


	// Private ........................................................................

	/**
	 * JQuery mode: Confirm loaded JQuery 
	 * and the "jquery" Spiritual module.
	 * @param {Window} win
	 * @returns {boolan}
	 */
	_jquery : function ( win ) {
		var ok = false;
		if (!( ok = gui.Type.isDefined ( win.jQuery ))) {
			throw new Error ( "Spiritual runs in JQuery mode: Expected JQuery to be loaded first" );
		}
		if (!( ok = win.gui.hasModule ( "jquery" ))) {
			throw new Error ( "Spiritual runs in JQuery mode: Expected the \"jquery\" module" );
		}
		return ok;
	},

	/**
	 * Observe the document by extending Element.prototype to 
	 * intercept DOM updates. Firefox ignores extending of 
	 * Element.prototype, we must step down the prototype chain.
	 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=618379
	 * @TODO Extend DocumentFragment
	 * @TODO Support insertAdjecantHTML
	 * @TODO Support SVG elements
	 * @param {Window} win
	 * @param {Map<String,function} combos
	 */
	_change : function _change ( win, combos ) {
		var did = [], doc = win.document;
		if ( !this._canchange ( win.Element.prototype, win, combos )) {
			if ( !win.HTMLElement || !this._canchange ( win.HTMLElement.prototype, win )) {
				this._tags ().forEach ( function ( tag ) {
					var e = doc.createElement ( tag );
					var p = e.constructor.prototype;
					// alert ( p ); this call throws a BAD_CONVERT_JS
					if ( p !== win.Object.prototype ) { // excluding object and embed tags
						if ( did.indexOf ( p ) === -1 ) {
							this._dochange ( p, win, combos );
							did.push ( p ); // some elements share the same prototype
						}
					}
				}, this );
			}
		}
	},

	/**
	 * Firefox has to traverse the constructor of *all* elements.
	 * Object and embed tags excluded because the constructor of 
	 * these elements appear to be identical to Object.prototype.
	 * @returns {Array<String>}
	 */
	_tags : function tags () {
		return ( "a abbr address area article aside audio b base bdi bdo blockquote " +
			"body br button canvas caption cite code col colgroup command datalist dd del " +
			"details device dfn div dl dt em fieldset figcaption figure footer form " +
			"h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd keygen " +
			"label legend li link main map menu meta meter nav noscript ol optgroup option " +
			"output p param pre progress q rp rt ruby s samp script section select small " +
			"source span strong style submark summary sup table tbody td textarea tfoot " +
			"th thead time title tr track ul unknown var video wbr" ).split ( " " );
	},

	/**
	 * Can extend given prototype object? If so, do it now.
	 * @param {object} proto
	 * @param {Window} win
	 * @param {Map<String,function} combos
	 * @returns {boolean} Success
	 */
	_canchange : function _canchange ( proto, win, combos ) {
		// attempt overwrite
		var result = false;
		var test = "it appears to work";
		var cache = proto.hasChildNodes;
		proto.hasChildNodes = function () {
			return test;
		};
		// test overwrite and reset back
		var root = win.document.documentElement;
		if ( root.hasChildNodes () === test) {
			proto.hasChildNodes = cache;
			this._dochange ( proto, win, combos );
			result = true;
		}
		return result;
	},

	/**
	 * Overloading prototype methods and properties. If we cannot get an angle on innerHTML, 
	 * we switch to JQuery mode. This is currently known to happen in Safari on iOS 5.1
	 * @TODO Firefox creates 50-something unique functions here
	 * @TODO Test success runtime (not rely on user agent string).
	 * @TODO inserAdjecantHTML
	 * @param {object} proto
	 * @param {Window} win
	 * @param {Map<String,function} combos
	 */
	_dochange : function _dochange ( proto, win, combos ) {
		switch ( gui.Client.agent ) {
			case "explorer" : // http://msdn.microsoft.com/en-us/library/dd229916(v=vs.85).aspx
				this.innerhtml.global = true;
				break;
			case "gecko" :
			case "opera" : // @TODO Object.defineProperty supported?
				this.innerhtml.global = true;
				break;
			case "webkit" :
				if ( gui.DOMPatcher.canpatch ( win )) {
					this.innerhtml.local = true;
					gui.DOMPatcher.patch ( win.document );
				} else {
					this.innerhtml.local = false;
					this.innerhtml.missing = true;
				}
				break;
		}
		var title = win.document.title;
		switch ( win.gui.mode ) {
			case gui.MODE_NATIVE :
				if ( this.innerhtml.missing ) {
					throw new Error ( "Spiritual native mode is not supported on this device." );
				}
				break;
			case gui.MODE_OPTIMIZE :
				if ( this.innerhtml.missing ) {
					win.gui.mode = gui.MODE_JQUERY;
					if ( this._jquery ( win ) && win.gui.debug ) {
						console.log ( 
							title + ": Spiritual runs in JQuery mode. To keep spirits " +
							"in synch, use JQuery or Spiritual to perform DOM updates."
						);
					}
				} else {
					win.gui.mode = gui.MODE_NATIVE;
					if ( win.gui.debug ) {
						console.log ( title + ": Spiritual runs in native mode" );
					}
				}
				break;
		}
		// Overloading methods? Only in native mode.
		// @TODO insertAdjecantHTML
		if ( win.gui.mode === gui.MODE_NATIVE ) {
			var root = win.document.documentElement;
			gui.Object.each ( combos, function ( name, combo ) {
				this._docombo ( proto, name, combo, root );
			}, this );
		}
	},

	/**
	 * Property setters for Firefox and Opera.
	 * @param {object} proto
	 * @param {String} name
	 * @param {function} combo
	 * @param {Element} root
	 */
	_docombo : function ( proto, name, combo, root ) {
		if ( this._ismethod ( name )) {
			this._domethod ( proto, name, combo );
		} else {
			switch ( gui.Client.agent ) {
				case "opera" :
				case "gecko" :
					//try {
						this._doboth ( proto, name, combo, root );
					/*
					} catch ( exception ) { // firefox 21 is changing to IE style?
						alert("??")
						this._doie ( proto, name, combo );	
					}
					*/
					break;
				case "explorer" :
					this._doie ( proto, name, combo );
					break;
				case "webkit" :
					// it's complicated
					break;
			}
		}
	},

	/**
	 * Is method? (non-crashing Firefox version)
	 * @returns {boolean}
	 */
	_ismethod : function ( name ) {
		var is = false;
		switch ( name ) {
			case "appendChild" : 
			case "removeChild" :
			case "insertBefore" :
			case "replaceChild" :
			case "setAttribute" :
			case "removeAttribute" :
				is = true;
				break;
		}
		return is;
	},

	/**
	 * Overload DOM method (same for all browsers).
	 * @param {object} proto
	 * @param {String} name
	 * @param {function} combo
	 */
	_domethod : function ( proto, name, combo ) {
		var base = proto [ name ];
		proto [ name ] = combo ( function () {
			return base.apply ( this, arguments );
		});
	},

	/**
	 * Overload property setter for IE.
	 * @param {object} proto
	 * @param {String} name
	 * @param {function} combo
	 * @param {Element} root
	 */
	_doie : function ( proto, name, combo ) {
		var base = Object.getOwnPropertyDescriptor ( proto, name );
		Object.defineProperty ( proto, name, {
			get: function () {
				return base.get.call ( this );
			},
			set: combo ( function () {
				base.apply ( this, arguments );
			})
		});
	},

	/**
	 * Overload property setter for Firefox and Opera. 
	 * Looks like Gecko is moved towards IE setup (?)
	 * @param {object} proto
	 * @param {String} name
	 * @param {function} combo
	 * @param {Element} root
	 */
	_doboth : function ( proto, name, combo, root ) {
		var getter = root.__lookupGetter__ ( name );
		var setter = root.__lookupSetter__ ( name );
		if ( getter ) {
			// firefox 20 needs a getter for this to work
			proto.__defineGetter__ ( name, function () {
				return getter.apply ( this, arguments );
			});
			// the setter still seems to work as expected
			proto.__defineSetter__ ( name, combo ( function () {
				setter.apply ( this, arguments );
			}));
		} else {
			// firefox 21 can't lookup textContent getter *sometimes*
			throw new Error ( "Can't lookup getter for " + name );
		}
	}
};