<?xml version="1.0" encoding="UTF-8"?>
<!--

Renders a terminated assessment

Input document: doesn't matter

-->
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:qw="http://www.ph.ed.ac.uk/qtiworks"
  xmlns="http://www.w3.org/1999/xhtml"
  xpath-default-namespace="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="xs qw">

  <!-- ************************************************************ -->

  <xsl:import href="qti-common.xsl"/>

  <!-- Optional URL for exiting session -->
  <xsl:param name="exitSessionUrl" as="xs:string?" required="no"/>

  <!-- ************************************************************ -->

  <xsl:template match="/" as="element(html)">
    <html lang="en">
      <head>
        <title>Assessment Completed</title>
        <link rel="stylesheet" href="{$webappContextPath}/rendering/css/assessment.css" type="text/css" media="screen"/>
        <script type="text/javascript">
          	<![CDATA[
            	var fs = new RegExp("%2F", "g");
            	var colon = new RegExp("%3A;", "g");
            	var amp = new RegExp("&amp;", "g");
            	function doRedirect(URI){
            	window.location.replace(URI.replace(fs, "/").replace(colon, ":").replace(amp, "&"));
            	};
          	]]>
        </script>
      </head>
      <xsl:if test="exists($exitSessionUrlAbsolute)">
      <body class="qtiworks" onload="doRedirect('{$exitSessionUrlAbsolute}'); return true;">      
        <p>
          You have finished the test, but your answers are not yet submitted. Click the link below to submit your answers.
        </p>
          <p>
            <a href="{$exitSessionUrlAbsolute}">Submit answers</a>
          </p>
      </body>
      </xsl:if>
      <xsl:if test="not(exists($exitSessionUrlAbsolute))">
      <body class="qtiworks">      
        <p>
          You have finished the test, but your answers are not yet submitted. Click the link below to submit your answers.
        </p>
      </body>
      </xsl:if>
    </html>
  </xsl:template>

</xsl:stylesheet>
