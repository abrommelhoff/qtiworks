			$( window ).load(function() {
				var prev = $("#previousResponses").val();
				if (prev.length > 0) {
					var prevArr = prev.split(",");
					for (var x=0; x<hotspots.length; x++) {
						if (prev.indexOf(hotspots[x].identifier) >=0) {
							hotspots[x].clicked = true;
						}
					}
				}
				var c = document.getElementById("myCanvas");
				var ctx = c.getContext("2d");
				ctx.canvas.height = $("#theImage").height();
				ctx.canvas.width = $("#theImage").width();
				for (var x=0; x<hotspots.length; x++) {
					if (hotspots[x].shape == 'circle') {
						var left = hotspots[x].coords.split(',')[0];
						var top = hotspots[x].coords.split(',')[1];
						var radius = hotspots[x].coords.split(',')[2];
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
			});
			function isPointInPoly(poly, pt){
			    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
			        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
			        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
			        && (c = !c);
			    return c;
			}
			$("#itemForm").submit(function() {
				var theResponse = "";
				for (var x=0; x<hotspots.length; x++) {
					if (hotspots[x].clicked) {
						if (theResponse.length > 0) {
							theResponse += ",";
						}
						theResponse += hotspots[x].identifier;
					}
				}
				//$("#qtiworks_response_RESPONSE").val(theResponse);
				$('<input />').attr('type', 'hidden')
				          .attr('name', "qtiworks_response_RESPONSE")
				          .attr('value', theResponse)
				          .appendTo('#itemForm');
				return true;
			});
  			$("#myCanvas").click(function(e) {
  				var offset = $(this).offset();
    			var clickX = e.pageX - offset.left;
    			var clickY = e.pageY - offset.top;
    			c = document.getElementById("myCanvas");
				ctx = c.getContext("2d");
				var canvas = document.getElementById('myCanvas');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
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
						if (zeroX*zeroX + zeroY*zeroY <= radius*radius) {
							if (hotspots[x].clicked || currResponses < maxResponses || maxResponses == 0) {
								hotspots[x].clicked = !hotspots[x].clicked;
							}
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
						if (clickX >= left1 && clickX <= left2 && clickY >= top1 && clickY <= top2) {
							if (hotspots[x].clicked || currResponses < maxResponses || maxResponses == 0) {
								hotspots[x].clicked = !hotspots[x].clicked;
							}
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
						if (isPointInPoly(poly, {x: clickX, y: clickY})) {
							if (hotspots[x].clicked || currResponses < maxResponses || maxResponses == 0) {
								hotspots[x].clicked = !hotspots[x].clicked;
							}
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
	  		});