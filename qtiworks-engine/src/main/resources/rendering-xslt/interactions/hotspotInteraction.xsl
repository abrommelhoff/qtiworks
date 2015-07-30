<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:qti="http://www.imsglobal.org/xsd/imsqti_v2p1"
  xmlns:qw="http://www.ph.ed.ac.uk/qtiworks"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="qti qw xs">

  <xsl:template match="qti:hotspotInteraction">
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
      <div id="{$appletContainerId}" class="appletContainer">
      	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"/>
      	<style>
			#myCanvas {
				position: absolute;
				left: 0;
				top: 0;
			}
			#theImage {
				left: 0;
				top: 0;
			}
			.appletContainer {
				position: relative;
			}
		</style>
      	<img id="theImage" src="{qw:convert-link($object/@data)}"/>
  		<canvas id="myCanvas"></canvas>
  		<!-- <input type="hidden" name="qtiworks_response_RESPONSE" id="qtiworks_response_RESPONSE"/>-->
  		<input type="hidden" id="previousResponses" name="previousResponses" value="{$responseValues}"/>
  		<script>
  			var maxResponses = <xsl:value-of select="@maxChoices"/>;
  			var hotspots = [];
			<xsl:for-each select="qti:hotspotChoice">
            	hotspots.push({identifier: '<xsl:value-of select="@identifier"/>', shape: '<xsl:value-of select="@shape"/>', coords: '<xsl:value-of select="@coords"/>', clicked: false});
  			</xsl:for-each>
  		</script>
		<script src="{$webappContextPath}/rendering/javascript/hotspot.js"/>
      </div>
    </div>
  </xsl:template>
</xsl:stylesheet>
