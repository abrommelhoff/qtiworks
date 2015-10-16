			var fromx = 0;
			
			function isPointInPoly(poly, pt){
			    var x = Number(pt.x), y = Number(pt.y);
			    
			    var inside = false;
			    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			        var xi = Number(poly[i].x), yi = Number(poly[i].y);
			        var xj = Number(poly[j].x), yj = Number(poly[j].y);
			        
			        var intersect = ((yi > y) != (yj > y))
			            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			        if (intersect) inside = !inside;
			    }
			    
			    return inside;
			}
			$(window).load(function(){
			  	setTimeout(continueLoad, 500) //wait ten seconds before continuing
			});
			
			function continueLoad() {
  				console.log('load');
  				$('#canvasContainer').css({width:$('#theImage').width()+'px'});
  				var imgMaxHeight = 0;
  				var firstRowY = 10000;
  				var rowY = 0;
  				$( ".opt" ).each(function( index, element ) {
  					if ($(element).position().top > rowY) {
  						rowY = $(element).position().top;
  					}
  					if ($(element).position().top < firstRowY) {
  						firstRowY = $(element).position().top;
  					}
  					if ($(element).height() > imgMaxHeight) {
  						imgMaxHeight = Number($(element).height());
  					}
				});
				imgMaxHeight += Number(rowY) - Number(firstRowY);
  				$('#myCanvas')[0].width = $('#theImage').width();
  				$('#myCanvas')[0].height = $('#theImage').height() + imgMaxHeight + 30;
  				$('#canvasContainer').css({width:$('#theImage').width()+'px', height:$('#theImage').height()+imgMaxHeight + 35 +'px'});
  				$('#imgback').css({height:imgMaxHeight + 30 +'px'});
  				
	  			for (var im=0; im<images.length; im++) {
		  			if (!images[im].hasOwnProperty('origPos')) {
		  				var id = images[im].identifier;
		    			images[im].origPos = $('#'+id).position();
		    		}
		    	}
		    	for (var im=0; im<images.length; im++) {
	  				var id = images[im].identifier;
	    			$('#'+id).css({position:'absolute', top:images[im].origPos.top+'px', left:images[im].origPos.left+'px'});
		    	}
		    	var prev = $("#previousResponses").val();
		    	var prevArr = [];
		    	for (var x=hotspots.length-1; x>=0; x--) {
		    		for (var im=images.length-1; im>=0; im--) {
						if (prev.indexOf(images[im].identifier + ' ' + hotspots[x].identifier) >=0) {
							var startSpot = prev.indexOf(images[im].identifier + ' ' + hotspots[x].identifier);
							var endSpot = prev.indexOf(images[im].identifier + ' ' + hotspots[x].identifier) + images[im].identifier.length + hotspots[x].identifier.length + 1;
							prevArr.push(prev.slice(startSpot, endSpot));
							prev = [prev.slice(0, startSpot), prev.slice(endSpot)].join('');
						}	
					}
				}
		    	//var prevArr = prev.split(",");
				for (var p=0; p<prevArr.length; p++) {
					var image = prevArr[p].split(' ')[0];
					var hotspot = prevArr[p].split(' ')[1];
					for (var x=0; x<hotspots.length; x++) {
						for (var y=0; y<images.length; y++) {
							if (hotspot == hotspots[x].identifier && image == images[y].identifier) {
								var selArr = images[y].selection.toString().split(",");
							    if (images[y].selection == -1) {
				        			images[y].selection = x;
				        		} else {
				        			images[y].selection += ',' + x;
				        		}
				        		if (!images[y].hasOwnProperty('origPos')) {
				        			images[y].origPos = $('#'+id).position();
				        		}
								var coordList = hotspots[x].coords.split(',');
				        		var coordcount = 0;
				        		var xSum = 0;
				        		var ySum = 0;
				        		for (var z=0; z<coordList.length; z++) {
				        			if (z%2 == 0) {
				        				coordcount++;
										xSum += Number(coordList[z]);
									} else {
										ySum += Number(coordList[z]);
									}
								} 
						        var dropElement=document.getElementById(id);
						        var dropX = xSum/coordcount - $('#'+images[y].identifier).width()/2;// + $('#canvasContainer').position().left;
						        var dropY = ySum/coordcount - $('#'+images[y].identifier).height()/2;// + $('#canvasContainer').position().top;
						        
						        images[y].origPos = $('#'+images[y].identifier).position();
						        var newId = images[y].identifier + Math.random().toString(36).substr(2, 5);
						        var sourceImage = document.createElement('img');
								var imgContainer = document.getElementById("canvasContainer");
								sourceImage.src = document.getElementById(images[y].identifier).src;
								sourceImage.id = newId;
								sourceImage.draggable=true;
						    	sourceImage.onmousedown=mousedown;
						    	sourceImage.ondragstart=dragstart;
						    	sourceImage.onmouseout=dragstop;
								imgContainer.appendChild(sourceImage);
								$('#' + newId).css({position:'absolute', top:dropY+'px', left:dropX+'px'});
						        //$('#'+images[y].identifier).css({position:'absolute', top:dropY+'px', left:dropX+'px'});
							}
						}
					}
				}
				
		    };
		    
		    $("#itemForm").submit(function() {
				var theResponse = "";
				for (var x=0; x<hotspots.length; x++) {
					for (var y=0; y<images.length; y++) {
						var imgSel = images[y].selection.toString().split(',');
						for (var z=0; z<imgSel.length; z++) {
							if (imgSel[z] == x) {
								if (theResponse.length > 0) {
									//theResponse += ",";
								}
								theResponse = images[y].identifier + " " + hotspots[x].identifier;
								$('<input />').attr('type', 'hidden')
					          		.attr('name', "qtiworks_response_RESPONSE")
					          		.attr('value', theResponse)
					          		.appendTo('#itemForm');
							}
						}
					}
				}
				//$("#qtiworks_response_RESPONSE").val(theResponse);
				
				return true;
			});

  			var maxResponses = 0;
  			var canvas=document.getElementById("myCanvas");
		    var ctx=canvas.getContext("2d");
		    var canvasLeft=canvas.offsetLeft;
		    var canvasTop=canvas.offsetTop;
		    canvas.ondrop=drop;
		    canvas.ondragover=allowDrop;
		    //
		    for (var i=0; i<images.length; i++) {
		    	var img=document.getElementById(images[i].identifier);
		    	img.draggable=true;
		    	img.onmousedown=mousedown;
		    	img.ondragstart=dragstart;
		    	img.onmouseout=dragstop;
		    }

		    var startOffsetX,startOffsetY;

		    function allowDrop(e) {
		        e.preventDefault();
		        var offset = $(this).offset();
    			var clickX = e.pageX - offset.left;
    			var clickY = e.pageY - offset.top;
    			var c = document.getElementById("myCanvas");
				var ctx = c.getContext("2d");
				var canvas = document.getElementById('myCanvas');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				/*for (var im=0; im<images.length; im++) {
				    if (images[im].selection>-1) {
		    			var canvas=document.getElementById("myCanvas");
		    			var ctx=canvas.getContext("2d");
				        ctx.fillStyle = "rgba(150,29,28, 0.1)";
						ctx.fillRect(images[im].origPos.left, images[im].origPos.top, $('#'+images[im].identifier).width(), $('#'+images[im].identifier).height());
				    }
				}*/
				var currResponses = 0;
				for (var x=0; x<hotspots.length; x++) {
					if (hotspots[x].clicked) {
						currResponses++;
					}
				}
				for (var x=0; x<hotspots.length; x++) {
					if (hotspots[x].shape == 'circle') {
						var left = hotspots[x].coords.split(',')[0];
						var top = hotspots[x].coords.split(',')[1];
						var radius = hotspots[x].coords.split(',')[2];
						var zeroX = clickX - left;
						var zeroY = clickY - top;
						hotspots[x].clicked = false;
						if (zeroX*zeroX + zeroY*zeroY <= radius*radius) {
							hotspots[x].clicked = true;
						}
						if (hotspots[x].clicked) {
							ctx.beginPath();
							ctx.arc(left,top,radius,0,2*Math.PI);
							ctx.strokeStyle="blue";
							ctx.lineWidth = 3;
							ctx.stroke();
						}
					} else if (hotspots[x].shape == 'rect') {
						var left1 = parseFloat(hotspots[x].coords.split(',')[0]);
						var top1 = parseFloat(hotspots[x].coords.split(',')[1]);
						var left2 = parseFloat(hotspots[x].coords.split(',')[2]);
						var top2 = parseFloat(hotspots[x].coords.split(',')[3]);
						hotspots[x].clicked = false;
						if (clickX >= left1 && clickX <= left2 && clickY >= top1 && clickY <= top2) {
							hotspots[x].clicked = true;
						}
						if (hotspots[x].clicked) {
							ctx.beginPath();
							ctx.rect(left1,top1,left2-left1,top2-top1);
							ctx.strokeStyle="blue";
							ctx.lineWidth = 3;
							ctx.stroke();
						}
					} else if (hotspots[x].shape == 'poly') {
						var coordList = hotspots[x].coords.split(',');
						var thisX = 1000;
						var thisY = 1000;
						var poly = [];
						for (var y=0; y<coordList.length; y++) {
							if (y%2 == 0) {
								thisX = coordList[y];
							} else {
								thisY = coordList[y];
								poly.push({x: thisX, y: thisY});
							}

						}
						hotspots[x].clicked = false;
						if (isPointInPoly(poly, {x: clickX, y: clickY})) {
							hotspots[x].clicked = true;
						}
						if (hotspots[x].clicked) {
							ctx.beginPath();
							for (var z=0; z<poly.length; z++) {
								if (z==0) {
									ctx.moveTo(poly[z].x, poly[z].y);	
								} else {
									ctx.lineTo(poly[z].x, poly[z].y);	
								}
							}
							ctx.closePath();
							ctx.strokeStyle="blue";
							ctx.lineWidth = 3;
							ctx.stroke();
						}
					}
				}
				$('.opt').css({'pointer-events':'none','display':'inline-block'});
		    }

		    function mousedown(ev){
		        startOffsetX=ev.offsetX;
		        startOffsetY=ev.offsetY;
		        for (var x=0; x<hotspots.length; x++) {
		        	if (hotspots[x].clicked == true) {
		        		fromx = x;
		        	}
		        }
		    }

		    function dragstart(ev) {
		        ev.dataTransfer.setData("Text",ev.target.id);
		        //$('.opt').css({'pointer-events':'none'});
		        $('#imgback').css({'background-color':'#cccccc'});
		    }
		    
		    function dragstop(ev) {
		        //$('.opt').css({'pointer-events':'all'});
		    }

		    function drop(ev) {
		    	$('#imgback').css({'background-color':'#ffffff'});
		        ev.preventDefault();

		        var id=ev.dataTransfer.getData("Text");
				var newId = id + Math.random().toString(36).substr(2, 5);
		        var droppable = false;
		        for (var x=0; x<hotspots.length; x++) {
		        	if (hotspots[x].clicked == true) {
		        		droppable = true;
		        		var coordList = hotspots[x].coords.split(',');
		        		var coordcount = 0;
		        		var xSum = 0;
		        		var ySum = 0;
		        		for (var y=0; y<coordList.length; y++) {
		        			if (y%2 == 0) {
		        				coordcount++;
								xSum += Number(coordList[y]);
							} else {
								ySum += Number(coordList[y]);
							}
						} 
				        var dropElement=document.getElementById(id);
				        var dropX = xSum/coordcount - $('#'+id).width()/2;
				        var dropY = ySum/coordcount - $('#'+id).height()/2;
				        
				        for (var im=0; im<images.length; im++) {
				        	if (id.indexOf(images[im].identifier) > -1) {
				        		if (images[im].selection == -1) {
				        			images[im].selection = x;
				        		} else {
				        			images[im].selection += ',' + x;
				        		}
				        		if (!images[im].hasOwnProperty('origPos')) {
				        			images[im].origPos = $('#'+id).position();
				        		}
				        		var canvas=document.getElementById("myCanvas");
		    					var ctx=canvas.getContext("2d");
				        		ctx.fillStyle = "rgba(150,29,28, 0.1)";
								ctx.fillRect(images[im].origPos.left, images[im].origPos.top, $('#'+id).width(), $('#'+id).height());
								//var img=document.getElementById(id);
								//ctx.drawImage(img,dropX,dropY);
								var sourceImage = document.createElement('img');
								var imgContainer = document.getElementById("canvasContainer");
								sourceImage.src = document.getElementById(id).src;
								sourceImage.id = newId;
								sourceImage.draggable=true;
						    	sourceImage.onmousedown=mousedown;
						    	sourceImage.ondragstart=dragstart;
						    	sourceImage.onmouseout=dragstop;
								imgContainer.appendChild(sourceImage);
								$('#' + newId).css({position:'absolute', top:dropY+'px', left:dropX+'px'});
								if (id != images[im].identifier) {
									var image_x = document.getElementById(id);
									image_x.parentNode.removeChild(image_x);
									var selArr = images[im].selection.toString().split(",");
				        			images[im].selection = -1;
				        			for (var s=0; s<selArr.length; s++) {
				        				if (selArr[s] != fromx) {
				        					if (images[im].selection == -1) {
							        			images[im].selection = selArr[s];
							        		} else {
							        			images[im].selection += ',' + selArr[s];
							        		}
				        				}
				        			}
				        			console.log(images[im].selection);
								}
				        	} else {
				        		if (images[im].selection == x) {
				        			images[im].selection = -1;
				        			//$('#'+images[im].identifier).css({position:'absolute', top:images[im].origPos.top+'px', left:images[im].origPos.left+'px'});
				        		} else {
				        			var selArr = images[im].selection.toString().split(",");
				        			images[im].selection = -1;
				        			for (var s=0; s<selArr.length; s++) {
				        				if (selArr[s] != x) {
				        					if (images[im].selection == -1) {
							        			images[im].selection = selArr[s];
							        		} else {
							        			images[im].selection += ',' + selArr[s];
							        		}
				        				}
				        			}
				        			
				        		}
				        	}
				        }
				        
				        //$('#'+id).css({position:'absolute', top:dropY+'px', left:dropX+'px'});
				    }
				}  
				if (droppable == false) {
					var image_x = document.getElementById(id);
					image_x.parentNode.removeChild(image_x);
					for (var im=0; im<images.length; im++) {
				        if (id.indexOf(images[im].identifier) > -1) {
							var selArr = images[im].selection.toString().split(",");
						    images[im].selection = -1;
						    for (var s=0; s<selArr.length; s++) {
						        if (selArr[s] != fromx) {
						        	if (images[im].selection == -1) {
									    images[im].selection = selArr[s];
								   	} else {
									    images[im].selection += ',' + selArr[s];
									}
					  			}
				      		}
				      	}
					}
				}
				$('.opt').css({'pointer-events':'all'});
		    }