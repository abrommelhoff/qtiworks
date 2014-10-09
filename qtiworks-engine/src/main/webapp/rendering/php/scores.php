<?php

function getUsers($dbname)
{
	include 'DBInfo.php';
	mysql_connect($dbHost,$dbUser,$dbPass) or die("no connect");
	mysql_select_db($dbname);
	$result = mysql_query("select response_correctness, string_data, candidate_responses.xrid, xeid, misconception_type, misconception_value from candidate_responses left outer join candidate_string_response_items on candidate_string_response_items.xrid=candidate_responses.xrid;");
	if(mysql_num_rows($result) == 0) { 
		return false;
	} else {
		return $result;
	}
		
}

$xml = '<html><body>';
echo $xml;

$getResponse = getUsers('qtiworksdev');
if (!$getResponse) {
	echo 'No scores returned';
} else {
	echo '<table><tr><th>xrid</th><th>xeid</th><th>correctness</th><th>string response</th><th>misconception type</th><th>misconception value</th></tr>';
	while ($row = mysql_fetch_row($getResponse)) {
		echo '<tr><td>';
		echo $row[2];
		echo '</td><td>';
		echo $row[3];
		echo '</td><td>';
		echo $row[0];
		echo '</td><td>';
		echo $row[1];
		echo '</td><td>';
		echo $row[4];
		echo '</td><td>';
		echo $row[5];
		echo '</td></tr>';
	}
	echo '</table>';
}
echo '</body></html>';

?>
