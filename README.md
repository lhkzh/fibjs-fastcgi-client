# fibjs-fastcgi-client

A FastCGI client implementation in fibjs, mainly designed for cummunication with PHP.  

let fcgi = require("fibjs-fastcgi-client");  
var client = new fcgi.FcgiClient({host:"127.0.0.1",port:9000});  
var rsp=client.requestByParams("/hi.php","a=abc&i="+(idx++));  
console.log(rsp);

