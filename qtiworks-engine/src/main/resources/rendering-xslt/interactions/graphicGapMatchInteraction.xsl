<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:qti="http://www.imsglobal.org/xsd/imsqti_v2p1"
  xmlns:qw="http://www.ph.ed.ac.uk/qtiworks"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="qti qw xs">

    <xsl:template match="qti:graphicGapMatchInteraction">
    <input name="qtiworks_presented_{@responseIdentifier}" type="hidden" value="1"/>
    <div class="{local-name()}">
      <xsl:if test="qti:prompt">
        <div class="prompt">
          <xsl:apply-templates select="qti:prompt"/>
        </div>
      </xsl:if>
      <!-- <xsl:if test="qw:is-invalid-response(@responseIdentifier)">
        <xsl:call-template name="qw:generic-bad-response-message"/>
      </xsl:if>-->

      <xsl:variable name="object" select="qti:object" as="element(qti:object)"/>
      <xsl:variable name="appletContainerId" select="concat('qtiworks_id_appletContainer_', @responseIdentifier)" as="xs:string"/>
      <xsl:variable name="gapImgs" select="qw:filter-visible(qti:gapImg)" as="element(qti:gapImg)*"/>
      <div id="{$appletContainerId}" class="appletContainer">
      	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"/>
      	<style>
			#canvasContainer {
				position: relative;
				height: 350px;
			}
			#myCanvas {
				position: absolute;
				left: 0;
				top: 0;
			}
			#theImage {
				position: relative;
				left: 0;
				top: 0;
			}
			.opt {
				position: relative;
			}
		</style>
		<div id="canvasContainer">
      		<img id="theImage" src="{qw:convert-link($object/@data)}"/>  
  			<canvas id="myCanvas"></canvas>
  			<div id="imgback">
  			<xsl:for-each select="$gapImgs">
      			<img draggable="true" class="opt" id='{@identifier}' src='{qw:convert-link(qti:object/@data)}'/>&#160;
        	</xsl:for-each>
        	</div>
  		</div>
  		
  		<!-- <input type="hidden" name="qtiworks_response_RESPONSE" id="qtiworks_response_RESPONSE"/>-->
  		<input type="hidden" id="previousResponses" name="previousResponses" value="{$responseValues}"/>
  		<script>
  			var hotspots = [];
			<xsl:variable name="hotspots" select="qw:filter-visible(qti:associableHotspot)" as="element(qti:associableHotspot)*"/>
          	<xsl:for-each select="$hotspots">
          		hotspots.push({identifier: '<xsl:value-of select="@identifier"/>', shape: '<xsl:value-of select="@shape"/>', coords: '<xsl:value-of select="@coords"/>', clicked: false});
  			</xsl:for-each>
  			var images = [];
  			<xsl:for-each select="$gapImgs">
  				images.push({identifier: '<xsl:value-of select="@identifier"/>', url: '<xsl:value-of select="qw:convert-link(qti:object/@data)"/>', selection: -1});
          	  	<!-- <param name="movable_object{position()-1}">
           	  		<xsl:attribute name="value"><xsl:value-of select="@identifier"/>::<xsl:value-of select="qw:convert-link(qti:object/@data)"/>::<xsl:if test="@label">::hotSpotLabel:<xsl:value-of select="@label"/></xsl:if><xsl:if test="@matchGroup">::<xsl:value-of select="translate(normalize-space(@matchGroup), ' ', '::')"/></xsl:if><xsl:if test="@matchMax">::maxAssociations:<xsl:value-of select="@matchMax"/></xsl:if></xsl:attribute>
           	  		
            	</param>-->
          	</xsl:for-each>
          
  		</script>
		<script src="{$webappContextPath}/rendering/javascript/gapmatch.js"/>
      </div>
    </div>
  </xsl:template>
</xsl:stylesheet>
