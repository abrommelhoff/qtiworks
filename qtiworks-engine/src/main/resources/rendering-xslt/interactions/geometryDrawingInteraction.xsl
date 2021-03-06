<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stylesheet [
<!ENTITY nbsp  "&#160;" >
]>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:qti="http://www.imsglobal.org/xsd/imsqti_v2p1"
  xmlns:qw="http://www.ph.ed.ac.uk/qtiworks"
  xmlns:gdi="http://measuredprogress.org/schema/geometrydrawing"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="qti qw xs gdi">
  <xsl:template match="qti:customInteraction[@class='org.qtitools.geometrydrawing.GeometryDrawingInteraction']">
  	<html>
  		<head>
  			<script src="{$webappContextPath}/rendering/javascript/jsxgraphcore.js"/>
  		</head>
  	</html>
    <p/>
      <div id="controlsDiv">
	      <input name="qtiworks_presented_{@responseIdentifier}" type="hidden" value="1"/>
	      <xsl:if test="@gdi:showPlotPoints='true' or not(@gdi:showPlotPoints)">
	      	<input type="radio" name="drawingMode" id="plotPoint" value="plotPoint"/>Plot a Point
	      </xsl:if>
	      <xsl:if test="@gdi:showDrawLine='true' or not(@gdi:showDrawLine)">
	      	<input type="radio" name="drawingMode" id="drawline" value="drawline"/><span class="lineText">Draw a &#160;&#160;&#160;&#160;&#160;</span>&#160;&#160;&#160;&#160;
	      </xsl:if>
	      <xsl:if test="@gdi:showDrawLineSegment='true' or not(@gdi:showDrawLineSegment)">
		  	<input type="radio" name="drawingMode" id="drawlineseg" value="drawlineseg"/><span class="lineSegmentText">Draw a &#160;&#160;&#160;&#160;&#160;</span>&#160;&#160;&#160;&#160;
		  </xsl:if>
		  <xsl:if test="@gdi:showDrawRay='true' or not(@gdi:showDrawRay)">
		  	<input type="radio" name="drawingMode" id="drawray" value="drawray"/><span class="rayText">Draw a &#160;&#160;&#160;&#160;&#160;</span>&#160;&#160;&#160;&#160;
		  </xsl:if>
		  <xsl:if test="@gdi:showDrawAngle='true' or not(@gdi:showDrawAngle)">
		  	<input type="radio" name="drawingMode" id="drawangle" value="drawangle"/>Draw an angle
		  </xsl:if>
		  <xsl:if test="@gdi:showDrawShape='true' or not(@gdi:showDrawShape)">
		  	<input type="radio" name="drawingMode" id="drawshape" value="drawshape"/>Draw a shape<br/>
		  </xsl:if>
	  </div>
	  <span id="linedirections" class="lineText" style="font-style: italic;">Click two points to draw a &nbsp;&nbsp;&nbsp;&nbsp;</span>
	  <span id="linesegdirections" class="lineSegmentText" style="font-style: italic;">Click two points to draw a &nbsp;&nbsp;&nbsp;&nbsp;</span>
	  <span id="raydirections" class="rayText" style="font-style: italic;">Click two points to draw a &nbsp;&nbsp;&nbsp;&nbsp;</span>
	  <span id="angledirections" style="font-style: italic;">Click three points to draw an angle</span>
	  <span id="shapedirections" style="font-style: italic;">First, click any number of points set up the shape. Second, click the "Connect Points" button to draw the shape.</span>
	  <div><input type="button" id="connectPoints" value="Connect Points"/></div>
	  <xsl:for-each select="gdi:object">
	  	<jsObject type="gridImg" name="movable_object{position()-1}" data="{qw:convert-link(@data)}" height="{@height}" width="{@width}" x="{@x}" y="{@y}"/>
      </xsl:for-each>
	  <input type="hidden" name="qtiworks_response_RESPONSE"/> 
	  <input type="hidden" name="previousResponses" value="{$responseValues}"/>
	  <div id="jxgbox" class="jxgbox" height="{@gdi:height}" width="{@gdi:width}">
	  	<jsObject id="{@id}" type="grid" grid="{@gdi:grid}" bounds="{@gdi:bounds}" axis="{@gdi:axis}" snapTo="{@gdi:snapTo}" maxChoices="{@gdi:maxChoices}" yScaleSymbol="{@gdi:yScaleSymbol}"/>
		<script type="text/javascript">
	          $(document).ready(function() {
	            QtiWorksRendering.registerGeometryDrawingInteraction('<xsl:value-of select="@responseIdentifier"/>', {
                min: 5,
                max: 10
                });
	          });
	    </script>
      </div>
  </xsl:template>

</xsl:stylesheet>
