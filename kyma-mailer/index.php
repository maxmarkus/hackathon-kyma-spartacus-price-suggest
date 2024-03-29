<?php

function debug($value) {
    file_put_contents('log.txt', $value . PHP_EOL, FILE_APPEND | LOCK_EX);
}
   //change this to your email. 
   $data = $_REQUEST;
   if(!isset($data['hidden-secret'])) {
       debug('error, the hidden secret is not defined. not allowed.');
       die('you are not allowed to access this.');
   }

//    print_r($data);
//    die;
$from = "sender-email@nowhere.tld"; 

//end of message 
$headers  = "From: $from\r\n"; 
$headers .= "Content-type: text/html\r\n"; 

$content = <<<HEREDOC
<div style="padding: 10px">
<h1>Price reduced for ${data['code']}</h1>
Price for ${data['code']} has dropped.

<div style="margin-top: 10px; color: orange; font-size: 20px">
Your new price: ${data['price']} USD
</div>

<div style="margin-top: 10px">
<strong>
Product: ${data['name']}<br>
Manufacturer: ${data['manufacturer']}
SKU: ${data['code']} 
</strong>
</div>
${data['url']}

<div style="margin-top: 10px">
${data['description']}
</div>
</div>
HEREDOC;
// now lets send the email. 
$success = mail($data['email'], 'Price has been reduced', $content, $headers); 
debug(date("Y-m-d H:i:s") . ' : ' . $data['code'] . ' : '.$data['email'] . ' : sent: '. (string)$success);
if (!$success) {
    header("HTTP/1.1 400 Bad Request");
    echo 'error: ';
    echo error_get_last()['message'];
}
header("HTTP/1.1 200 OK");
echo 'sent';