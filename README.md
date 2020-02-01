# fibjs-fastcgi-client

A FastCGI client implementation in fibjs, mainly designed for cummunication with PHP.  
let idx=0;  
let fcgi = require("fibjs-fastcgi-client");  
var client = new fcgi.FcgiClient({host:"127.0.0.1",port:9000});  
var rsp=client.requestByParams("/hi.php","a=abc&i="+(idx++));  
console.log(rsp);  
client.close();


#use pool
let fcgi = require("fibjs-fastcgi-client");  
var client = new fcgi.FcgiClientPool({host:"127.0.0.1",port:9000,min:1,max:4});  
for(var i=0;i<100;i++){  
    require("coroutine).start(function(){  
      var rsp=client.requestByParams("/hi.php","a=abc&i="+(idx++));  
      console.log(rsp);
    });  
}  
