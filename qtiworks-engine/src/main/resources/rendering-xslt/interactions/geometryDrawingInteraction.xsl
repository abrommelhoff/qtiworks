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
	  <input type="checkbox" id="drawline"/>Draw a Line<br/>
	  <span id="linedirections">Click two points between which to draw a line</span>
	  <xsl:if test="exists(qti:object)">
		  <xsl:variable name="object" select="qti:object" as="element(qti:object)"/>
		  <jsObject type="gridImg" data="{qw:convert-link($object/@data)}" height="{$object/@height}" width="{$object/@width}"/>
	  </xsl:if>
	  <div id="jxgbox" class="jxgbox" height="{@gdi:height}" width="{@gdi:width}">
	  	<jsObject id="{@id}" type="grid" grid="{@gdi:grid}" bounds="{@gdi:bounds}" axis="{@gdi:axis}" snapTo="{@gdi:snapTo}" />
		<script type="text/javascript">
	          $(document).ready(function() {
	            QtiWorksRendering.registerGeometryDrawingInteraction();
	          });
	    </script>
      </div>
  </xsl:template>

</xsl:stylesheet>
