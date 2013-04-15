/**
 * CSS injection manager.
 */
gui.FlexCSS = {

	/**
	 * Inject styles on startup? Set this to false if you 
	 * prefer to manage these things in a real stylesheet: 
	 * <meta name="gui.FlexCSS.injected" content="false"/>
	 * @type {boolean}
	 */
	injected : true,

	/**
	 * Generating 10 unique classnames for native flex only. 
	 * Emulated flex JS-reads all values from class attribute.
	 * @type {number}
	 */
	maxflex : 10,

	/**
	 * Flipped on CSS injected.
	 * @type {boolean}
	 */
	loaded : false,

	/**
	 * Identification.
	 * @returns {String}
	 */
	toString : function () {
		return "[object gui.FlexCSS]";
	},

	/**
	 * Inject stylesheet in context. For debugging purposes 
	 * we support a setup to dynamically switch the flexmode. 
	 * @param {Window} context
	 * @param {String} mode
	 */
	load : function ( context, mode ) {
		if ( this.injected ) {
			var sheets = this._getsheets ( context.gui.signature );
			if ( sheets && sheets.mode ) {
				sheets [ sheets.mode ].disable ();
			}
			if ( sheets && sheets [ mode ]) {
				sheets [ mode ].enable ();
			} else {
				var doc = context.document, ruleset = this [ mode ];
				var css = sheets [ mode ] = gui.StyleSheetSpirit.summon ( doc, null, ruleset );
				doc.querySelector ( "head" ).appendChild ( css.element );
			}
			sheets.mode = mode;
			this.loaded = true;
		}
	},


	// Private .......................................................................
	
	/**
	 * Elaborate setup to track stylesheets injected into windows. 
	 * This allows us to flip the flexmode for debugging purposes. 
	 * It is only relevant for multi-window setup; we may nuke it.
	 * @type {Map<String,object>}
	 */
	_sheets : Object.create ( null ),

	/**
	 * Get stylesheet configuration for window.
	 * @param {String} sig
	 * @returns {object}
	 */
	_getsheets : function ( sig ) {
		var sheets = this._sheets;
		if ( !sheets [ sig ]) {
			sheets [ sig ] = { 
				"emulated" : null, // {gui.StyleSheetSpirit}
				"native" : null, // {gui.StyleSheetSpirit}
				"mode" : null // {String}
			};
		}
		return sheets [ sig ];
	}
};

/**
 * Emulated ruleset.
 * @todo Attempt all this using floats instead of inline-block and table layouts.
 */
gui.FlexCSS [ "emulated" ] =  {
	".flexrow, .flexcol" : {
		"display" : "block",
		"width" : "100%",
		"height" : "100%"
	},
	".flexrow > *" : {
		"display" : "inline-block",
		"vertical-align" : "top",
		"height" : "100%"
	},
	".flexrow > ._flexcorrect" : {
		"margin-left" : "-4px !important" // @todo Correlate this to computed font-size :)
	},
	"flexcol > *" : {
		"display" : "block",
		"width" : "100%"
	},
	".flexlax > .flexrow" : {
		"display" : "table"
	},
	".flexlax > .flexrow > *" : {
		"display" : "table-cell"
	}
};

/**
 * Native ruleset. Engine can't parse [*=xxxxx] selector (says DOM 
 * exception), so let's just create one billion unique classnames.
 */
gui.FlexCSS [ "native" ] = ( function () {
	var rules = {
		".flexrow, .flexcol" : {
			"display": "-beta-flex",
			"-beta-flex-wrap" : "nowrap"
		},
		".flexcol" : {
			"-beta-flex-direction" : "column",
			"min-height" : "100%"
		},
		".flexrow" : {
			"-beta-flex-direction" : "row",
			"min-width": "100%"
		},
		".flexrow:not(.flexlax) > *, .flexcol:not(.flexlax) > *" : {
				"-beta-flex-basis" : 1
		},
		".flexrow > .flexrow" : {
			"min-width" : "auto"
		}
	};
	function declare ( n ) {
		rules [ ".flexrow > .flex" + n + ", .flexcol > .flex" + n ] = {
			"-beta-flex-grow" : n || 1
		};
		rules [ ".flexrow:not(.flexlax) > .flex" + n ] = {
			"width" : "0"
		};
		rules [ ".flexcol:not(.flexlax) > .flex" + n ] = {
			"height" : "0"
		};
		
	}
	var n = -1, max = this.maxflex;
	while ( ++n <= max ) {
		declare ( n || "" );
	}
	return rules;
}).call ( gui.FlexCSS );