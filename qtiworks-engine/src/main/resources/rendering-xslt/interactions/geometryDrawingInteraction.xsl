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
  			<script src="//jsxgraph.uni-bayreuth.de/distrib/jsxgraphcore.js"/>
  		</head>
  	</html>
    <p/>
      <input name="qtiworks_presented_{@responseIdentifier}" type="hidden" value="1"/>
	  <input type="radio" name="drawingMode" id="plotPoint" value="plotPoint" checked="checked"/>Plot a Point<input type="radio" name="drawingMode" id="drawline" value="drawline"/><span class="lineText">Draw a &#160;&#160;&#160;&#160;&#160;</span><input type="radio" name="drawingMode" id="drawlineseg" value="drawlineseg"/><span class="lineSegmentText">Draw a &#160;&#160;&#160;&#160;&#160;</span><input type="radio" name="drawingMode" id="drawray" value="drawray"/><span class="rayText">Draw a &#160;&#160;&#160;&#160;&#160;</span><input type="radio" name="drawingMode" id="drawangle" value="drawangle"/>Draw an Angle<input type="radio" name="drawingMode" id="drawshape" value="drawshape"/>Draw a Shape<br/>
	  <input type="button" id="connectPoints" value="Connect Points"/>
	  <span id="linedirections">Click two points between which to draw a line</span>
	  <span id="linesegdirections">Click two points between which to draw a line</span>
	  <span id="raydirections">Click two points between which to draw a ray</span>
	  <span id="angledirections">Click three points by which to construct an angle</span>
	  <span id="shapedirections">Click any number points by which to construct an shape, then click Connect Points to draw the figure.</span>
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
