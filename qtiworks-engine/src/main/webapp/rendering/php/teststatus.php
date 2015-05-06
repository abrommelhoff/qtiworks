<?php

function getStatus($dbname)
{
	include 'DBInfo.php';
	mysql_connect($dbHost,$dbUser,$dbPass) or die("no connect");
	mysql_select_db($dbname); 
	$result = mysql_query("select candidate_events.timestamp, candidate_events.test_event_type, deliveries.lti_consumer_key_token, deliveries.lti_consumer_secret from lti_users join candidate_sessions on candidate_sessions.candidate_uid=lti_users.id join candidate_events on candidate_events.xid=candidate_sessions.xid left outer join candidate_session_outcomes on candidate_session_outcomes.xid=candidate_sessions.xid join deliveries on deliveries.did=candidate_sessions.did where lti_user_id=".$_REQUEST["id"]);
	if(mysql_num_rows($result) == 0) { 
		return false;
	} else {
		return $result;
	}
		
}

$xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
echo $xml;

$getResponse = getStatus('qtiworksprod'); 
if (!$getResponse) { 
	echo 'No scores returned';
} else {
	echo '<root>';
	while ($row = mysql_fetch_row($getResponse)) {
		echo '<response timestamp="';
		echo $row[0];
		echo '" eventtype="';
		echo $row[1];
		echo '" key="';
		echo $row[2];
		echo '" secret="';
		echo $row[3];
		echo '"/>';
	}
	echo '</root>';
}

?>
