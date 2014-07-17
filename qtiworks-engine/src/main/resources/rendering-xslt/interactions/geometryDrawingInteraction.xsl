<?xml version="1.0" encoding="UTF-8"?>

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
	  <input type="checkbox" id="drawline"/>Draw a Line<input type="checkbox" id="drawlineseg"/>Draw a Line Segment<input type="checkbox" id="drawray"/>Draw a Ray<input type="checkbox" id="drawangle"/>Draw an Angle<br/>
	  <span id="linedirections">Click two points between which to draw a line</span>
	  <span id="linesegdirections">Click two points between which to draw a line</span>
	  <span id="raydirections">Click two points between which to draw a ray</span>
	  <span id="angledirections">Click three points by which to construct an angle</span>
	  <xsl:if test="exists(qti:object)">
		  <xsl:variable name="object" select="qti:object" as="element(qti:object)"/>
		  <jsObject type="gridImg" data="{qw:convert-link($object/@data)}" height="{$object/@height}" width="{$object/@width}"/>
	  </xsl:if>
	  <input type="hidden" name="qtiworks_response_{@responseIdentifier}"/> 
	  <input type="hidden" name="previousResponses" value="{$responseValues}"/>
	  <div id="jxgbox" class="jxgbox" height="{@gdi:height}" width="{@gdi:width}">
	  	<jsObject id="{@id}" type="grid" grid="{@gdi:grid}" bounds="{@gdi:bounds}" axis="{@gdi:axis}" snapTo="{@gdi:snapTo}" />
		<script type="text/javascript">
	          $(document).ready(function() {
	            QtiWorksRendering.registerGeometryDrawingInteraction('<xsl:value-of
                select="@responseIdentifier"/>', {
                min: 5,
                max: 10
                });
	          });
	    </script>
      </div>
  </xsl:template>

</xsl:stylesheet>
