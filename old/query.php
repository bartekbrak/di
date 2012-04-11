<?php
require('passwords.php');


require ('mysqllogin.php');
$html_head = <<<HTML
<html><head><meta name="msvalidate.01" content="439CF34A854840C5CD67182767A78334" /></head><body><di>
HTML;
echo $html_head;

function mylog($msg) {
    $fd = fopen("log", "a");
    fwrite($fd, $msg . "\n");
    fclose($fd);
}

function hid($head, $db) {
    $query = sprintf("SELECT id FROM %s WHERE head='%s'", mysql_real_escape_string($db), mysql_real_escape_string($head));
    mylog($query);
    $result = mysql_query($query);
    if (!$result)
        die("<error>Database access failed: " . mysql_error() . "\n<br />on query:" . $query . "</error>");
    if ($row = mysql_fetch_array($result, MYSQL_NUM)) {
        return $row[0];
    } else {
        return false;
    }
}

function query($head, $db, $raw = false) {

    if (!mysql_query("SET NAMES 'utf8'"))
        die("<error>db error on SET NAMES 'utf8':<br/>" . mysql_error() . "</error>");

    $query = sprintf("SELECT id,head,definition FROM %s WHERE head='%s'",//@0
        mysql_real_escape_string($db),
        mysql_real_escape_string($head)
        ); //@1
    $result = mysql_query($query);
    if (!$result)
        die("<error>Database access failed: " . mysql_error() . "\n<br />on query:" . $query . "</error>");
    while ($row = mysql_fetch_array($result, MYSQL_NUM)) {
        if (!$raw) {
            $linkages = Array();
            preg_match_all("/\[\[(.*?)\]\]/", $row[2], $linkages);
            foreach ($linkages[1] as $linkedHead)
                query($linkedHead, $db);
            $row[2] = trim(preg_replace("/\[\[(.*?)\]\]/", "", $row[2]));
        }
        if (strlen($row[2]) > 0)
            printf("<row><hid>%s</hid><head>%s</head><definition>%s</definition></row>", $row[0], $row[1], $row[2]);

        // echo "<message>whatever debug message</message>";
    }

}

switch ($_REQUEST['action']) {
    case "query" :
        $raw = (isset($_REQUEST['raw'])) ? $_REQUEST['raw'] : false;
        query(trim($_REQUEST['s']), $_REQUEST['db'], $raw);
        break;

    case "write" :
    /*
     Entry Data Format:
     action=write;
     db=$db;
     head;
     id; if modyfing, no id if new word
     definition;
     */

    // mylog($_REQUEST['definition'] . "\n");
        mb_internal_encoding("UTF-8");
        mb_internal_encoding("UTF-8");
        mb_http_output("UTF-8");
        mb_detect_order("auto");
        mb_substitute_character("none");
        mysql_set_charset("UTF-8");

        if (isset($_REQUEST['db']) && //@0
            isset($_REQUEST['head']) && 
            isset($_REQUEST['definition']) &&
            isset($_REQUEST['password']) &&  
            $_REQUEST['password'] == $passwords[$_REQUEST['db']] //@1
            ) {
            $definition = urldecode(trim(strip_tags($_REQUEST['definition'])));
            $head = urldecode(trim(strip_tags($_REQUEST['head'])));
            $db = $_REQUEST['db'];
            $hid = hid($head, $db);
            $result = mysql_query("SET NAMES 'utf8'");
            
            if (!$result)
                die("Database access failed: " . mysql_error() . "\n<br />on query: SET NAMES 'utf8'");

            if ($hid) {

                $query = sprintf("UPDATE %s SET head='%s', definition='%s' WHERE id='%s'", //@0
                    mysql_real_escape_string($db),
                    mysql_real_escape_string($head), 
                    mysql_real_escape_string($definition), 
                    mysql_real_escape_string($hid)
                    );
                $result = mysql_query($query);
                if (!$result)
                    die("Database access failed: " . mysql_error() . "\n<br />on query:" . $query);
            } else {
                $query = sprintf("INSERT INTO %s(head,definition, id) VALUES('%s','%s', NULL)", 
                    mysql_real_escape_string($db), 
                    mysql_real_escape_string($head), 
                    mysql_real_escape_string($definition)
                    ); //@1

                $result = mysql_query($query);
                if (!$result)
                    die("Database access failed: " . mysql_error() . "\n<br />on query:" . $query);

                $hid = mysql_insert_id();
            }
            printf("<mesage>OK. Saved.</message>");
        } else printf("<mesage>error</message>");
        break;
    case "test_password":
        if (isset($_REQUEST['db']) && //@0
            isset($_REQUEST['password']) &&  
            $_REQUEST['password'] == $passwords[$_REQUEST['db']]//@1
                ) echo "<passwordcorrect>1</passwordcorrect>";
        else echo "<passwordcorrect>0</passwordcorrect>";
        break;
    case "list_tables" :
        $query = sprintf("SHOW TABLES");
        $result = mysql_query($query);
        
        if (!$result)
            die("Database access failed: " . mysql_error() . "\n<br />on query:" . $query);
        
        while ($row = mysql_fetch_array($result, MYSQL_NUM)) {
            printf("<ditable>%s</ditable>", $row[0]);
        }

        break;
    default :
        echo "no valid <b>action</b> argument provided";
        break;
}
mysql_close($db_server);
echo "</di></body></html>";
?>