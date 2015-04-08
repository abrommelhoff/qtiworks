/*
 *
 * Requirements:
 *
 * jquery.js
 * jquery-ui.js (incl. Draggable, Resizable, Sortable, Dialog, Slider)
 *
 * Author: David McKain
 *
 * Copyright (c) 2012-2013, The University of Edinburgh
 * All Rights Reserved
 */

/** ********************************************************* */

var QtiWorksRendering = (function() { 

	var submitCallbacks = [];
	var resetCallbacks = [];

	var registerSubmitCallback = function(callback) {
		submitCallbacks.push(callback);
	};

	var registerResetCallback = function(callback) {
		resetCallbacks.push(callback);
	};

	var queryInputElements = function(responseIdentifier) {
		return $('input[name=qtiworks_response_' + responseIdentifier + ']');
	};

	/** ********************************************************* */
	/* sliderInteraction */

	var SliderInteraction = function(responseIdentifier, configData) {
		this.responseIdentifier = responseIdentifier;
		this.sliderQuery = $('#qtiworks_id_slider_' + responseIdentifier);
		this.feedbackQuery = $('#qtiworks_id_slidervalue_' + responseIdentifier);
		this.inputElementQuery = $('input[name="qtiworks_response_'
				+ responseIdentifier + '"]');
		this.min = configData.min;
		this.max = configData.max;
		this.step = configData.step;
		this.orientation = configData.orientation;
		this.isReversed = configData.isReversed;
		this.isDiscrete = configData.isDiscrete;
		this.initialValue = this.inputElementQuery.get(0).value || this.min;
		var interaction = this;

		this.init = function() {
			this.sliderQuery.slider({
				value : interaction.initialValue,
				step : interaction.step,
				orientation : interaction.orientation,
				/*
				 * (To handle 'reverse', we simply negate and swap min/max when
				 * mapping to/from the slider itself)
				 */
				min : interaction.isReversed ? -interaction.max
						: interaction.min,
				max : interaction.isReversed ? -interaction.min
						: interaction.max,
				slide : function(event, ui) {
					var value = interaction.isReversed ? -ui.value : ui.value;
					interaction.setValue(value);
				}
			});
			this.reset();
		};

		this.setValue = function(value) {
			this.inputElementQuery.get(0).value = value;
			this.feedbackQuery.text(value);
			this.sliderQuery.slider('value', this.isReversed ? -value : value);
		};

		this.reset = function() {
			this.setValue(this.initialValue);
		};

		registerResetCallback(function() {
			interaction.reset();
		});
	};

	/** ********************************************************* */
	/* matchInteraction */

	var MatchInteraction = function(responseIdentifier, maxAssociations,
			leftData, rightData) {
		this.responseIdentifier = responseIdentifier;
		this.maxAssociations = maxAssociations;
		this.matchCount = 0;
		this.leftMap = {};
		this.rightMap = {};
		this.matched = [];
		var interaction = this;

		for ( var key in leftData) {
			this.leftMap[key] = {
				matchMax : leftData[key],
				matchCount : 0
			};
		}
		for ( var key in rightData) {
			this.rightMap[key] = {
				matchMax : rightData[key],
				matchCount : 0
			};
		}

		this.withCheckbox = function(inputElement, callback) {
			var directedPair = inputElement.value;
			var splitPair = directedPair.split(" ");
			var left = interaction.leftMap[splitPair[0]];
			var right = interaction.rightMap[splitPair[1]];
			callback(inputElement, directedPair, left, right);
		};

		this.init = function() {
			queryInputElements(this.responseIdentifier).bind('click',
					function() {
						interaction.checkMatch(this);
					});
			this.recalculate();
			this.updateDisabledStates();
		};

		this.resetChecks = function() {
			queryInputElements(this.responseIdentifier).each(function() {
				if (interaction.matched[this.value]) {
					this.checked = true;
				} else {
					this.checked = false;
				}
			});
			this.recalculate();
			this.updateDisabledStates();
		};

		this.recalculate = function() {
			this.matchCount = 0;
			this.matched = {};
			for ( var key in this.leftMap) {
				this.leftMap[key].matchCount = 0;
			}
			for ( var key in this.rightMap) {
				this.rightMap[key].matchCount = 0;
			}

			queryInputElements(this.responseIdentifier).each(
					function() {
						interaction.withCheckbox(this, function(inputElement,
								directedPair, left, right) {
							if (inputElement.checked) {
								interaction.matchCount++;
								left.matchCount++;
								right.matchCount++;
								interaction.matched[directedPair] = true;
							}
						});
					});
		};

		this.updateDisabledStates = function() {
			queryInputElements(this.responseIdentifier)
					.each(
							function() {
								interaction
										.withCheckbox(
												this,
												function(inputElement,
														directedPair, left,
														right) {
													if (inputElement.checked) {
														inputElement.disabled = false;
													} else if ((interaction.maxAssociations != 0 && interaction.matchCount >= interaction.maxAssociations)
															|| (left.matchMax != 0 && left.matchCount >= left.matchMax)
															|| (right.matchMax != 0 && right.matchCount >= right.matchMax)) {
														inputElement.disabled = true;
													} else {
														inputElement.disabled = false;
													}
												});
							});
		};

		this.checkMatch = function(inputElement) {
			interaction.withCheckbox(inputElement,
					function(inputElement, directedPair, left, right) {
						if (inputElement.checked) {
							var incremented = false;
							if (left.matchMax != 0
									&& left.matchMax <= left.matchCount) {
								inputElement.checked = false;
							} else {
								left.matchCount++;
								interaction.matchCount++;
								incremented = true;
							}

							if (right.matchMax != 0
									&& right.matchMax <= right.matchCount) {
								inputElement.checked = false;
							} else {
								right.matchCount++;
								if (!incremented) {
									interaction.matchCount++;
								}
							}
						} else {
							interaction.matchCount--;
							left.matchCount--;
							right.matchCount--;
						}
						interaction.updateDisabledStates(responseIdentifier);
					});
		};

		registerResetCallback(function() {
			interaction.resetChecks();
		});
	};

	/** ********************************************************* */
	/* gapMatchInteraction (NB: no JS validation of matchMin/required here) */

	var GapMatchInteraction = function(responseIdentifier, gapChoiceData,
			gapData) {
		this.responseIdentifier = responseIdentifier;
		this.gapChoiceMap = {};
		this.gapMap = {};
		this.matched = [];
		var interaction = this;

		for ( var key in gapChoiceData) {
			var query = $('#qtiworks_id_' + this.responseIdentifier + '_' + key);
			this.gapChoiceMap[key] = {
				matchMax : gapChoiceData[key],
				matchCount : 0,
				query : query,
				text : query.text()
			};
		}
		for ( var key in gapData) {
			var query = $('#qtiworks_id_' + this.responseIdentifier + '_' + key);
			this.gapMap[key] = {
				required : gapData[key], /*
											 * NB: This is not currently used in
											 * the JS
											 */
				matched : false,
				matchedGapChoice : null,
				query : query,
				label : query.text()
			};
		}

		this.withCheckbox = function(inputElement, callback) {
			var directedPair = inputElement.value;
			var splitPair = directedPair.split(" ");
			var gapChoice = interaction.gapChoiceMap[splitPair[0]];
			var gap = interaction.gapMap[splitPair[1]];
			callback(inputElement, directedPair, gapChoice, gap);
		};

		this.init = function() {
			var checkboxes = queryInputElements(this.responseIdentifier);
			checkboxes.bind('click', function() {
				interaction.checkMatch(this);
			});
			this.recalculate();
			this.updateDisabledStates();
		};

		this.reset = function() {
			queryInputElements(this.responseIdentifier).each(function() {
				if (interaction.matched[this.value]) {
					this.checked = true;
				} else {
					this.checked = false;
				}
			});
			this.recalculate();
			this.updateDisabledStates();
		};

		this.recalculate = function() {
			this.matchCount = 0;
			for ( var key in this.gapChoiceMap) {
				this.gapChoiceMap[key].matchCount = 0;
			}
			for ( var key in this.gapMap) {
				this.gapMap[key].matched = false;
				this.gapMap[key].matchedGapChoice = null;
			}

			queryInputElements(this.responseIdentifier).each(
					function() {
						interaction.withCheckbox(this, function(inputElement,
								directedPair, gapChoice, gap) {
							if (inputElement.checked) {
								gapChoice.matchCount++;
								gap.matched = true;
								gap.matchedGapChoice = gapChoice;
								interaction.matched[directedPair] = true;
							}
						});
					});

			for ( var key in this.gapMap) {
				var gap = this.gapMap[key];
				var gapText;
				if (gap.matched) {
					gapText = gap.matchedGapChoice.text;
				} else {
					gapText = gap.label;
				}
				gap.query.text(gapText);
			}
		};

		this.updateDisabledStates = function() {
			queryInputElements(this.responseIdentifier)
					.each(
							function() {
								interaction
										.withCheckbox(
												this,
												function(inputElement,
														directedPair,
														gapChoice, gap) {
													if (inputElement.checked) {
														inputElement.disabled = false;
													} else if (gap.matched
															|| (gapChoice.matchMax != 0 && gapChoice.matchCount >= gapChoice.matchMax)) {
														inputElement.disabled = true;
													} else {
														inputElement.disabled = false;
													}
												});
							});
		};

		this.checkMatch = function(inputElement) {
			this
					.withCheckbox(
							inputElement,
							function(inputElement, directedPair, gapChoice, gap) {
								if (inputElement.checked) {
									if (gap.matched
											|| (gapChoice.matchMax != 0 && gapChoice.matchMax <= gapChoice.matchCount)) {
										inputElement.checked = false;
									} else {
										gapChoice.matchCount++;
										gap.matched = true;
										gap.matchedGapChoice = gapChoice;
									}
									gap.query.text(gapChoice.text);
								} else {
									gapChoice.matchCount--;
									gap.matched = false;
									gap.matchedGapChoice = null;
									gap.query.text(gap.label);
								}
								interaction
										.updateDisabledStates(responseIdentifier);
							});
		};

		registerResetCallback(function() {
			interaction.reset();
		});
	};

	/** ********************************************************* */
	/* orderInteraction */

	var OrderInteraction = function(responseIdentifier, initialSourceOrder,
			initialTargetOrder, minChoices, maxChoices) {
		this.responseIdentifier = responseIdentifier;
		this.initialSourceOrder = initialSourceOrder;
		this.initialTargetOrder = initialTargetOrder;
		this.minChoices = minChoices;
		this.maxChoices = maxChoices;
		this.containerQuery = $('#qtiworks_response_' + responseIdentifier);
		this.targetBox = $('#qtiworks_response_' + responseIdentifier
				+ ' div.target');
		this.sourceList = $('#qtiworks_response_' + responseIdentifier
				+ ' div.source ul');
		this.targetList = $('#qtiworks_response_' + responseIdentifier
				+ ' div.target ul');
		this.hiddenInputContainer = $('#qtiworks_response_'
				+ responseIdentifier + ' div.hiddenInputContainer');
		var interaction = this;

		this.reset = function() {
			/* Record items by their HTML ID */
			var itemsById = {};
			var sourceItems = this.sourceList.children('li');
			sourceItems.each(function() {
				itemsById[this.id] = this;
			});
			var targetItems = this.targetList.children('li');
			targetItems.each(function() {
				itemsById[this.id] = this;
			});

			/* Detach items from the page */
			sourceItems.detach();
			targetItems.detach();

			/* Then re-add them in the initial order */
			$.each(interaction.initialSourceOrder,
					function(index, responseIdentifier) {
						var item = itemsById['qtiworks_response_'
								+ responseIdentifier];
						interaction.sourceList.append(item);
					});
			$.each(interaction.initialTargetOrder,
					function(index, responseIdentifier) {
						var item = itemsById['qtiworks_response_'
								+ responseIdentifier];
						interaction.targetList.append(item);
					});
		};

		this.syncHiddenFormFields = function() {
			/* Store the current selected orders in the hidden inputs */
			interaction.hiddenInputContainer.empty();
			interaction.targetList.children('li').each(
					function(index) {
						var choiceId = this.id
								.substring('qtiworks_response_'.length); // Trim
						// leading
						// 'qtiworks_response_'
						var inputElement = $('<input type="hidden">');
						inputElement.attr('name', 'qtiworks_response_'
								+ interaction.responseIdentifier);
						inputElement.attr('value', choiceId);
						interaction.hiddenInputContainer.append(inputElement);
					});
		};

		this.highlight = function(state) {
			this.targetBox.toggleClass('highlight', state);
		};

		this.init = function() {
			/* Add jQuery UI Sortable effect to sourceList */
			var listSelector = '#qtiworks_response_' + this.responseIdentifier
					+ ' ul';
			this.sourceList.sortable({
				connectWith : listSelector
			});
			this.sourceList.disableSelection();
			this.targetList.sortable({
				connectWith : listSelector
			});
			this.targetList.disableSelection();

			/* Register callback to reset things when requested */
			registerResetCallback(function() {
				interaction.reset();
			});

			/* Sync selection into hidden form fields on submit */
			registerSubmitCallback(function() {
				var selectedCount = interaction.targetList.children('li')
						.size();
				if (minChoices != null && maxChoices != null) {
					if (selectedCount < minChoices
							|| selectedCount > maxChoices) {
						if (minChoices != maxChoices) {
							//alert("You must select and order between "
							//		+ minChoices + " and " + maxChoices
							//		+ " items");
						} else {
							//alert("You must select and order exactly "
							//		+ minChoices + " item"
							//		+ (minChoices > 1 ? "s" : ""));
						}
						interaction.highlight(true);
						return false;
					} else {
						interaction.highlight(false);
					}
				}
				interaction.syncHiddenFormFields();
				return true;
			});
		};
	};

	/** ********************************************************* */
	/* GeometryDrawingInteraction */
	var GeometryDrawingInteraction = function(responseIdentifier, configData) {
		this.responseIdentifier = responseIdentifier;
		var board;
		var grid;
		var mode = "none"; // none, point, line, ray, angle, or shape
		var ptsSelected = [];
		var ptsCreated = [];
		var linesCreated = [];
		var raysCreated = [];
		var lineSegmentsCreated = [];
		var anglesCreated = [];
		var angleMeasures = [];
		var altAngleMeasures = []; // used for when two rays or line segments create an angle, but not a JSXGraph angle
		var angleTypes = [];
		var shapesCreated = [];
		var shapePointValues = "/shapePoints:";
		var isSnapTo = false;
		var maxChoices = 0;
		var interaction = this;
		var yScaleSymbol = "";
		var inputElementQuery = $('input[name="qtiworks_response_' + 'RESPONSE'
				+ '"]');

		var gridObject = $('[type=grid]');
		var gridImg = $('[type=gridImg]');
		var tables = $('table');
		var boundsArray = gridObject.attr('bounds').split(' ');
		if (!boundsArray || boundsArray.length < 4) {
			boundsArray = [ -5, 5, 5, -5 ];
		}
		var gridContainer = $('#jxgbox');
		var styleString = "";
		if (gridContainer.attr('height')) {
			styleString += 'height: ' + gridContainer.attr('height') + 'px;';
		} else {
			styleString += 'height: 300px;';
		}
		if (gridContainer.attr('width')) {
			styleString += 'width: ' + gridContainer.attr('width') + 'px;';
		} else {
			styleString += 'width: 500px;';
		}
		isSnapTo = (gridObject.attr('snapTo') == 'true');
		maxChoices = gridObject.attr('maxChoices') != null?parseInt(gridObject.attr('maxChoices')):0;
		yScaleSymbol = gridObject.attr('yScaleSymbol') != null?gridObject.attr('yScaleSymbol'):"";
		gridContainer.attr('style', styleString);
		board = JXG.JSXGraph.initBoard('jxgbox', {
			boundingbox : [ boundsArray[0], boundsArray[1], boundsArray[2],
					boundsArray[3] ],
			showCopyright : false,
			showNavigation : false
		});
		if (gridObject.attr('grid') == 'true') {
			grid = board.create('grid', []);
		}
		if (gridObject.attr('axis') == 'true') {
			var xaxis = board.create('line', [[0,0], [1,0]], {strokeColor:'#222222', lastArrow:true, name:"", withLabel:true});
	        var yaxis = board.create('line', [[0,0], [0,1]], {strokeColor:'#222222', lastArrow:true, name:"", withLabel:true});
	        var xticks = board.create('ticks',[xaxis, 1], {strokeColor:'#ccc', drawLabels: true, minorTicks: 0, majorHeight: -1, label: {offset: [-3, 7.5]}});
	        var yticks;
	        if (yScaleSymbol != '') {
	        	yticks = board.create('ticks',[yaxis, 2], {strokeColor:'#ccc', drawZero: true, drawLabels: true, minorTicks: 0, scaleSymbol: yScaleSymbol, majorHeight: -1, label: {offset: [5, 0]}});
	        } else {
		        yticks = board.create('ticks',[yaxis, 1], {strokeColor:'#ccc', drawZero: false, drawLabels: true, minorTicks: 0, label: {offset: [5, 0]}});
	        }
	        xaxis.isDraggable = false;
	        yaxis.isDraggable = false;
	        xticks.isDraggable = false;
	        yticks.isDraggable = false;
		}
		if (gridImg.length > 0) {
			$('[type="gridImg"]').each(function(){
				if (!$(this).attr('height')) {
					$(this).attr('height', '5');
				}
				if (!$(this).attr('width')) {
					$(this).attr('width', '5')
				}
				if (!$(this).attr('x')) {
					$(this).attr('x', '0');
				}
				if (!$(this).attr('y')) {
					$(this).attr('y', '0')
				}
				var h = $(this).attr('height');
				var w = $(this).attr('width');
				var im = board.create('image', [ $(this).attr('data'), [ $(this).attr('x'), $(this).attr('y') ],
						[ $(this).attr('width'), $(this).attr('height') ] ], {
					isDraggable : false
				});
				im.isDraggable = false;
			});
		}
		if (tables.length > 0) {
			$('table').each(function(){
				$(this).attr('border', 1);
			});
		}
		$('#linedirections').hide();
		$('#linesegdirections').hide();
		$('#raydirections').hide();
		$('#angledirections').hide();
		$('#shapedirections').hide();
		$('#connectPoints').hide();
		// restore any responses
		function getValue() {
			var res = $("input[name='previousResponses']").attr("value");
			// parse values
			var resValues = res.split("/");
			var ptsValues = resValues[0].split(";");
			// ptsValues is always first
			ptsValues[0] = ptsValues[0].replace('points:', '');
			for (var a = 0; a < ptsValues.length; a++) {
				var pt = ptsValues[a];
				var coord = pt.split(",");
				var x = parseFloat(coord[0]);
				var y = parseFloat(coord[1]);
				var newPoint = board.create('point', [ x, y ], {
					snapToGrid : isSnapTo,
					withLabel : false,
					showInfobox : false
				});
				JXG.addEvent(newPoint.rendNode, 'mouseover', function() {
					if (mode != "point") {
						$("ellipse").css('cursor', 'crosshair');
					} else {
						$("ellipse").css('cursor', 'default');
					}
				}, newPoint);
				ptsCreated.push(newPoint.id);
				// this.setValue();
			}
			var resPtsSelected = [];
			var ptArr = [];
			var coord1;
			var coord2 = "";
			var coord3 = "";
			var coord4 = "";
			var coord5 = "";
			var coord6 = "";
			if (resValues.length > 1) {
				var index = 1;
				for (var index = 1; index < resValues.length; index++) {
					if (resValues[index].indexOf("linePoints:") > -1) {
						resValues[index] = resValues[index].replace("linePoints:","");
						mode = 'line';
					} else if (resValues[index].indexOf("linesegPoints:") > -1) {
						resValues[index] = resValues[index].replace("linesegPoints:","");
						mode = 'lineseg';
					} else if (resValues[index].indexOf("rayPoints:") > -1) {
						resValues[index] = resValues[index].replace("rayPoints:","");
						mode = 'ray';
					} else if (resValues[index].indexOf("anglePoints:") > -1) {
						resValues[index] = resValues[index].replace("anglePoints:","");
						mode = 'angle';
					} else if (resValues[index].indexOf("shapePoints:") > -1) {
						resValues[index] = resValues[index].replace("shapePoints:","");
						mode = 'shape';
					}
					else {
						mode = 'invalid';
					}
					if (mode != 'invalid') {
						var lnsValues = resValues[index].split(";");
						for (var b = 0; b < lnsValues.length; b++) {
							// reset values
							coord1 = "";
							coord2 = "";
							coord3 = "";
							coord4 = "";
							coord5 = "";
							coord6 = "";
							ptArr = lnsValues[b].split("_");
							for (var c = 0; c < ptArr.length; c++) {
								if (c == 0) {
									coord1 = ptArr[c];
								} else if (c == 1) {
									coord2 = ptArr[c];
								} else if (c == 2) {
									coord3 = ptArr[c];
								} else if (c == 3){
									coord4 = ptArr[c];
								} else if (c == 4) {
									coord5 = ptArr[c];
								} else if (c == 5) {
									coord6 = ptArr[c];
								}
							}
							var x1 = parseFloat(coord1.split(",")[0]);
							var y1 = parseFloat(coord1.split(",")[1]);
							var x2 = parseFloat(coord2.split(",")[0]);
							var y2 = parseFloat(coord2.split(",")[1]);
							var x3, y3;
							if ( (mode == 'angle') || (mode == 'shape') ) {
								x3 = parseFloat(coord3.split(",")[0]);
								y3 = parseFloat(coord3.split(",")[1]);
							}
							var x4, y4;
							if ( coord4 != "") {
								x4 = parseFloat(coord4.split(",")[0]);
								y4 = parseFloat(coord4.split(",")[1]); 
							}
							var x5, y5;
							if ( coord5 != "") {
								x5 = parseFloat(coord5.split(",")[0]);
								y5 = parseFloat(coord5.split(",")[1]); 
							}
							var x6, y6;
							if ( coord6 != "") {
								x6 = parseFloat(coord6.split(",")[0]);
								y6 = parseFloat(coord6.split(",")[1]); 
							}
	
							if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2)
									&& !isNaN(y2) && mode != 'angle' && mode != 'shape') {
								var newLine = board.create('line', [ [ x1, y1 ],
										[ x2, y2 ] ], {
									firstArrow : mode == 'line',
									lastArrow : mode == 'ray' || mode == 'line',
									straightFirst : mode == 'line',
									straightLast : mode == 'ray' || mode == 'line',
									strokeColor : '#00ff00',
									strokeWidth : 2
								});
								resPtsSelected = [];
							} else if (mode == 'angle') {
								var angleRay1 = board.create('line', [ [x1,y1],
									             						[x3,y3] ], {
									             					firstArrow : false,
									             					lastArrow : true,
									             					straightFirst : false,
									             					straightLast : true,
									             					strokeColor : '#00ff00',
									             					strokeWidth : 2
									             				});
								var angleRay2 = board.create('line', [[x1,y1],
										             						[x2,y2] ], {
										             				firstArrow : false,
										             				lastArrow : true,
										             				straightFirst : false,
										             				straightLast : true,
										             				strokeColor : '#00ff00',
										             				strokeWidth : 2
										             			});
								var alpha = board.create('angle', [ [ x2, y2 ],
										[ x1, y1 ], [ x3, y3 ] ], {
									radius : 3, withLabel : false, showInfobox:false
								});
							} else if (mode == 'shape') {
								var poly;
								if (coord6 != "") {
									poly = board.create('polygon', [ board.create('point',[ x1, y1 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x2, y2 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x3, y3 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x4, y4 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x5, y5 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x6, y6 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}) ]);
								} else if (coord5 != "") {
									poly = board.create('polygon', [ board.create('point',[ x1, y1 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x2, y2 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}), 
									                                 board.create('point',[ x3, y3 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x4, y4 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x5, y5 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}) ]);
								} else if (coord4 != "") {
									poly = board.create('polygon', [ board.create('point',[ x1, y1 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x2, y2 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}), 
									                                 board.create('point',[ x3, y3 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}), 
									                                 board.create('point',[ x4, y4 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}) ]);
								} else {
									poly = board.create('polygon', [ board.create('point',[ x1, y1 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}),
									                                 board.create('point',[ x2, y2 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}), 
									                                 board.create('point',[ x3, y3 ],{snapToGrid : isSnapTo,withLabel : false,showInfobox : false}) ]);
								}
							}
						}
					}
				}
			}
		}
		;
		getValue();
		$('#jxgbox').mousedown(function(e) {
			if (mode == "none") {
				return;
			}
			switch (e.which) {
			case 1:
				if (mode != "point") {
					lineSelect(e);
				} else {
					down(e);
				}
				break;
			case 3:
				remove(e);
				//getValue();
				break;
			default:
				alert('You have a strange mouse');
			}
		});
		$('#jxgbox').mouseup(function(e) {
			if (mode == "none") {
				return;
			}
			setValue();
		});
		$('#connectPoints').click(function () {
			var poly = board.create('polygon', ptsSelected);
			shapesCreated.push(poly);
			ptsSelected = [];
			setValue();
		});
		$('#plotPoint').click(function() {
			mode = 'point';
			$('#linesegdirections').toggle(false);
			$("#raydirections").toggle(false);
			$('#linedirections').toggle(false);
			$('#angledirections').toggle(false);
			$('#shapedirections').toggle(false);
			$('#connectPoints').hide();
		});
		$('#drawline').click(function() {
			$('#linedirections').toggle(true);
			mode = 'line';
			$('#linesegdirections').toggle(false);
			$("#raydirections").toggle(false);
			$('#angledirections').toggle(false);
			$('#shapedirections').toggle(false);
			$('#connectPoints').hide();
			ptsSelected = [];

		});
		$('#drawlineseg').click(function() {
			$('#linesegdirections').toggle(true);
			mode = 'lineseg';
			$("#raydirections").toggle(false);
			$('#linedirections').toggle(false);
			$('#angledirections').toggle(false);
			$('#shapedirections').toggle(false);
			$('#connectPoints').hide();
			ptsSelected = [];

		});
		$('#drawray').click(function() {
			$('#raydirections').toggle(true);
			mode = 'ray';
			$('#linedirections').toggle(false);
			$('#linesegdirections').toggle(false);
			$('#angledirections').toggle(false);
			$('#shapedirections').toggle(false);
			$('#connectPoints').hide();
			ptsSelected = [];

		});
		$('#drawangle').click(function() {
			$('#angledirections').toggle(true);
			mode = 'angle';
			$('#linedirections').toggle(false);
			$('#linesegdirections').toggle(false);
			$("#raydirections").toggle(false);
			$('#shapedirections').toggle(false);
			$('#connectPoints').hide();
			ptsSelected = [];
		});
		$('#drawshape').click(function() {
			$('#shapedirections').toggle(true);
			$('#connectPoints').toggle(true);
			mode = 'shape';
			$('#linedirections').toggle(false);
			$('#linesegdirections').toggle(false);
			$("#raydirections").toggle(false);
			$('#angledirections').toggle(false);
			ptsSelected = [];
		});
		// if there's only one drawing option, select it by default
		if ($("#controlsDiv > input[type='radio']").length == 1) {
			$("#controlsDiv > input[type='radio']").trigger("click");
		}
		$('#resetButton').click(function() {
			var element;
			for (element in board.objects) {
				try {
					if (containsId(element) >= 0) {
						board.removeObject(board.objects[element]);
					}
				} catch (err) {
					// do nothing
				}
			}
			ptsCreated = [];
			ptsSelected = [];
			linesCreated = [];
			raysCreated = [];
			lineSegmentsCreated = [];
			setValue();
		});

		var getMouseCoords = function(e, i) {
			var cPos = board.getCoordsTopLeftCorner(e, i), absPos = JXG
					.getPosition(e, i), dx = absPos[0] - cPos[0], dy = absPos[1]
					- cPos[1];

			return new JXG.Coords(JXG.COORDS_BY_SCREEN, [ dx, dy ], board);
		}, down = function(e) {
			var canCreate = true, i, coords, el;
			
			if (maxChoices > 0 && maxChoices <= (ptsCreated.length - 1)) {
				return;
			}

			if (e[JXG.touchProperty]) {
				// index of the finger that is used to extract the coordinates
				i = 0;
			}
			coords = getMouseCoords(e, i);

			for (el in board.objects) {
				if (JXG.isPoint(board.objects[el])
						&& board.objects[el].hasPoint(coords.scrCoords[1],
								coords.scrCoords[2])) {
					canCreate = false;
					break;
				}
			}

			if (canCreate) {
				var newPoint = board.create('point', [ coords.usrCoords[1],
						coords.usrCoords[2] ], {
					snapToGrid : isSnapTo,
					withLabel : false,
					showInfobox : false
				});
				JXG.addEvent(newPoint.rendNode, 'mouseover', function() {
					if (mode != "point") {
						$("ellipse").css('cursor', 'crosshair');
					} else {
						$("ellipse").css('cursor', 'default');
					}
				}, newPoint);
				ptsCreated.push(newPoint.id);
				setValue();
			}
		}, lineSelect = function(e) {
			var canCreate = true, i, coords, el;
		
			if (e[JXG.touchProperty]) {
				// index of the finger that is used to extract the coordinates
				i = 0;
			}
			coords = getMouseCoords(e, i);

			for (el in board.objects) {
				if (JXG.isPoint(board.objects[el])
						&& board.objects[el].hasPoint(coords.scrCoords[1],
								coords.scrCoords[2])) {
					ptsSelected.push(board.objects[el]);
					canCreate = false;
					break;
				}
			}
			if (maxChoices > 0 && maxChoices <= (ptsCreated.length - 1) && canCreate) {
				return;
			}
			if (canCreate) {
				var newPoint = board.create('point', [ coords.usrCoords[1],
						coords.usrCoords[2] ], {
					snapToGrid : isSnapTo,
					withLabel : false,
					showInfobox : false
				});
				JXG.addEvent(newPoint.rendNode, 'mouseover', function() {
					if (mode != "point") {
						$("ellipse").css('cursor', 'crosshair');
					} else {
						$("ellipse").css('cursor', 'default');
					}
				}, newPoint);
				ptsCreated.push(newPoint.id);
				ptsSelected.push(newPoint.id);
				setValue();
			}
			if ((ptsSelected.length >= 2) && (mode != 'angle') && (mode != 'shape')) {
				var newLine = board.create('line', [ ptsSelected[0],
						ptsSelected[1] ], {
					firstArrow : mode == 'line',
					lastArrow : mode == 'ray' || mode == 'line',
					straightFirst : mode == 'line',
					straightLast : mode == 'ray' || mode == 'line',
					strokeColor : '#00ff00',
					strokeWidth : 2
				});
				if (mode == 'line') {
					linesCreated.push(newLine.id);
				} else if (mode == 'ray') {
					raysCreated.push(newLine.id);
					// if there are two of these, get the angle
					if (raysCreated.length >= 2) {
						var ray1pt1x = parseInt(board.objects[raysCreated[0]].point1.XEval());
						var ray1pt1y = parseInt(board.objects[raysCreated[0]].point1.YEval());
						var ray1pt2x = parseInt(board.objects[raysCreated[0]].point2.XEval());
						var ray1pt2y = parseInt(board.objects[raysCreated[0]].point2.YEval());
						var ray2pt1x = parseInt(board.objects[raysCreated[1]].point1.XEval());
						var ray2pt1y = parseInt(board.objects[raysCreated[1]].point1.YEval());
						var ray2pt2x = parseInt(board.objects[raysCreated[1]].point2.XEval());
						var ray2pt2y = parseInt(board.objects[raysCreated[1]].point2.YEval());
						if ((ray1pt1x == ray2pt1x) && (ray1pt1y == ray2pt1y)) {
							var theAngle = JXG.Math.Geometry.trueAngle([ray1pt2x,ray1pt2y],[ray1pt1x, ray1pt1y],[ray2pt2x,ray2pt2y]);
							if (theAngle > 180) {
								theAngle = 360 - theAngle;
							}
							altAngleMeasures.push(theAngle);
							if (theAngle > 90 && theAngle < 180) {
								angleTypes.push("obtuse");
							} else if (theAngle < 90) {
								angleTypes.push("acute");
							} else if (theAngle == 90) {
								angleTypes.push("right");
							} else {
								angleTypes.push("reflex");
							}
						}
					}
					
				} else {
					lineSegmentsCreated.push(newLine.id);
					// if there are two of these, get the angle
					if (lineSegmentsCreated.length >= 2) {
						var ray1pt1x = parseInt(board.objects[lineSegmentsCreated[0]].point1.XEval());
						var ray1pt1y = parseInt(board.objects[lineSegmentsCreated[0]].point1.YEval());
						var ray1pt2x = parseInt(board.objects[lineSegmentsCreated[0]].point2.XEval());
						var ray1pt2y = parseInt(board.objects[lineSegmentsCreated[0]].point2.YEval());
						var ray2pt1x = parseInt(board.objects[lineSegmentsCreated[1]].point1.XEval());
						var ray2pt1y = parseInt(board.objects[lineSegmentsCreated[1]].point1.YEval());
						var ray2pt2x = parseInt(board.objects[lineSegmentsCreated[1]].point2.XEval());
						var ray2pt2y = parseInt(board.objects[lineSegmentsCreated[1]].point2.YEval());
						var theAngle;
						if ( (ray1pt1x == ray2pt1x) && (ray1pt1y == ray2pt1y) ) {
							theAngle = JXG.Math.Geometry.trueAngle([ray1pt2x, ray1pt2y],[ray1pt1x, ray1pt1y],[ray2pt2x,ray2pt2y]);
						}  else if ((ray1pt2x == ray2pt1x) && (ray1pt2y == ray2pt1y)) {
							theAngle = JXG.Math.Geometry.trueAngle([ray1pt1x, ray1pt1y],[ray1pt2x, ray1pt2y],[ray2pt2x,ray2pt2y]);
						} else if ((ray1pt2x == ray2pt2x) && (ray1pt2y == ray2pt2y)) {
							theAngle = JXG.Math.Geometry.trueAngle([ray1pt1x, ray1pt1y],[ray1pt2x, ray1pt2y],[ray2pt1x,ray2pt1y]);
						} else if ((ray1pt1x == ray2pt2x) && (ray1pt1y == ray2pt2y)) {
							theAngle = JXG.Math.Geometry.trueAngle([ray1pt2x, ray1pt2y],[ray1pt1x, ray1pt1y],[ray2pt1x,ray2pt1y]);
						}
						if (theAngle > 180) {
							theAngle = 360 - theAngle;
						}
						altAngleMeasures.push(theAngle);
						if (theAngle > 90 && theAngle < 180) {
							angleTypes.push("obtuse");
						} else if (theAngle < 90) {
							angleTypes.push("acute");
						} else if (theAngle == 90) {
							angleTypes.push("right");
						} else {
							angleTypes.push("reflex");
						}
					}
				}
				ptsSelected = [];
				setValue();
			} else if ((ptsSelected.length > 2) && (mode == 'angle')) {
				var angleRay1 = board.create('line', [ ptsSelected[1],
				             						ptsSelected[0] ], {
				             					firstArrow : false,
				             					lastArrow : true,
				             					straightFirst : false,
				             					straightLast : true,
				             					strokeColor : '#00ff00',
				             					strokeWidth : 2
				             				});
				var angleRay2 = board.create('line', [ ptsSelected[1],
					             						ptsSelected[2] ], {
					             					firstArrow : false,
					             					lastArrow : true,
					             					straightFirst : false,
					             					straightLast : true,
					             					strokeColor : '#00ff00',
					             					strokeWidth : 2
					             				});
				var alpha;
				var an = JXG.Math.Geometry.trueAngle([board.objects[ptsSelected[0]].XEval(), board.objects[ptsSelected[0]].YEval()],
						[board.objects[ptsSelected[1]].XEval(), board.objects[ptsSelected[1]].YEval()], [board.objects[ptsSelected[2]].XEval(), board.objects[ptsSelected[2]].YEval()]);
				
				// if it's a reflex angle, don't draw it! Try the points in reverse order
				if (an > 180) {
					alpha = board.create('angle', [ ptsSelected[2], ptsSelected[1], ptsSelected[0] ], {
					    						radius : 3, withLabel : false
					    					});
					an = JXG.Math.Geometry.trueAngle([board.objects[ptsSelected[2]].XEval(), board.objects[ptsSelected[1]].YEval()],
							[board.objects[ptsSelected[0]].XEval(), board.objects[ptsSelected[1]].YEval()], [board.objects[ptsSelected[2]].XEval(), board.objects[ptsSelected[2]].YEval()]);
				} else {
					alpha = board.create('angle', [ ptsSelected[0], ptsSelected[1], ptsSelected[2] ], {
					    						radius : 3, withLabel : false
					    					}); 
				}
				
				// linesCreated.push(alpha.id);
				anglesCreated.push(alpha.id);
				angleMeasures.push(an);
				if (an > 90 && an < 180) {
					angleTypes.push("obtuse");
				} else if (an < 90) {
					angleTypes.push("acute");
				} else if (an == 90) {
					angleTypes.push("right");
				} else {
					angleTypes.push("reflex");
				}
				ptsSelected = [];
				setValue();
			}
		}, setValue = function() {
			var ptsValues = "points:";
			for (var a = 0; a < ptsCreated.length; a++) {
				var eX = board.objects[ptsCreated[a]].XEval();
				var eY = board.objects[ptsCreated[a]].YEval();
				ptsValues += eX.toString() + "," + eY.toString() + ";";
			}
			var linesValues = "/lines:";
			var linePointValues = "/linePoints:";
			var lineParaCount = 0;
			var linePerpCount = 0;
			var lineMetaString = "/lineMeta:";
			for (var b = 0; b < linesCreated.length; b++) {
				var x1 = board.objects[linesCreated[b]].point1.XEval();
				var y1 = board.objects[linesCreated[b]].point1.YEval();
				var x2 = board.objects[linesCreated[b]].point2.XEval();
				var y2 = board.objects[linesCreated[b]].point2.YEval();
				// let's calculate the slope
				if (x2 - x1 != 0) {
					var m = (y2 - y1) / (x2 - x1);
				} else {
					m = Infinity;
				}
				if (m != Infinity) {
					// (arbitrarily chosen) value of 18 probably indicates the student was trying to draw a vertical line.
					if (Math.abs(m) >= 18) {
						linePointValues += x1.toString() + "," + y1.toString() + "_"
						+ x2.toString() + "," + y2.toString() + ";";
						linesValues += "x=" + Math.round(x1).toString() + ";";
					} else {
						var yint = y1 - (m * x1);
		
						linePointValues += x1.toString() + "," + y1.toString() + "_"
								+ x2.toString() + "," + y2.toString() + ";";
						linesValues += "y=" + Math.round(m).toString() + "x+" + Math.round(yint).toString() + ";";
					}
				} else {
					linePointValues += x1.toString() + "," + y1.toString() + "_"
					+ x2.toString() + "," + y2.toString() + ";";
					linesValues += "x=" + Math.round(x1).toString() + ";";
				}
				
				for (var i = 0; i < linesCreated.length; i++) {
					var x1c = board.objects[linesCreated[i]].point1.XEval();
					var y1c = board.objects[linesCreated[i]].point1.YEval();
					var x2c = board.objects[linesCreated[i]].point2.XEval();
					var y2c = board.objects[linesCreated[i]].point2.YEval();
					if (x2c - x1c != 0) {
						var mc = (y2c - y1c) / (x2c - x1c);
					} else {
						mc = Infinity;
					}
					if (i != b) {
						if (mc == m) {
							lineParaCount++;
						} else if (mc == (m * -1) || (mc == Infinity && m == 0)) {
							linePerpCount++;
						} else {
							// nothing special here, move along!
						}
					}
				}
			}
			if (linesValues == "/lines:") {
				linesValues = "";
			}
			if (linePointValues == "/linePoints:") {
				linePointValues = "";
			}
			if (lineParaCount > 0) {
				lineMetaString += lineParaCount.toString()+";parallel;line";
			}
			if (linePerpCount > 0) {
				lineMetaString += linePerpCount.toString()+";perpendicular;line";
			}
			if (lineMetaString == "/lineMeta:") {
				lineMetaString = "";
			}
			var lineSegValues = "/linesegs:";
			var lineSegExactValues = "/exactlinesegs:";
			var lineSegPointValues = "/linesegPoints:";
			var linesegParaCount = 0;
			var linesegPerpCount = 0;
			var linesegMetaString = "/linesegMeta:";
			var shapeMetaString = "/shapeMeta:";
			var shapeParaCount = 0;
			var shapePerpCount = 0;
			for (var c = 0; c < lineSegmentsCreated.length; c++) {
				var sx1 = board.objects[lineSegmentsCreated[c]].point1.XEval();
				var sy1 = board.objects[lineSegmentsCreated[c]].point1.YEval();
				var sx2 = board.objects[lineSegmentsCreated[c]].point2.XEval();
				var sy2 = board.objects[lineSegmentsCreated[c]].point2.YEval();
				// let's calculate the slope
				var m;
				if (sx2 - sx1 != 0) {
					m = (sy2 - sy1) / (sx2 - sx1);
				} else {
					m = Infinity;
				}
				if (m != Infinity) {
					if (Math.abs(m) > 20) {
						lineSegPointValues += sx1.toString() + "," + sy1.toString() + "_"
						+ sx2.toString() + "," + sy2.toString() + ";";
						lineSegValues += "x=" + Math.round(sx1).toString() + ";";
						lineSegExactValues += "x=" + sx1.toString() + ";";
					} else {
						var yint = sy1 - (m * sx1);
		
						lineSegPointValues += sx1.toString() + "," + sy1.toString() + "_"
								+ sx2.toString() + "," + sy2.toString() + ";";
						lineSegValues += "y=" + Math.round(m).toString() + "x+" + Math.round(yint).toString() + ";";
						lineSegExactValues += "y=" + m.toString() + "x+" + yint.toString() + ";"; 
					}
				} else {
					lineSegPointValues += sx1.toString() + "," + sy1.toString() + "_"
					+ sx2.toString() + "," + sy2.toString() + ";";
					lineSegValues += "x=" + Math.round(sx1).toString() + ";";
					lineSegExactValues += "x=" + sx1.toString() + ";";
				}
				
				for (var i = 0; i < lineSegmentsCreated.length; i++) {
					var x1c = board.objects[lineSegmentsCreated[i]].point1.XEval();
					var y1c = board.objects[lineSegmentsCreated[i]].point1.YEval();
					var x2c = board.objects[lineSegmentsCreated[i]].point2.XEval();
					var y2c = board.objects[lineSegmentsCreated[i]].point2.YEval();
					var mc = (y2c - y1c) / (x2c - x1c);
					if (x2c - x1c != 0) {
						mc = (y2c - y1c) / (x2c - x1c);
					} else {
						mc = Infinity;
					}
					if (i != c) {
						if (mc == m) {
							linesegParaCount++;
						} else if (mc == (m * -1) || (mc == Infinity && m == 0)) {
							linesegPerpCount++;
						} else {
							// nothing special here, move along!
						}
					}
				}
			}
			altAngleMeasures = [];
			angleTypes = [];
			if (lineSegmentsCreated.length >= 2) {
				for (var w = 0; w < lineSegmentsCreated.length - 1; w++) {
					var ray1pt1x = parseInt(board.objects[lineSegmentsCreated[w]].point1.XEval());
					var ray1pt1y = parseInt(board.objects[lineSegmentsCreated[w]].point1.YEval());
					var ray1pt2x = parseInt(board.objects[lineSegmentsCreated[w]].point2.XEval());
					var ray1pt2y = parseInt(board.objects[lineSegmentsCreated[w]].point2.YEval());
					var ray2pt1x = parseInt(board.objects[lineSegmentsCreated[w+1]].point1.XEval());
					var ray2pt1y = parseInt(board.objects[lineSegmentsCreated[w+1]].point1.YEval());
					var ray2pt2x = parseInt(board.objects[lineSegmentsCreated[w+1]].point2.XEval());
					var ray2pt2y = parseInt(board.objects[lineSegmentsCreated[w+1]].point2.YEval());
					var theAngle;
					if ( (ray1pt1x == ray2pt1x) && (ray1pt1y == ray2pt1y) ) {
						theAngle = JXG.Math.Geometry.trueAngle([ray1pt2x, ray1pt2y],[ray1pt1x, ray1pt1y],[ray2pt2x,ray2pt2y]);
					}  else if ((ray1pt2x == ray2pt1x) && (ray1pt2y == ray2pt1y)) {
						theAngle = JXG.Math.Geometry.trueAngle([ray1pt1x, ray1pt1y],[ray1pt2x, ray1pt2y],[ray2pt2x,ray2pt2y]);
					} else if ((ray1pt2x == ray2pt2x) && (ray1pt2y == ray2pt2y)) {
						theAngle = JXG.Math.Geometry.trueAngle([ray1pt1x, ray1pt1y],[ray1pt2x, ray1pt2y],[ray2pt1x,ray2pt1y]);
					} else if ((ray1pt1x == ray2pt2x) && (ray1pt1y == ray2pt2y)) {
						theAngle = JXG.Math.Geometry.trueAngle([ray1pt2x, ray1pt2y],[ray1pt1x, ray1pt1y],[ray2pt1x,ray2pt1y]);
					}
					if (theAngle > 180) {
						theAngle = 360 - theAngle;
					}
					altAngleMeasures.push(theAngle);
					if (theAngle > 90 && theAngle < 180) {
						angleTypes.push("obtuse");
					} else if (theAngle < 90) {
						angleTypes.push("acute");
					} else if (theAngle == 90) {
						angleTypes.push("right");
					} else {
						angleTypes.push("reflex");
					}
				}
			}
			if (lineSegValues == "/linesegs:") {
				lineSegValues = "";
			}
			if (lineSegExactValues == "/exactlinesegs:") {
				lineSegExactValues = "";
			}
			if (lineSegPointValues == "/linesegPoints:") {
				lineSegPointValues = "";
			}
			if (linesegParaCount > 0) {
				linesegMetaString += linesegParaCount.toString()+";parallel;";
			}
			if (linesegPerpCount > 0) {
				linesegMetaString += linesegPerpCount.toString()+";perpendicular;";
			}
			if (linesegMetaString == "/linesegMeta:") {
				linesegMetaString = "";
			}
			var rayValues = "/rays:";
			var rayExactValues = "/exactrays:";
			var rayPointValues = "/rayPoints:";
			var rayParaCount = 0;
			var rayPerpCount = 0;
			var rayMetaString = "/rayMeta:";
			for (var c = 0; c < raysCreated.length; c++) {
				var sx1 = board.objects[raysCreated[c]].point1.XEval();
				var sy1 = board.objects[raysCreated[c]].point1.YEval();
				var sx2 = board.objects[raysCreated[c]].point2.XEval();
				var sy2 = board.objects[raysCreated[c]].point2.YEval();
				// let's calculate the slope
				var m;
				if (sx2 - sx1 != 0) {
					m = (sy2 - sy1) / (sx2 - sx1);
				} else {
					m = Infinity;
				}
				if (m != Infinity) {
					if (Math.abs(m) > 20) {
						rayPointValues += sx1.toString() + "," + sy1.toString() + "_"
						+ sx2.toString() + "," + sy2.toString() + ";";
						rayValues += "x=" + Math.round(sx1).toString() + ";";
						rayExactValues += "x=" + sx1.toString() + ";";
					} else {
						var yint = sy1 - (m * sx1);
		
						rayPointValues += sx1.toString() + "," + sy1.toString() + "_"
								+ sx2.toString() + "," + sy2.toString() + ";";
						rayValues += "y=" + Math.round(m).toString() + "x+" + Math.round(yint).toString() + ";";
						rayExactValues += "y=" + m.toString() + "x+" + yint.toString() + ";";
					}
				} else {
					rayPointValues += sx1.toString() + "," + sy1.toString() + "_"
					+ sx2.toString() + "," + sy2.toString() + ";";
					rayValues += "x=" + Math.round(sx1).toString() + ";";
					rayExactValues += "x=" + sx1.toString() + ";";
				}
				
				for (var i = 0; i < raysCreated.length; i++) {
					var x1c = board.objects[raysCreated[i]].point1.XEval();
					var y1c = board.objects[raysCreated[i]].point1.YEval();
					var x2c = board.objects[raysCreated[i]].point2.XEval();
					var y2c = board.objects[raysCreated[i]].point2.YEval();
					var mc = (y2c - y1c) / (x2c - x1c);
					if (x2c - x1c != 0) {
						mc = (y2c - y1c) / (x2c - x1c);
					} else {
						mc = Infinity;
					}
					if (i != c) {
						if (mc == m) {
							rayParaCount++;
						} else if (mc == (m * -1) || (mc == Infinity && m == 0)) {
							rayPerpCount++;
						} else {
							// nothing special here, move along!
						}
					}
				}
			}
			if (raysCreated.length >= 2) {
				for (var w = 0; w < raysCreated.length - 1; w++) {
					var ray1pt1x = parseInt(board.objects[raysCreated[w]].point1.XEval());
					var ray1pt1y = parseInt(board.objects[raysCreated[w]].point1.YEval());
					var ray1pt2x = parseInt(board.objects[raysCreated[w]].point2.XEval());
					var ray1pt2y = parseInt(board.objects[raysCreated[w]].point2.YEval());
					var ray2pt1x = parseInt(board.objects[raysCreated[w+1]].point1.XEval());
					var ray2pt1y = parseInt(board.objects[raysCreated[w+1]].point1.YEval());
					var ray2pt2x = parseInt(board.objects[raysCreated[w+1]].point2.XEval());
					var ray2pt2y = parseInt(board.objects[raysCreated[w+1]].point2.YEval());
					if ((ray1pt1x == ray2pt1x) && (ray1pt1y == ray2pt1y)) {
						var theAngle = JXG.Math.Geometry.trueAngle([ray1pt2x,ray1pt2y],[ray1pt1x, ray1pt1y],[ray2pt2x,ray2pt2y]);
						if (theAngle > 180) {
							theAngle = 360 - theAngle;
						}
						altAngleMeasures.push(theAngle);
						if (theAngle > 90 && theAngle < 180) {
							angleTypes.push("obtuse");
						} else if (theAngle < 90) {
							angleTypes.push("acute");
						} else if (theAngle == 90) {
							angleTypes.push("right");
						} else {
							angleTypes.push("reflex");
						}
					}
				}
			}
			if (rayValues == "/rays:") {
				rayValues = "";
			}
			if (rayExactValues == "/exactrays:") {
				rayExactValues = "";
			}
			if (rayPointValues == "/rayPoints:") {
				rayPointValues = "";
			}
			if (rayParaCount > 0) {
				rayMetaString += rayParaCount.toString()+";parallel;";
			}
			if (rayPerpCount > 0) {
				rayMetaString += rayPerpCount.toString()+";perpendicular;";
			}
			if (rayMetaString == "/rayMeta:") {
				rayMetaString = "";
			}
			var shapeAngle = "/shapeAngles:";
			var shapeAngleTypes = "/shapeAngleTypes:";
			a_obtuseCt = 0;
			a_acuteCt = 0;
			a_rightCt = 0;
			a_reflexCt = 0; // should always be 0, but kept for debug purposes
			for (var g = 0; g < shapesCreated.length; g++) {
				if (shapesCreated[g].borders.length == 3) {
					var tri_a0 = JXG.Math.Geometry.trueAngle(shapesCreated[g].vertices[2],shapesCreated[g].vertices[0],shapesCreated[g].vertices[1]);
					if (tri_a0 > 180) { tri_a0 = 360 - tri_a0; }
					if (tri_a0 > 90 && tri_a0 < 180) {
						a_obtuseCt++;
					} else if (tri_a0 < 90) {
						a_acuteCt++;
					} else if (tri_a0 == 90) {
						a_rightCt++;
					} else {
						a_reflexCt++;
					}
					var tri_a1 = JXG.Math.Geometry.trueAngle(shapesCreated[g].vertices[0],shapesCreated[g].vertices[1],shapesCreated[g].vertices[2]);
					if (tri_a1 > 180) { tri_a1 = 360 - tri_a1; }
					if (tri_a1 > 90 && tri_a1 < 180) {
						a_obtuseCt++;
					} else if (tri_a1 < 90) {
						a_acuteCt++;
					} else if (tri_a1 == 90) {
						a_rightCt++;
					} else {
						a_reflexCt++;
					}
					var tri_a2 = JXG.Math.Geometry.trueAngle(shapesCreated[g].vertices[1],shapesCreated[g].vertices[2],shapesCreated[g].vertices[0]);
					if (tri_a2 > 180) { tri_a2 = 360 - tri_a2; }
					if (tri_a2 > 90 && tri_a2 < 180) {
						a_obtuseCt++;
					} else if (tri_a2 < 90) {
						a_acuteCt++;
					} else if (tri_a2 == 90) {
						a_rightCt++;
					} else {
						a_reflexCt++;
					}
					
				} else if (shapesCreated[g].borders.length == 4) {
					var quad_a0 = JXG.Math.Geometry.trueAngle(shapesCreated[g].vertices[3],shapesCreated[g].vertices[0],shapesCreated[g].vertices[1]);
					if (quad_a0 > 180) { quad_a0 = 360 - quad_a0; }
					if (quad_a0 > 90 && quad_a0 < 180) {
						a_obtuseCt++;
					} else if (quad_a0 < 90) {
						a_acuteCt++;
					} else if (quad_a0 == 90) {
						a_rightCt++;
					} else {
						a_reflexCt++;
					}
					var quad_a1 = JXG.Math.Geometry.trueAngle(shapesCreated[g].vertices[0],shapesCreated[g].vertices[1],shapesCreated[g].vertices[2]);
					if (quad_a1 > 180) { quad_a1 = 360 - quad_a1; }
					if (quad_a1 > 90 && quad_a1 < 180) {
						a_obtuseCt++;
					} else if (quad_a1 < 90) {
						a_acuteCt++;
					} else if (quad_a1 == 90) {
						a_rightCt++;
					} else {
						a_reflexCt++;
					}
					var quad_a2 = JXG.Math.Geometry.trueAngle(shapesCreated[g].vertices[1],shapesCreated[g].vertices[2],shapesCreated[g].vertices[3]);
					if (quad_a2 > 180) { quad_a2 = 360 - quad_a2; }
					if (quad_a2 > 90 && quad_a2 < 180) {
						a_obtuseCt++;
					} else if (quad_a2 < 90) {
						a_acuteCt++;
					} else if (quad_a2 == 90) {
						a_rightCt++;
					} else {
						a_reflexCt++;
					}
					var quad_a3 = JXG.Math.Geometry.trueAngle(shapesCreated[g].vertices[2],shapesCreated[g].vertices[3],shapesCreated[g].vertices[0]);
					if (quad_a3 > 180) { quad_a3 = 360 - quad_a3; }
					if (quad_a3 > 90 && quad_a3 < 180) {
						a_obtuseCt++;
					} else if (quad_a3 < 90) {
						a_acuteCt++;
					} else if (quad_a3 == 90) {
						a_rightCt++;
					} else {
						a_reflexCt++;
					}
				} else {
					// do nothing
				}
			}
			if (a_obtuseCt == 0 && a_acuteCt == 0 && a_rightCt == 0 && a_reflexCt == 0) {
				shapeAngleTypes = "";
			} else {
				// using abbreviations to avoid any other scoring assumptions
				shapeAngleTypes = "/shapeAngleTypes:obts="+a_obtuseCt+";act="+a_acuteCt+";rt="+a_rightCt+";rflx="+a_reflexCt+";";
			}
			var totalLineCountString = "/totalLineCount:";
			totalLineCountString += (linesCreated.length + lineSegmentsCreated.length + raysCreated.length).toString() + ";";
			var angleValues = "/angles:";
			var anglePointValues = "/anglePoints:";
			for (var e = 0; e < angleMeasures.length; e++) {
				var ax1 = board.objects[anglesCreated[e]].point1.XEval();
				var ay1 = board.objects[anglesCreated[e]].point1.YEval();
				var ax2 = board.objects[anglesCreated[e]].point2.XEval();
				var ay2 = board.objects[anglesCreated[e]].point2.YEval();
				var ax3 = board.objects[anglesCreated[e]].point3.XEval();
				var ay3 = board.objects[anglesCreated[e]].point3.YEval();
				anglePointValues += ax1.toString() + "," + ay1.toString() + "_"
						+ ax2.toString() + "," + ay2.toString() + "_"
						+ ax3.toString() + "," + ay3.toString() + ";";
				// recalculate sizes
				var newAngle = JXG.Math.Geometry.trueAngle([ax2,ay2],[ax1, ay1],[ax3,ay3]);
				angleValues += newAngle.toString() + ";";
				if (newAngle > 90 && newAngle < 180) {
					angleTypes.push("obtuse");
				} else if (newAngle < 90) {
					angleTypes.push("acute");
				} else if (newAngle == 90) {
					angleTypes.push("right");
				} else {
					angleTypes.push("reflex")
				}
			}
			for (var v = 0; v < altAngleMeasures.length; v++) {
				if (altAngleMeasures[v] != null) {
					angleValues += altAngleMeasures[v].toString() + ";";
				}
			}
			if (angleValues == "/angles:") {
				angleValues = "";
			}
			if (anglePointValues == "/anglePoints:") {
				anglePointValues = "";
			}
			var angleTypeValues = "/angleTypes:";
			for (var f = 0; f< angleTypes.length; f++) {
				angleTypeValues += angleTypes[f].toString() + ";";
			}
			
			// this is the "potential" number of sides of any potential shapes
			var shapeSideString = "/shapeSides:";
			shapeSideString += lineSegmentsCreated.length;
			
			// get shape points
			shapePointValues = "/shapePoints:";
			for (var y = 0; y < shapesCreated.length; y++) {
				for (var c = 0; c < shapesCreated[y].vertices.length; c++) {
					shapePointValues += shapesCreated[y].vertices[c].XEval() + "," + shapesCreated[y].vertices[c].YEval();
					if (c != shapesCreated[y].vertices.length - 1) {
						shapePointValues += "_";
					}
				}
				shapePointValues += ";";
			}
			
			// get some shape data!
			var squareCount = 0;
			var pgCount = 0;
			var rhomCount = 0;
			var equCount = 0;
			var isoCount = 0;
			var scaCount = 0;
			var rightCount = 0;
			var rightAngleTop = "";
			var tris = 0;
			var quads = 0;
			var shapesPara = [];
			var shapesPerp = [];
			for (var g = 0; g < shapesCreated.length; g++) {
				// count number of parallel sides per shape. Triangles will have 0.
				var sp = 0;
				var shperp = 0;
				if (shapesCreated[g].borders.length == 3) {
					// get triangle data
					tris++;
					// get type
					if (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[1].L() == shapesCreated[g].borders[2].L()) {
						// equilateral :)
						equCount++;
					} else if ( (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[1].L()) || (shapesCreated[g].borders[1].L() == shapesCreated[g].borders[2].L()) || (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[2].L()) ) {
						// isoceles :|
						isoCount++;
					} else {
						// scalene :(
						scaCount++;
					}
					// more types
					var hypotenuse_found = false;
					var hypotenuse = -1;
					for (var j=0; j < 3; j++) {
						var currentSlope = shapesCreated[g].borders[j].getSlope();
						for (var k=0; k < 3; k++) {
							if (j == k) continue;
							if (currentSlope == (-1 * shapesCreated[g].borders[k].getSlope()) || (currentSlope == Infinity && shapesCreated[g].borders[k].getSlope() == 0) || (currentSlope == 0 && shapesCreated[g].borders[k].getSlope() == Infinity)) {
								// right triangle
								rightCount++;
								// find hypotenuse
								if (j == 0) {
									if (k == 1) {
										hypotenuse = 2;
									} else {
										hypotenuse = 1;
									}
									hypotenuse_found = true;
								} else if (j == 1) {
									if (k == 0) {
										hypotenuse = 2;
									} else {
										hypotenuse = 0;
									}
									hypotenuse_found = true;
								} else { //j = 2
									if (k == 1) {
										hypotenuse = 0;
									} else {
										hypotenuse = 1;
									}
									hypotenuse_found = true;
								}
								break;
							}
						}
						if (hypotenuse_found) {
							break;
						}
					}
					if (hypotenuse_found) {
						var b1x1, b1y1, b1x2, b1y2;
						var b2x1, b2y1, b2x2, b2y2;
						for (var r=0; r < 3; r++) {
							if (r == hypotenuse) continue;
							else {
								if (b1x1 == null) {
									b1x1 = shapesCreated[g].borders[r].point1.XEval();
									b1y1 = shapesCreated[g].borders[r].point1.YEval();
									b1x2 = shapesCreated[g].borders[r].point2.XEval();
									b1y2 = shapesCreated[g].borders[r].point2.YEval();
								} else {
									b2x1 = shapesCreated[g].borders[r].point1.XEval();
									b2y1 = shapesCreated[g].borders[r].point1.YEval();
									b2x2 = shapesCreated[g].borders[r].point2.XEval();
									b2y2 = shapesCreated[g].borders[r].point2.YEval();
								}
							}
						}
						var hypX, hypY;
						if ( (b1x1 == b2x1 && b1y1 == b2y1) || (b1x1 == b2x2 && b1y1 == b2y2) ) {
							hypX = b1x1;
							hypY = b1y1;
						} else if ( (b2x1 == b1x1 && b2y1 == b1y1) || (b2x1 == b1x2 && b2y1 == b1y2) ) {
							hypX = b2x1;
							hypY = b2y1;
						}
						if (hypY >= shapesCreated[g].borders[hypotenuse].point1.YEval() && hypY >= shapesCreated[g].borders[hypotenuse].point2.YEval()) {
							rightAngleTop += "shape"+g.toString()+"=rightAngleTop";
						} else {
							rightAngleTop += "shape"+g.toString()+"=rightAngleBottom";
						}
					}
					
				} else if (shapesCreated[g].borders.length == 4) {
					// get quadrilateral data
					quads++;
					var pdata = shapesCreated[g].borders[0].L();
					if ( (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[1].L()) && (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[2].L()) && (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[3].L()) ) {
						// this is a square!
						squareCount++;
					}
					if ( (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[2].L()) && (shapesCreated[g].borders[1].L() == shapesCreated[g].borders[3].L()) ) {
						// this is (at least) a parallelogram!
						pgCount++;
						if ( (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[1].L()) && (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[2].L()) && (shapesCreated[g].borders[0].L() == shapesCreated[g].borders[3].L()) ) {
							// this is a rhombus paralelogram!
							rhomCount++;
						}
					}
					// get number of parallel sides
					for (var m = 0; m < shapesCreated[g].borders.length; m++) {
						for (var n = 0; n < shapesCreated[g].borders.length; n++) {
							if (m==n) {
								continue;
							}
							if (shapesCreated[g].borders[m].getSlope() == shapesCreated[g].borders[n].getSlope()) {
								sp++;
							} else if ( (shapesCreated[g].borders[m].getSlope() == Infinity) && (shapesCreated[g].borders[n].getSlope() == 0) ) {
								shperp++;
							}
						}
					}
				} else {
					// *sing-songy voice* Insufficient day-ta!
				}
				shapesPara.push(sp);
				shapesPerp.push(shperp);
			}
			var shapesString = "/shapeCount:";
			if (shapesCreated.length > 0) {
				shapesString += "tris="+tris.toString()+";";
				shapesString += "quads="+quads.toString()+";";
				shapesString += "total="+shapesCreated.length.toString();
			} else {
				shapesString = "";
			}
			var triString = "/equilateral_triangles:"+equCount.toString() +"/isoceles_triangles:"+isoCount.toString()+"/scalene_triangles:"+scaCount.toString()+"/right_triangles:"+rightCount.toString();
			var pgString = "/squares:"+squareCount.toString() + ";/parallelograms:" + pgCount.toString() + ";/rhombuses:"+rhomCount.toString()+ ";/parallel_sides:";
			for (var o = 0; o < shapesPara.length; o++) {
				pgString += "shape"+o+"="+shapesPara[o]+";";
			}
			pgString += "/perpendicular_sides:";
			for (var p = 0; p < shapesPerp.length; p++) {
				pgString += "shape"+p+"="+shapesPerp[p]+";";
			}
			
			// lastly, let's check the areas to make sure they aren't the same shape!!
			var same = true;
			if (shapesCreated.length > 1) {
				for (var q=1; q < shapesCreated.length; q++) {
					if (shapesCreated[q].Area() != shapesCreated[q-1].Area()) {
						same = false;
					}
				}
			} else {
				same = false;
			}
			if (same) {
				pgString += "/misc:shapes are same;";
			} else {
				pgString += "/misc:shapes are different;";
			}
			
			// we'll append the "point" value strings to the end for response
			// re-creation.
			inputElementQuery.get(0).value = ptsValues + linesValues
					+ lineSegValues + rayValues + angleValues + angleTypeValues + linePointValues
					+ lineSegPointValues + lineSegExactValues + rayPointValues + rayExactValues + anglePointValues + lineMetaString + linesegMetaString 
					+ rayMetaString + totalLineCountString + shapesString + shapeAngleTypes + triString + pgString + shapePointValues + rightAngleTop;
		}, remove = function(e) {
		
			var i, newcoords, el;

			if (e[JXG.touchProperty]) {
				// index of the finger that is used to extract the coordinates
				i = 0;
			}
			newcoords = getMouseCoords(e, i);

			for (el in board.objects) {
				if (JXG.isPoint(board.objects[el])
						&& board.objects[el].hasPoint(newcoords.scrCoords[1],
								newcoords.scrCoords[2])) {
					var eX = board.objects[el].XEval();
					var eY = board.objects[el].YEval();
					board.removeObject(board.objects[el]);
					ptsCreated.splice(containsId(el), 1);
					break;
				}
			}
			for (var k = linesCreated.length - 1; k >= 0; k--) {
				if (!board.objects[linesCreated[k]]) {
					linesCreated.splice(k, 1);
				}
			}
			setValue();
		}, containsId = function(e) {
			for (var a = 0; a < ptsCreated.length; a++) {
				if (ptsCreated[a] == e) {
					return a;
				}
			}
			return -1;
		}
	};

	/** ********************************************************* */
	/*
	 * Interactions using Applets. (Recall that PositionObjectInteraction
	 * currently uses an applet for its stage, so this class needs to be able to
	 * associate a single applet with multiple interactions)
	 */

	var AppletBasedInteractionContainer = function(containerId,
			responseIdentifiers) {
		this.responseIdentifiers = responseIdentifiers;
		this.divContainerQuery = $('#' + containerId);
		this.appletQuery = this.divContainerQuery
				.find('object[type="application/x-java-applet"]');
		var interaction = this;

		this.reset = function() {
			this.appletQuery.each(function() {
				/*
				 * (Annoyingly, the reset() function in some of the applets is
				 * called reSet()!)
				 */
				if (this.reset) {
					this.reset();
				} else if (this.reSet) {
					this.reSet();
				}
				interaction.setResponseData();
			});
		};

		this.extractResponseData = function() {
			this.appletQuery
					.each(function() {
						for (i in interaction.responseIdentifiers) {
							var responseIdentifier = interaction.responseIdentifiers[i];
							/*
							 * (NB: The following code portion includes JS->Java
							 * calls)
							 */
							var valuesVector = this
									.getValues(responseIdentifier);
							var values = [];
							if (valuesVector != null) {
								var valuesEnum = valuesVector.elements();
								while (valuesEnum.hasMoreElements()) {
									values.push(valuesEnum.nextElement());
								}
							}
							/* (Back to JS only now) */
							interaction.setResponseData(responseIdentifier,
									values);
						}
					});
		};

		this.setResponseData = function(responseIdentifier, values) {
			this.divContainerQuery.find('input').remove();
			for ( var i in values) {
				var inputElement = $('<input type="hidden">');
				inputElement.attr('name', 'qtiworks_response_'
						+ responseIdentifier);
				inputElement.attr('value', values[i]);
				this.divContainerQuery.append(inputElement);
			}
		};

		this.init = function() {
			registerSubmitCallback(function() {
				interaction.extractResponseData();
				return true;
			});
			registerResetCallback(function() {
				interaction.reset();
			});
		};
	};

	/** ********************************************************* */
	/* Public methods */

	return {
		maySubmit : function() {
			var allowSubmit = true;
			for ( var i in submitCallbacks) {
				allowSubmit = submitCallbacks[i]();
				if (!allowSubmit) {
					break;
				}
			}
			return allowSubmit;
		},

		reset : function() {
			for ( var i in resetCallbacks) {
				resetCallbacks[i]();
			}
		},

		showInfoControlContent : function(inputElement) {
			$(inputElement).next('div').show();
			inputElement.disabled = true;
			return false;
		},

		registerSliderInteraction : function(responseIdentifier, configData) {
			new SliderInteraction(responseIdentifier, configData).init();
		},

		registerOrderInteraction : function(responseIdentifier,
				initialSourceOrder, initialTargetOrder, minChoices, maxChoices) {
			new OrderInteraction(responseIdentifier, initialSourceOrder,
					initialTargetOrder, minChoices, maxChoices).init();
		},

		registerMatchInteraction : function(responseIdentifier,
				maxAssociations, matchSet1, matchSet2) {
			new MatchInteraction(responseIdentifier, maxAssociations,
					matchSet1, matchSet2).init();
		},

		registerGapMatchInteraction : function(responseIdentifier,
				gapChoiceData, gapData) {
			new GapMatchInteraction(responseIdentifier, gapChoiceData, gapData)
					.init();
		},

		registerGeometryDrawingInteraction : function(responseIdentifier,
				configData) {
			new GeometryDrawingInteraction(responseIdentifier, configData);
		},

		registerAppletBasedInteractionContainer : function(containerId,
				responseIdentifiers) {
			new AppletBasedInteractionContainer(containerId,
					responseIdentifiers).init();
		},

		calculator : function(type) {
			var div = document.createElement("div");
			var memory = 0;
			var isMemorySet = false;
			div.id = "dialog";
			div.innerHTML = '<span id="biggerCalc" class="ui-icon ui-icon-plusthick inline-span"></span><span id="smallerCalc" class="ui-icon ui-icon-minusthick inline-span"></span><span id="closeCalculator" class="ui-icon ui-icon-circle-close inline-span"></span>';
			if (type == "standard") {
				// standard calculator
				// div.innerHTML += '<span id="closeCalculator" class="ui-icon
				// ui-icon-circle-close"></span><FORM id="calculator"
				// NAME="Calc"><TABLE BORDER=4><TR><TD><INPUT TYPE="text"
				// maxlength="12" NAME="Input"
				// Size="16"><br></TD></TR><TR><TD><INPUT TYPE="button"
				// NAME="plusminus" VALUE=" +/- "
				// OnClick="makenegative()"><INPUT TYPE="button" id="spacer"
				// value="n/a"><INPUT TYPE="button" id="memset" NAME="memset"
				// VALUE=" MS " OnCLick="memoryset()"><INPUT TYPE="button"
				// id="memrecall" NAME="memrecall" VALUE=" MR "
				// OnClick="memoryrecall()"><INPUT TYPE="button" id="memclear"
				// NAME="memclear" VALUE=" MC "
				// OnClick="memoryclear()"><br><INPUT TYPE="button" NAME="pct"
				// VALUE=" % " OnClick="Calc.Input.value =
				// Calc.Input.value/100"><INPUT TYPE="button" NAME="seven"
				// VALUE=" 7 " OnClick="Calc.Input.value += &#39;7&#39;"><INPUT
				// TYPE="button" NAME="eight" VALUE=" 8 "
				// OnCLick="Calc.Input.value += &#39;8&#39;"><INPUT
				// TYPE="button" NAME="nine" VALUE=" 9 "
				// OnClick="Calc.Input.value += &#39;9&#39;"><INPUT
				// TYPE="button" NAME="plus" VALUE=" + "
				// OnClick="Calc.Input.value += &#39; + &#39;"><br><INPUT
				// TYPE="button" NAME="sqrt" VALUE=" &#8730; "
				// OnClick="Calc.Input.value =
				// squareRootWithErrorCheck(Calc.Input.value)"><INPUT
				// TYPE="button" NAME="four" VALUE=" 4 "
				// OnClick="Calc.Input.value += &#39;4&#39;"><INPUT
				// TYPE="button" NAME="five" VALUE=" 5 "
				// OnCLick="Calc.Input.value += &#39;5&#39;"><INPUT
				// TYPE="button" NAME="six" VALUE=" 6 "
				// OnClick="Calc.Input.value += &#39;6&#39;"><INPUT
				// TYPE="button" NAME="minus" VALUE=" - "
				// OnClick="Calc.Input.value += &#39; - &#39;"><br><input
				// type="button" id="spacer" value="n/a"><INPUT TYPE="button"
				// NAME="one" VALUE=" 1 " OnClick="Calc.Input.value +=
				// &#39;1&#39;"><INPUT TYPE="button" NAME="two" VALUE=" 2 "
				// OnCLick="Calc.Input.value += &#39;2&#39;"><INPUT
				// TYPE="button" NAME="three" VALUE=" 3 "
				// OnClick="Calc.Input.value += &#39;3&#39;"><INPUT
				// TYPE="button" NAME="times" VALUE=" x "
				// OnClick="Calc.Input.value += &#39; * &#39;"><br><INPUT
				// TYPE="button" NAME="clear" VALUE=" c "
				// OnClick="Calc.Input.value = &#39;&#39;"><INPUT TYPE="button"
				// NAME="zero" VALUE=" 0 " OnClick="Calc.Input.value +=
				// &#39;0&#39;"><INPUT TYPE="button" NAME="decimal" VALUE=" . "
				// OnClick="Calc.Input.value += &#39;.&#39;"><INPUT
				// TYPE="button" NAME="DoIt" VALUE=" = "
				// OnClick="Calc.Input.value =
				// calculateWithErrorCheck(Calc.Input.value)"><INPUT
				// TYPE="button" NAME="div" VALUE=" / "
				// OnClick="Calc.Input.value += &#39; /
				// &#39;"><br></TD></TR></TABLE></FORM>';
				div.innerHTML += '<FORM id="calculator" NAME="Calc"><TABLE BORDER=1><Thead><tr><INPUT TYPE="text" maxlength="18" NAME="Input" Size="16"></tr></Thead><TR><TD><INPUT TYPE="button" NAME="plusminus" VALUE=" +/- " OnClick="makenegative()"></td><td><INPUT TYPE="button" id="spacer" value="n/a"></td><td><INPUT TYPE="button" id="memset" NAME="memset" VALUE=" MS " OnCLick="memoryset()"></td><td><INPUT TYPE="button" id="memrecall" NAME="memrecall" VALUE=" MR " OnClick="memoryrecall()"></td><td><INPUT TYPE="button" id="memclear" NAME="memclear" VALUE=" MC " OnClick="memoryclear()"></td></tr><tr><td><INPUT TYPE="button" NAME="pct" VALUE="  %  " OnClick="Calc.Input.value = Calc.Input.value/100"></td><td><INPUT TYPE="button" NAME="seven" VALUE="  7  " OnClick="Calc.Input.value += &#39;7&#39;"></td><td><INPUT TYPE="button" NAME="eight" VALUE="  8  " OnCLick="Calc.Input.value += &#39;8&#39;"></td><td><INPUT TYPE="button" NAME="nine"  VALUE="  9  " OnClick="Calc.Input.value += &#39;9&#39;"></td><td><INPUT TYPE="button" NAME="plus"  VALUE="  +  " OnClick="Calc.Input.value += &#39; + &#39;"></td></tr><tr><td><INPUT TYPE="button" NAME="sqrt" VALUE="  &#8730;  " OnClick="Calc.Input.value = squareRootWithErrorCheck(Calc.Input.value)"></td><td><INPUT TYPE="button" NAME="four"  VALUE="  4  " OnClick="Calc.Input.value += &#39;4&#39;"></td><td><INPUT TYPE="button" NAME="five"  VALUE="  5  " OnCLick="Calc.Input.value += &#39;5&#39;"></td><td><INPUT TYPE="button" NAME="six"   VALUE="  6  " OnClick="Calc.Input.value += &#39;6&#39;"></td><td><INPUT TYPE="button" NAME="minus" VALUE="  -  " OnClick="Calc.Input.value += &#39; - &#39;"></td></tr><tr><td><input type="button" id="spacer" value="n/a"></td><td><INPUT TYPE="button" NAME="one"   VALUE="  1  " OnClick="Calc.Input.value += &#39;1&#39;"></td><td><INPUT TYPE="button" NAME="two"   VALUE="  2  " OnClick="Calc.Input.value += &#39;2&#39;"></td><td><INPUT TYPE="button" NAME="three" VALUE="  3  " OnClick="Calc.Input.value += &#39;3&#39;"></td><td><INPUT TYPE="button" NAME="times" VALUE="  x  " OnClick="Calc.Input.value += &#39; * &#39;"></td></tr><tr><td><INPUT TYPE="button" NAME="clear" VALUE="  c  " OnClick="Calc.Input.value = &#39;&#39;"></td><td><INPUT TYPE="button" NAME="zero"  VALUE="  0  " OnClick="Calc.Input.value += &#39;0&#39;"></td><td><INPUT TYPE="button" NAME="decimal" VALUE="  .  " OnClick="Calc.Input.value += &#39;.&#39;"></td><td><INPUT TYPE="button" NAME="DoIt"  VALUE="  =  " OnClick="Calc.Input.value = calculateWithErrorCheck(Calc.Input.value)"></td><td><INPUT TYPE="button" NAME="div"   VALUE="  /  " OnClick="Calc.Input.value += &#39; / &#39;"></td></TR></TABLE></FORM>';
			} else {
				// basic or otherwise
				div.innerHTML += '<FORM id="calculator" NAME="Calc"><TABLE BORDER=1><Thead><INPUT TYPE="text" maxlength="12" NAME="Input" Size="15"><br></Thead><TR><TD><INPUT TYPE="button" id="spacer" value="n/a"></td><td><INPUT TYPE="button" NAME="seven" VALUE="  7  " OnClick="Calc.Input.value += &#39;7&#39;"></td><td><INPUT TYPE="button" NAME="eight" VALUE="  8  " OnCLick="Calc.Input.value += &#39;8&#39;"></td><td><INPUT TYPE="button" NAME="nine"  VALUE="  9  " OnClick="Calc.Input.value += &#39;9&#39;"></td><td><INPUT TYPE="button" NAME="plus"  VALUE="  +  " OnClick="Calc.Input.value += &#39; + &#39;"></td></tr><tr><td><INPUT TYPE="button" id="spacer" value="n/a"></td><td><INPUT TYPE="button" NAME="four"  VALUE="  4  " OnClick="Calc.Input.value += &#39;4&#39;"></td><td><INPUT TYPE="button" NAME="five"  VALUE="  5  " OnCLick="Calc.Input.value += &#39;5&#39;"></td><td><INPUT TYPE="button" NAME="six"   VALUE="  6  " OnClick="Calc.Input.value += &#39;6&#39;"></td><td><INPUT TYPE="button" NAME="minus" VALUE="  -  " OnClick="Calc.Input.value += &#39; - &#39;"></td></tr><tr><td><input type="button" id="spacer" value="n/a"></td><td><INPUT TYPE="button" NAME="one"   VALUE="  1  " OnClick="Calc.Input.value += &#39;1&#39;"></td><td><INPUT TYPE="button" NAME="two"   VALUE="  2  " OnCLick="Calc.Input.value += &#39;2&#39;"></td><td><INPUT TYPE="button" NAME="three" VALUE="  3  " OnClick="Calc.Input.value += &#39;3&#39;"></td><td><INPUT TYPE="button" NAME="times" VALUE="  x  " OnClick="Calc.Input.value += &#39; * &#39;"></td></tr><tr><td><INPUT TYPE="button" NAME="clear" VALUE="  c  " OnClick="Calc.Input.value = &#39;&#39;"></td><td><INPUT TYPE="button" NAME="zero"  VALUE="  0  " OnClick="Calc.Input.value += &#39;0&#39;"></td><td><INPUT TYPE="button" NAME="decimal" VALUE="   .   " OnClick="Calc.Input.value += &#39;.&#39;"></td><td><INPUT TYPE="button" NAME="DoIt"  VALUE="  =  " OnClick="Calc.Input.value = calculateWithErrorCheck(Calc.Input.value)"></td><td><INPUT TYPE="button" NAME="div"   VALUE="  /  " OnClick="Calc.Input.value += &#39; / &#39;"><br></TD></TR></TABLE></FORM>';
			}
			div.style.top = "50%";
			div.style.left = "50%";
			div.style.height = "auto";
			div.style.width = "auto";
			div.style.position = "absolute";
			// div.style.margin = "-"+$("#dialog").height()+"px 0 0
			// -"+$("#dialog").width()+"px";
			div.style.margin = "-50px 0 0 -100px";
			div.style.backgroundColor = "#ffffff";
			document.body.appendChild(div);
			$("#dialog").draggable();
			$("#closeCalculator").click(function() {
				document.body.removeChild(div);
			});

			$("#biggerCalc").click(
					function() {
						var fz = parseInt($('#calculator input[type="button"]')
								.css('font-size'));
						$('#calculator input').css({
							'font-size' : fz + 2
						});
					});

			$("#smallerCalc").click(
					function() {
						var fz = parseInt($('#calculator input[type="button"]')
								.css('font-size'));
						$('#calculator input').css({
							'font-size' : fz - 2
						});
					});

			$("#memrecall").attr("disabled", !isMemorySet);
			$("#memclear").attr("disabled", !isMemorySet);

			memoryrecall = function() {
				Calc.Input.value = memory;
			}

			memoryclear = function() {
				isMemorySet = false;
				$("#memrecall").attr("disabled", !isMemorySet);
				$("#memclear").attr("disabled", !isMemorySet);
				memory = 0;
			}

			memoryset = function() {
				isMemorySet = true;
				$("#memrecall").attr("disabled", !isMemorySet);
				$("#memclear").attr("disabled", !isMemorySet);
				memory = Calc.Input.value;
			}

			memoryadd = function() {
				memory = Calc.Input.value + memory;
			}

			makenegative = function() {
				var currValue = Calc.Input.value;
				var isnum = /^\d+$/.test(currValue);

				if (isnum) {
					Calc.Input.value *= -1;
				} else {
					var lastNumber = parseInt(currValue
							.match(/[-+]?([0-9]*\.[0-9]+|[0-9]+)/));
					var index = currValue.indexOf(lastNumber);
					if (lastNumber > 0) {
						Calc.Input.value = currValue.insert(index, "-");
					} else {
						Calc.Input.value = currValue.replace(currValue
								.charAt(index), "");
					}

				}
			}

			calculateWithErrorCheck = function(input) {
				if (input.indexOf("/ 0") >= 0) {
					return "Cannot divide by 0";
				} else {
					return displaySigDig(eval(input));
				}
			}

			squareRootWithErrorCheck = function(input) {
				if (input < 0) {
					return "Input is not valid";
				} else {
					return displaySigDig(Math.sqrt(input));
				}
			}

			displaySigDig = function(input) {
				if (input.toString().length > 14) {
					return input.toPrecision(14);
				} else {
					return input;
				}
			}

			String.prototype.insert = function(index, string) {
				if (index > 0) {
					return this.substring(0, index) + string
							+ this.substring(index, this.length);
				} else {
					return string + this;
				}
			};
		},

		registerReadyCallback : function(callback) {
			$(document).ready(function() {
				if (typeof (MathJax) !== "undefined") {
					MathJax.Hub.Queue(callback);
				} else {
					callback();
				}
			});
		},

		validateInput : function(obj) {
			var errorMessage = '';
			var value = obj.value;
			for (var i = 1; i < arguments.length; i++) {
				switch (arguments[i]) {
				case 'float':
					if (!value.match(/^-?[\d\.]+$/)) {
						errorMessage += 'This input must be a number!\n';
					}
					break;

				case 'integer':
					if (!value.match(/^-?\d+$/)) {
						errorMessage += 'This input must be an integer!\n';
					}
					break;

				//case 'regex':
				//	var regex = arguments[++i];
				//	if (!value.match(regex)) {
				//		errorMessage += 'This input is not valid!\n';
				//	}
				//	break;
				}
			}
			if (errorMessage.length != 0) {
				alert(errorMessage);
				$(obj).addClass("badResponse");
				return false;
			} else {
				$(obj).removeClass("badResponse");
				return true;
			}
		},

		/* Used for <extendedTextInteraction/> */
		addNewTextBox : function(inputElement) {
			var input = $(inputElement);
			var newInput = input.clone(true);
			input.removeAttr('onkeyup');
			newInput.attr('value', '');

			var br = $("<br>");
			input.after(br);
			br.after(newInput);
		}
	};
})();
