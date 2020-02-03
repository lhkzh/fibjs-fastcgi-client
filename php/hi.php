<?php  usleep(mt_rand(1,100));
date_default_timezone_set('Asia/Shanghai');
$_REQUEST["t"]=time();
/*for($i=0;$i<65535;$i++){
    $_REQUEST["z".$i]=$i;
}*/
echo json_encode($_REQUEST);
echo file_get_contents("php://input");
$s = date("Y-m-d H:i:s")." -- ";
foreach($_REQUEST as $k=>$v){
    $s.="  ".$k."=".json_encode($v).PHP_EOL;
}
file_put_contents("hi.log",date("Y-m-d H:i:s")." -- ".$s.PHP_EOL, FILE_APPEND);
