			var layerX = 0;
			var layerY = 0;
			var answered = false;
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
  						imgMaxHeight = $(element).height();
  					}
				});
				imgMaxHeight += Number(rowY) - Number(firstRowY);
  				$('#myCanvas')[0].width = $('#theImage').width();
  				$('#myCanvas')[0].height = $('#theImage').height() + imgMaxHeight + 30;
  				$('#canvasContainer').css({width:$('#theImage').width()+'px', height:$('#theImage').height()+imgMaxHeight + 30 +'px'});
  				
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
		    	if (prev.length > 0) {
		    		answered = true;
		    	}
		    	for (var y=0; y<images.length; y++) {
		    		var n = prev.indexOf(images[y].identifier);
		    		if (n>-1) {
		    			var subPrev = prev.substr(n);
		    			for (var z=0; z<images.length; z++) {
		    				var m = prev.indexOf(images[z].identifier);
		    				if (m>0) {
		    					subPrev = subPrev.substr(0,m);
		    				}
		    			}
		    			for (var i=0; i<images.length; i++) {
		    				if (subPrev.split(":")[0] == images[i].identifier) {
		    					var offset = $('#myCanvas').offset();
		    					var imgX = Number(subPrev.split(":")[1].split("-")[1]) - offset.left;
		    					var imgY = Number(subPrev.split(":")[1].split("-")[0]) - offset.top;
		    					$('#'+images[i].identifier).css({position:'absolute', left:imgX+'px', top:imgY+'px'});
		    				}
		    			}
		    		}
		    	}
		    	
		    });
		    
		    $("#itemForm").submit(function() {
		    	if (answered) {
					var theResponse = "";
					for (var im=0; im<images.length; im++) {
			        	var id = images[im].identifier;
				       	var top = $('#'+id).offset().top;
				       	var left = $('#'+id).offset().left;
				       	theResponse = id + ":" + top + "-" + left;
							$('<input />').attr('type', 'hidden')
					       		.attr('name', "qtiworks_response_RESPONSE")
					          	.attr('value', theResponse)
					          	.appendTo('#itemForm');
				    }
				}
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
		    	img.onmousedown=mousedown;
		    	img.ondragstart=dragstart;
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
				for (var im=0; im<images.length; im++) {
				    if (images[im].selection>-1) {
		    			var canvas=document.getElementById("myCanvas");
		    			var ctx=canvas.getContext("2d");
				        ctx.fillStyle = "rgba(150,29,28, 0.1)";
						ctx.fillRect(images[im].origPos.left, images[im].origPos.top, $('#'+images[im].identifier).width(), $('#'+images[im].identifier).height());
				    }
				}
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
						var left1 = hotspots[x].coords.split(',')[0];
						var top1 = hotspots[x].coords.split(',')[1];
						var left2 = hotspots[x].coords.split(',')[2];
						var top2 = hotspots[x].coords.split(',')[3];
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
		    }

		    function mousedown(ev){
		        startOffsetX=ev.offsetX;
		        startOffsetY=ev.offsetY;
		    }

		    function dragstart(ev) {
		        ev.dataTransfer.setData("Text",ev.target.id);
		        layerX = ev.layerX;
		        layerY = ev.layerY;
		    }

		    function drop(ev) {
		    	answered = true;
		        ev.preventDefault();

		        var id=ev.dataTransfer.getData("Text");
		        var droppable = false;
		        var offset = $(this).offset();
    			var clickX = ev.pageX - offset.left - layerX;
    			var clickY = ev.pageY - offset.top - layerY;
    			var dropElement=document.getElementById(id);
    			$('#'+id).css({position:'absolute', top:clickY+'px', left:clickX+'px'});
		    }