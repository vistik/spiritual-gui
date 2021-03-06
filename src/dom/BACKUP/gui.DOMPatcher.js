/**
 * Patching bad WebKit support for overloading DOM getters and setters, 
 * specifically innerHTML, outerHTML and textContent.This operation is 
 * very time consuming, so let's pray for the related bug to fix soon.
 * @see http://code.google.com/p/chromium/issues/detail?id=13175
 */
gui.DOMPatcher = {

	/**
	 * Can patch property descriptors of elements in given 
	 * window? Safari on iOS throws an epic failure exception.
	 * @param {Window} win
	 * @returns {boolean}
	 */
	canpatch : function ( win ) {
		var root = win.document.documentElement;
		try {
			Object.defineProperty ( root, "innerHTML", this._innerHTML );
			return true;
		} catch ( iosexception ) {
			return false;
		}
	},

	/**
	 * Patch node plus nextsiblings and descendants recursively.
	 */
	patch : function ( node ) {
		if ( gui.DOMChanger.innerhtml.local ) {
			new gui.Crawler ( gui.CRAWLER_DOMPATCHER ).descend ( node, this );
		} else {
			throw new Error ( "Somehow JQuery mode should have handled this :(" );
		}
	},

	/**
	 * Patch single element.
	 * @param {Element} elm
	 */
	handleElement : function ( elm ) {
		[ "innerHTML", "outerHTML", "textContent" ].forEach ( function ( descriptor ) {
			Object.defineProperty ( elm, descriptor, this [ "_" + descriptor ]);
		}, this );
	},


	// Private .........................................................

	/**
	 * Property descriptor for innerHTML.
	 * @type {Object}
	 */
	_innerHTML : {	
		get : function () {
			return gui.DOMSerializer.subserialize ( this );
		},
		set : function ( html ) {
			gui.DOMPlugin.html ( this, html );
		}
	},

	/**
	 * Property descriptor for outerHTML.
	 * @type {Object}
	 */
	_outerHTML : {
		get : function () {
			return gui.DOMSerializer.serialize ( this );
		},
		set : function ( html ) {
			gui.DOMPlugin.outerHtml ( this, html );
		}
	},

	/**
	 * Property descriptor for textContent.
	 * @type {Object}
	 */
	_textContent : {
		get : function () {
			var node = this, res = "";
			for ( node = node.firstChild; node; node = node.nextSibling ) {
				switch ( node.nodeType ) {
					case Node.TEXT_NODE :
						res += node.data;
						break;
					case Node.ELEMENT_NODE :
						res += node.textContent; // recurse
						break;
				}
			}
			return res;
		},
		set : function ( html ) {
			gui.DOMPlugin.html ( this, html.
				replace ( /&/g, "&amp;" ).
				replace ( /</g, "&lt;" ).
				replace ( />/g, "&gt;" ).
				replace ( /"/g, "&quot" )
			);
		}
	}
};