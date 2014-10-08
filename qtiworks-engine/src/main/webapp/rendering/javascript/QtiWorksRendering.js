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
							alert("You must select and order between "
									+ minChoices + " and " + maxChoices
									+ " items");
						} else {
							alert("You must select and order exactly "
									+ minChoices + " item"
									+ (minChoices > 1 ? "s" : ""));
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
		var mode = "point"; // point, line, or ray
		var ptsSelected = [];
		var ptsCreated = [];
		var linesCreated = [];
		var raysCreated = [];
		var lineSegmentsCreated = [];
		var anglesCreated = [];
		var isSnapTo = false;
		var interaction = this;
		var inputElementQuery = $('input[name="qtiworks_response_' + 'RESPONSE'
				+ '"]');

		var gridObject = $('[type=grid]');
		var gridImg = $('[type=gridImg]');
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
		gridContainer.attr('style', styleString);
		board = JXG.JSXGraph.initBoard('jxgbox', {
			boundingbox : [ boundsArray[0], boundsArray[1], boundsArray[2],
					boundsArray[3] ],
			axis : (gridObject.attr('axis') == 'true'),
			grid : (gridObject.attr('grid') == 'true'),
			showCopyright : false,
			showNavigation : false
		});
		if (gridImg.length > 0) {
			if (!gridImg.attr('height')) {
				gridImg.attr('height', '5');
			}
			if (!gridImg.attr('width')) {
				gridImg.attr('width', '5')
			}
			var h = gridImg.attr('height');
			var w = gridImg.attr('width');
			var im = board.create('image', [ gridImg.attr('data'), [ 1, 0 ],
					[ gridImg.attr('width'), gridImg.attr('height') ] ], {
				isDraggable : false
			});
			im.isDraggable = false;
		}
		$('#linedirections').hide();
		$('#linesegdirections').hide();
		$('#raydirections').hide();
		$('#angledirections').hide();
		// restore any responses
		function getValue() {
			var res = $("input[name='previousResponses']").attr("value");

			// parse values
			var res2 = res.replace('points:', '').replace('lines:', '')
					.replace('linesegs:', '').replace('rays:', '').replace(
							'angles:', '');
			var resValues = res2.split("/");
			var ptsValues = resValues[0].split(";");
			for (var a = 0; a < ptsValues.length; a++) {
				var pt = ptsValues[a];
				var coord = pt.split(",");
				var x = parseInt(coord[0]);
				var y = parseInt(coord[1]);
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
			if (resValues.length > 1) {
				var index = 1;
				for (var index = 1; index < resValues.length; index++) {
					switch (index) {
					case 1:
						mode = 'line';
						break;
					case 2:
						mode = 'lineseg';
						break;
					case 3:
						mode = 'ray';
						break;
					default:
						mode = 'angle';
						break;
					}
					var lnsValues = resValues[index].split(";");
					for (var b = 0; b < lnsValues.length; b++) {
						ptArr = lnsValues[b].split("_");
						for (var c = 0; c < ptArr.length; c++) {
							if (c == 0) {
								coord1 = ptArr[c];
							} else if (c == 1) {
								coord2 = ptArr[c];
							} else {
								coord3 = ptArr[c];
							}
						}
						var x1 = parseInt(coord1.split(",")[0]);
						var y1 = parseInt(coord1.split(",")[1]);
						var x2 = parseInt(coord2.split(",")[0]);
						var y2 = parseInt(coord2.split(",")[1]);
						var x3, y3;
						if (mode == 'angle') {
							x3 = parseInt(coord3.split(",")[0]);
							y3 = parseInt(coord3.split(",")[1]);
						}

						if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2)
								&& !isNaN(y2) && mode != 'angle') {
							var newLine = board.create('line', [ [ x1, y1 ],
									[ x2, y2 ] ], {
								straightFirst : mode == 'line',
								straightLast : mode == 'ray' || mode == 'line',
								strokeColor : '#00ff00',
								strokeWidth : 2
							});
							resPtsSelected = [];
						} else if (mode == 'angle') {
							var alpha = board.create('angle', [ [ x1, y1 ],
									[ x2, y2 ], [ x3, y3 ] ], {
								radius : 3
							});
						}
					}
				}
			}
		}
		;
		getValue();
		$('#jxgbox').mousedown(function(e) {
			if (e.target.nodeName == "image") {

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
				// remove(e);
				getValue();
				break;
			default:
				alert('You have a strange mouse');
			}
		});
		$('#jxgbox').on('dragstart', function(e) {
			e.preventDefault();
		});
		$('#drawline').click(function() {
			$('#linedirections').toggle(this.checked);
			mode = this.checked ? 'line' : 'point';
			$('#drawlineseg').removeAttr('checked');
			$('#drawray').removeAttr('checked');
			$('#drawangle').removeAttr('checked');
			$('#linesegdirections').toggle(false);
			$("#raydirections").toggle(false);
			$('#angledirections').toggle(false);
			ptsSelected = [];

		});
		$('#drawlineseg').click(function() {
			$('#linesegdirections').toggle(this.checked);
			mode = this.checked ? 'lineseg' : 'point';
			$('#drawray').removeAttr('checked');
			$('#drawline').removeAttr('checked');
			$('#drawangle').removeAttr('checked');
			$("#raydirections").toggle(false);
			$('#linedirections').toggle(false);
			$('#angledirections').toggle(false);
			ptsSelected = [];

		});
		$('#drawray').click(function() {
			$('#raydirections').toggle(this.checked);
			mode = this.checked ? 'ray' : 'point';
			$('#drawline').removeAttr('checked');
			$('#drawlineseg').removeAttr('checked');
			$('#drawangle').removeAttr('checked');
			$('#linedirections').toggle(false);
			$('#linesegdirections').toggle(false);
			$('#angledirections').toggle(false);
			ptsSelected = [];

		});
		$('#drawangle').click(function() {
			$('#angledirections').toggle(this.checked);
			mode = this.checked ? 'angle' : 'point';
			$('#drawline').removeAttr('checked');
			$('#drawlineseg').removeAttr('checked');
			$('#drawray').removeAttr('checked');
			$('#linedirections').toggle(false);
			$('#linesegdirections').toggle(false);
			$("#raydirections").toggle(false);
			ptsSelected = [];
		});
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
			var i, coords, el;

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
					break;
				}
			}
			if ((ptsSelected.length >= 2) && (mode != 'angle')) {
				var newLine = board.create('line', [ ptsSelected[0],
						ptsSelected[1] ], {
					straightFirst : mode == 'line',
					straightLast : mode == 'ray' || mode == 'line',
					strokeColor : '#00ff00',
					strokeWidth : 2
				});
				if (mode == 'line') {
					linesCreated.push(newLine.id);
				} else if (mode == 'ray') {
					raysCreated.push(newLine.id);
				} else {
					lineSegmentsCreated.push(newLine.id);
				}
				ptsSelected = [];
				setValue();
			} else if ((ptsSelected.length > 2) && (mode == 'angle')) {
				var alpha = board.create('angle', [ ptsSelected[0],
						ptsSelected[1], ptsSelected[2] ], {
					radius : 3
				});
				// linesCreated.push(alpha.id);
				anglesCreated.push(alpha.id);
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
			var linePointValues = "/linePoints:"
			for (var b = 0; b < linesCreated.length; b++) {
				var x1 = board.objects[linesCreated[b]].point1.XEval();
				var y1 = board.objects[linesCreated[b]].point1.YEval();
				var x2 = board.objects[linesCreated[b]].point2.XEval();
				var y2 = board.objects[linesCreated[b]].point2.YEval();
				// let's calculate the slope
				var m = (y2 - y1) / (x2 - x1);
				var b = y1 - (m * x1);

				linePointValues += x1.toString() + "," + y1.toString() + "_"
						+ x2.toString() + "," + y2.toString() + ";";
				linesValues += "y="+m.toString()+"x+"+b.toString()+";";
			}
			var lineSegValues = "/linesegs:";
			var lineSegPointValues = "/linesegPoints:";
			for (var c = 0; c < lineSegmentsCreated.length; c++) {
				var sx1 = board.objects[lineSegmentsCreated[c]].point1.XEval();
				var sy1 = board.objects[lineSegmentsCreated[c]].point1.YEval();
				var sx2 = board.objects[lineSegmentsCreated[c]].point2.XEval();
				var sy2 = board.objects[lineSegmentsCreated[c]].point2.YEval();
				// let's calculate the slope
				var m = (sy2 - sy1) / (sx2 - sx1);
				var b = sy1 - (m * sx1);
				lineSegPointValues += sx1.toString() + "," + sy1.toString() + "_"
						+ sx2.toString() + "," + sy2.toString() + ";";
				lineSegValues += "y="+m.toString()+"x+"+b.toString()+";";
			}
			var rayValues = "/rays:";
			var rayPointValues = "/rayPoints:";
			for (var d = 0; d < raysCreated.length; d++) {
				var rx1 = board.objects[raysCreated[d]].point1.XEval();
				var ry1 = board.objects[raysCreated[d]].point1.YEval();
				var rx2 = board.objects[raysCreated[d]].point2.XEval();
				var ry2 = board.objects[raysCreated[d]].point2.YEval();
				// let's calculate the slope
				var m = (ry2 - ry1) / (rx2 - rx1);
				var b = ry1 - (m * rx1);
				rayPointValues += rx1.toString() + "," + ry1.toString() + "_"
						+ rx2.toString() + "," + ry2.toString() + ";";
				rayValues += "y="+m.toString()+"x+"+b.toString()+";";
			}
			var angleValues = "/angles:"
			for (var e = 0; e < anglesCreated.length; e++) {
				var ax1 = board.objects[anglesCreated[e]].point1.XEval();
				var ay1 = board.objects[anglesCreated[e]].point1.YEval();
				var ax2 = board.objects[anglesCreated[e]].point2.XEval();
				var ay2 = board.objects[anglesCreated[e]].point2.YEval();
				var ax3 = board.objects[anglesCreated[e]].point3.XEval();
				var ay3 = board.objects[anglesCreated[e]].point3.YEval();
				angleValues += ax1.toString() + "," + ay1.toString() + "_"
						+ ax2.toString() + "," + ay2.toString() + "_"
						+ ax3.toString() + "," + ay3.toString() + ";";
			}
			// we'll append the "point" value strings to the end for response re-creation.
			inputElementQuery.get(0).value = ptsValues + linesValues
					+ lineSegValues + rayValues + angleValues + linePointValues 
					+ lineSegPointValues + rayPointValues;
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

				case 'regex':
					var regex = arguments[++i];
					if (!value.match(regex)) {
						errorMessage += 'This input is not valid!\n';
					}
					break;
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
