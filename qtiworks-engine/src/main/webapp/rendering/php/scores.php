<?php

function getUsers($dbname)
{
	include 'DBInfo.php';
	mysql_connect($dbHost,$dbUser,$dbPass) or die("no connect");
	mysql_select_db($dbname);
//	$result = mysql_query("select distinct candidate_responses.identifier, candidate_events.timestamp, candidate_events.test_event_type, candidate_responses.time_on_task, candidate_responses.misconception_type, candidate_responses.misconception_value, candidate_responses.response_correctness, candidate_session_outcomes.string_value, deliveries.lti_consumer_key_token, deliveries.lti_consumer_secret, candidate_responses.response_feedback, group_concat(candidate_string_response_items.string_data) from lti_users join candidate_sessions on candidate_sessions.candidate_uid=lti_users.id join candidate_events on candidate_events.xid=candidate_sessions.xid join candidate_responses on candidate_responses.xeid=candidate_events.xeid join candidate_string_response_items on candidate_string_response_items.xrid=candidate_responses.xrid left outer join candidate_session_outcomes on (candidate_session_outcomes.xid=candidate_sessions.xid and candidate_session_outcomes.outcome_identifier=CONCAT('SCORE',candidate_responses.identifier)) join deliveries on deliveries.did=candidate_sessions.did where lti_user_id=".$_REQUEST["id"]." group by candidate_responses.identifier");
	$result = mysql_query("SELECT t1.* FROM (SELECT DISTINCT candidate_responses.identifier, candidate_events.timestamp, candidate_events.test_event_type, candidate_responses.time_on_task, candidate_responses.misconception_type, candidate_responses.misconception_value, candidate_responses.response_correctness, candidate_session_outcomes.string_value, deliveries.lti_consumer_key_token, deliveries.lti_consumer_secret, candidate_responses.response_feedback, GROUP_CONCAT(candidate_string_response_items.string_data order by candidate_string_response_items.string_data) FROM lti_users JOIN candidate_sessions ON candidate_sessions.candidate_uid=lti_users.id JOIN candidate_events ON candidate_events.xid=candidate_sessions.xid JOIN candidate_responses ON candidate_responses.xeid=candidate_events.xeid JOIN candidate_string_response_items ON candidate_string_response_items.xrid=candidate_responses.xrid LEFT OUTER JOIN candidate_session_outcomes ON (candidate_session_outcomes.xid=candidate_sessions.xid AND candidate_session_outcomes.outcome_identifier= CONCAT('SCORE',candidate_responses.identifier)) JOIN deliveries ON deliveries.did=candidate_sessions.did WHERE lti_user_id=".$_REQUEST["id"]." GROUP BY candidate_responses.identifier, candidate_events.timestamp ) t1 WHERE t1.timestamp = ( SELECT MAX(t2.timestamp) FROM ( SELECT DISTINCT candidate_responses.identifier, candidate_events.timestamp FROM lti_users JOIN candidate_sessions ON candidate_sessions.candidate_uid=lti_users.id JOIN candidate_events ON candidate_events.xid=candidate_sessions.xid JOIN candidate_responses ON candidate_responses.xeid=candidate_events.xeid WHERE lti_user_id=".$_REQUEST["id"]." GROUP BY candidate_responses.identifier, candidate_events.timestamp) t2 WHERE t2.identifier = t1.identifier)");
	if(mysql_num_rows($result) == 0) { 
		return false;
	} else {
		return $result;
	}
		
}

$xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
echo $xml;

$getResponse = getUsers('qtiworksprod');
if (!$getResponse) { 
	echo 'No scores returned';
} else {
	echo '<root>';
	while ($row = mysql_fetch_row($getResponse)) {
		echo '<response identifier="';
		echo str_replace(chr(34), '&#34;', $row[0]);
		echo '" timestamp="';
		echo $row[1];
		echo '" eventtype="';
		echo $row[2];
		echo '" timeontask="';
		echo $row[3];
		echo '" misconception_type="';
		echo $row[4];
		echo '" misconception_value="';
		echo $row[5];
		echo '" correctness="';
		echo $row[6];
		echo '" score="';
		echo $row[7];
		echo '" key="';
		echo $row[8];
		echo '" secret="';
		echo $row[9];
		echo '" feedback="';
		echo $row[10];
		echo '" stringvalue="';
		echo $row[11];
		echo '"/>';
	}
	echo '</root>';
}

?>
