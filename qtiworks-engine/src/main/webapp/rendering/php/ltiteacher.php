<script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
<?php 
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set("display_errors", 1);
header('Content-Type: text/html; charset=utf-8');
session_start();
?>
<?php

  require_once("lti_util.php");

  $cur_url = curPageURL();
  $key = trim($_REQUEST["key"]);
  //$key = "3X1Kk1tThrVTQH8aLJSsaKnvGYbDHM4TXc";
  if ( ! $key ) $key = "3X1Kk1tThrVTQH8aLJSsaKnvGYbDHM4TXc";
  $secret = trim($_REQUEST["secret"]);
  //$secret = "dy65bjEFcpNCcGJt0kMb70iO2XgNnzoU";
  $userid = trim($_REQUEST["userid"]);
  if ( ! $secret ) $secret = "dy65bjEFcpNCcGJt0kMb70iO2XgNnzoU";
  $endpoint = "https://qtiworks.measuredprogress.org/qtiworks/lti/linklaunch";

//  $endpoint = trim($_REQUEST["endpoint"]);
  $b64 = base64_encode($key.":::".$secret);
  if ( ! $endpoint ) $endpoint = str_replace("lms.php","tool.php",$cur_url);
  $cssurl = str_replace("lms.php","lms.css",$cur_url);
  $returl = str_replace("lms.php","lms_return.php",$cur_url);

  $lmsdata = array(
    "resource_link_id" => "120988f929-274612",
    "resource_link_title" => "Weekly Blog",
    "resource_link_description" => "A weekly blog.",
    "user_id" => $userid,
    "roles" => "Instructor",  // or Learner
    "lis_person_name_full" => 'Jane Q. Public',
    "lis_person_name_family" => 'Public',
    "lis_person_name_given" => 'Given',
    "lis_person_contact_email_primary" => "user@school.edu",
    "lis_person_sourcedid" => "school.edu:user",
//    "lis_outcome_service_url" => "http://innoca01-nc-dv.measuredprogress.org/coordinator/Teachers/Result.aspx", 
    "context_id" => "456434513",
    "context_title" => "Design of Personal Environments",
    "context_label" => "SI182",
    "tool_consumer_info_product_family_code" => "ims",
    "tool_consumer_info_version" => "1.1",
    "tool_consumer_instance_guid" => "lmsng.school.edu",
    "tool_consumer_instance_description" => "University of School (LMSng)",
    'launch_presentation_locale' => 'en-US',
    'launch_presentation_document_target' => 'frame',
    'launch_presentation_width' => '',
    'launch_presentation_height' => ''
    );
  $lmsdata['launch_presentation_css_url'] = $cssurl;

  foreach ($lmsdata as $k => $val ) {
      if ( isset($_POST[$k]) ) {
          $lmsdata[$k] = $_POST[$k];
      }
  }

  $custom = '';
  if ( isset($_POST['custom']) ) {
      $custom = $_POST['custom'];
  }

  $outcomes = trim($_REQUEST["outcomes"]);
  if ( ! $outcomes ) {
      $outcomes = str_replace("lms.php","common/tool_consumer_outcome.php",$cur_url);
      $outcomes .= "?b64=" . htmlentities($b64);
  }

  $tool_consumer_instance_guid = $lmsdata['tool_consumer_instance_guid'];
  $tool_consumer_instance_description = $lmsdata['tool_consumer_instance_description'];

?>
<script language="javascript">
  //<![CDATA[
function lmsdataToggle() {
    var ele = document.getElementById("lmsDataForm");
    if(ele.style.display == "block") {
        ele.style.display = "none";
    }
    else {
        ele.style.display = "block";
    }
}
  //]]>
</script>

<?php
//  echo("<div id=\"lmsDataForm\" style=\"display:block\">\n");
//  echo("<form method=\"post\">\n");
//  echo("<input type=\"submit\" value=\"Recompute Launch Data\">\n");
//  echo("<input type=\"submit\" name=\"reset\" value=\"Reset\">\n");
//  echo("<fieldset><legend>LTI Resource</legend>\n");
  $disabled = '';
//  echo("Launch URL: <input size=\"60\" type=\"text\" $disabled size=\"60\" name=\"endpoint\" value=\"$endpoint\">\n");
//  echo("<br/>Key: <input type\"text\" name=\"key\" $disapbled size=\"60\" value=\"$key\">\n");
//  echo("<br/>Secret: <input type\"text\" name=\"secret\" $disabled size=\"60\" value=\"$secret\">\n");
//  echo("</fieldset><p>");
//  echo("<fieldset><legend>Launch Data</legend>\n");
  foreach ($lmsdata as $k => $val ) {
      $size = 20;
      if (strlen($val) > 15) {
        $size = 60;
      }
//      echo($k.": <input type=\"text\" name=\"".$k."\" value=\"");
 //     echo(htmlspecialchars($val));
 //     echo("\" size=\"{$size}\"><br/>\n");
  }
//  echo("Custom parameters: <textarea name=\"custom\" cols=\"80\" rows=\"4\">{$custom}</textarea>\n");
//  echo("</fieldset>\n");
//  echo("</form>\n");
//  echo("</div>\n");
//  echo("<hr>");

  $parms = $lmsdata;
  // Cleanup parms before we sign
  foreach( $parms as $k => $val ) {
    if (strlen(trim($parms[$k]) ) < 1 ) {
       unset($parms[$k]);
    }
  }

  // Add oauth_callback to be compliant with the 1.0A spec
  $parms["oauth_callback"] = "about:blank";
  if ( $outcomes ) {
    $parms["lis_outcome_service_url"] = $outcomes;
    $parms["lis_result_sourcedid"] = "feb-123-456-2929::28883";
  }

  $parms['launch_presentation_return_url'] = "https://coral.measuredprogress.org/coordinator/Teachers/Result.aspx";

  $custom = explode("\n", $custom);
  foreach ($custom as $line) {
      $line = trim($line);
      if (strlen($line) > 0) {
          $entry = explode('=', $line, 2);
          $name = strtolower($entry[0]);
          $name = preg_replace('/[^a-z0-9]/', '_', $name);
          $value = '';
          if (count($entry) > 1) {
              $value = $entry[1];
          }
          $parms["custom_{$name}"] = $value;
      }
  }

  $parms = signParameters($parms, $endpoint, "POST", $key, $secret, $tool_consumer_instance_guid, $tool_consumer_instance_description);
  $content = postLaunchHTML($parms, $endpoint, "Press to Launch", false,"width=\"100%\" height=\"95%\" scrolling=\"auto\" frameborder=\"1\" transparency");
  print($content);

?>

<script>
$(document).ready(function(){
   $("#ltiLaunchForm").submit();
});
</script>
<style>
body {
	height: 100%
}
<!--[if IE 9]>
body {
  height: 95%;
}
html {
  height: 100%;
}
<![endif]-->
</style>
