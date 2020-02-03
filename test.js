// var Socket=require("net").Socket;
// var consts=require("./dist/consts");
// var sock = new Socket();
// sock.connect("127.0.0.1",9123);
// consts.recvMsgByFiber(sock);
// var params = consts.newRequestParams({path:"/hi.php",query:"a=b&c=123"});
// var rsp=consts.sendRequest(sock,1,params);
// console.log(rsp)
// console.log(rsp.content.toString())
// var split_idx = rsp.out.indexOf('\r\n\r\n');
// var headers = rsp.out.slice(0,split_idx);
// var body = rsp.out.slice(split_idx+4);
// console.log(headers.toString());
// console.log(body.toString());
// while(true){
//     var part = consts.recvMsgPart(sock);
//     console.log(part.id,part.type,part.body?part.body.toString():"")
// }
var idx=0;
var fcgi=require("./dist/index");
var coroutine=require("coroutine");
// var client = new fcgi.FcgiClient({host:"127.0.0.1",port:9123});
// var client = new fcgi.FcgiClient({host:"127.0.0.1",port:9000,root:"/mnt/e/workplace/fib_fcgi/php"});
// var pst=[];for(var i=0;i<25535;i++){pst.push(i+"=1")};pst=Buffer.from(pst.join("&"))
// var rsp=client.requestByParams("/hi.php","a=abc&i="+(idx++),pst);
// console.log(rsp.requestId,rsp.protocolStatus,rsp.appStatus,rsp.content.length,/*rsp.content.toString()*/);
// console.log(client.requestCgiVars());

// var client = new fcgi.FcgiClientPool({host:"127.0.0.1",port:9000,root:"/mnt/e/workplace/fib_fcgi/php"});
var client = new fcgi.FcgiClientPool({host:"127.0.0.1",port:9123,root:"E:/workplace/fib_fcgi/php"});

for(var i=0;i<100;i++){
    coroutine.start(function () {
        // root:"/mnt/e/workplace/fib_fcgi/php"

        var t=i;
        var rsp=client.requestByParams("/hi.php","a=abc&i="+(idx++));
        console.log(rsp.requestId,rsp.protocolStatus,rsp.appStatus,rsp.content.toString());
        // console.log(client.requestByParams("/hi.php","a=abc&i="+(idx++)).requestId);
    })
}

