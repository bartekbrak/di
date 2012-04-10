<?php
$db_hostname = 'mysql3.ugu.pl';
$db_database = 'db204796';
$db_username = 'db204796';
$db_password = 'polska2106';

// $db_hostname = 'localhost';
// $db_username = 'root';
// $db_password = '5';

$db_server = mysql_connect($db_hostname, $db_username, $db_password);
if (!$db_server) die("Unable to connect to MySQL: " . mysql_error());

mysql_select_db($db_database)
or die("Unable to select database: " . mysql_error());

?>
