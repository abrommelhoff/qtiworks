<?php

function getUsers($dbname)
{
	include 'DBInfo.php';
	mysql_connect($dbHost,$dbUser,$dbPass) or die("no connect");
	mysql_select_db($dbname);
	$result = mysql_query("select candidate_responses.identifier, candidate_events.timestamp, candidate_responses.time_on_task, candidate_responses.misconception_type, candidate_responses.misconception_value, candidate_responses.response_correctness, candidate_string_response_items.string_data, candidate_session_outcomes.string_value from candidate_sessions join candidate_events on candidate_events.xid=candidate_sessions.xid join candidate_responses on candidate_responses.xeid=candidate_events.xeid join candidate_string_response_items on candidate_string_response_items.xrid=candidate_responses.xrid left outer join candidate_session_outcomes on candidate_session_outcomes.xid=candidate_sessions.xid join deliveries on deliveries.did=candidate_sessions.did where candidate_responses.identifier='".$_REQUEST["identifier"]."' and candidate_session_outcomes.outcome_identifier='SCORE' order by timestamp desc");
	if(mysql_num_rows($result) == 0) { 
		return false;
	} else {
		return $result;
	}
		
}

$getResponse = getUsers('qtiworksprod');
if (!$getResponse) { 
	echo 'No scores returned';
} else {
	echo '<table><tr><td>identifier</td><td>score</td><td>timestamp</td><td>timeontask</td><td>misconception type</td><td>misconception value</td><td>correctness</td><td>string response</td></tr>';
	while ($row = mysql_fetch_row($getResponse)) {
		echo '<tr><td>';
		echo $row[0];
		echo '</td><td>';
		echo $row[7];
		echo '</td><td>';
		echo $row[1];
		echo '</td><td>';
		echo $row[2];
		echo '</td><td>';
		echo $row[3];
		echo '</td><td>';
		echo $row[4];
		echo '</td><td>';
		echo $row[5];
		echo '</td><td>';
		echo $row[6];
		echo '</td><tr>';
	}
	echo '</table>';
} 

?>
