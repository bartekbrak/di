<?php

/*
header("content-type: text/javascript");
*/
header("content-type: application/json");


require('passwords.php');
require ('mysqllogin.php');


function mylog($msg) {
    $fd = fopen("log", "a");
    fwrite($fd, $msg . "\n");
    fclose($fd);
}

function hid($string, $db)
{
    $query = sprintf("SELECT id FROM %s WHERE head='%s'", mysql_real_escape_string($db), mysql_real_escape_string($string));
    $result = mysql_query($query);
    if (!$result)
        die("<error>Database access failed: " . mysql_error() . "\n<br />on query:" . $query . "</error>");
    if ($row = mysql_fetch_array($result, MYSQL_NUM)) {
        return $row[0];
    } else {
        return false;
    }
}

function query($string, $db, $raw = false, $returnArray = Array())
{
    if (!mysql_query("SET NAMES 'utf8'"))
        die("db error on SET NAMES 'utf8':<br/>" . mysql_error() . "");

    $query = sprintf("SELECT id,head,definition FROM %s WHERE head='%s'", //@0
        mysql_real_escape_string($db), mysql_real_escape_string($string));
    //@1
    $result = mysql_query($query);
    if (!$result)
        die("Database access failed: " . mysql_error() . "\n<br />on query:" . $query . "");

    while ($row = mysql_fetch_array($result, MYSQL_NUM)) {
        if (!$raw) {
            $linkages = Array();
            preg_match_all("/\[\[(.*?)\]\]/", $row[2], $linkages);
            foreach ($linkages[1] as $linkedHead)
                $returnArray = query($linkedHead, $db, $returnArray);
            $row[2] = trim(preg_replace("/\[\[(.*?)\]\]/", "", $row[2]));
        }
        if (strlen($row[2]) > 0
        )
            $returnArray[] = Array('id' => $row[0], 'string' => $row[1], 'definition' => $row[2]);

    }
    return $returnArray;
}

if (isset($_GET['action']) &&  isset($_GET['db'])) {
    $obj = (object)null;
    switch ($_GET['action']) {
        case "query" :
            if (!(isset($_GET['string']))) break;
            $raw = (isset($_GET['raw'])) ? $_GET['raw'] : false;
            //data sanitazation
            $string = trim($_GET['string']);
            $db = trim($_GET['db']);
            $obj->definitions = query($string, $db, $raw);
            break;
        case "test_password":
            $obj->currentDbEditable =
                (isset($_GET['password']) && $_GET['password'] == $passwords[$_GET['db']])
                    ? True
                    : False;
            break;
        case "write":
            mb_internal_encoding("UTF-8");
            mb_internal_encoding("UTF-8");
            mb_http_output("UTF-8");
            mb_detect_order("auto");
            mb_substitute_character("none");
            mysql_set_charset("UTF-8");

            if (isset($_GET['string']) &&
                isset($_GET['definition']) &&
                isset($_GET['password'])
//                && $_GET['password'] == $passwords[$_GET['db']]
            ) {
                $definition = trim(strip_tags($_GET['definition'],'<br><b><i>'));
                $string = trim(strip_tags($_GET['string']));
                $db = $_GET['db'];
                $hid = hid($string, $db);
                $result = mysql_query("SET NAMES 'utf8'");

                if (!$result)
                    die("Database access failed: " . mysql_error() . "\n<br />on query: SET NAMES 'utf8'");

                if ($hid) {

                    $query = sprintf("UPDATE %s SET head='%s', definition='%s' WHERE id='%s'",
                        mysql_real_escape_string($db),
                        mysql_real_escape_string($string),
                        mysql_real_escape_string($definition),
                        mysql_real_escape_string($hid)
                    );
                    $result = mysql_query($query);
                    if (!$result)
                        die("Database access failed: " . mysql_error() . "\n<br />on query:" . $query);
                } else {
                    $query = sprintf("INSERT INTO %s(head,definition, id) VALUES('%s','%s', NULL)",
                        mysql_real_escape_string($db),
                        mysql_real_escape_string($string),
                        mysql_real_escape_string($definition)
                    );

                    $result = mysql_query($query);
                    if (!$result)
                        die("Database access failed: " . mysql_error() . "\n<br />on query:" . $query);

                    $hid = mysql_insert_id();
                }
                $obj->responseMessage = 'OK. Saved';
            }
            else $obj->responseMessage = 'error';
            break;
        default:
            break;
    }
    if (isset($_GET['callback']))
        echo $_GET['callback'] . '(' . json_encode($obj) . ');';
    else
        echo json_encode($obj);
}
?>
