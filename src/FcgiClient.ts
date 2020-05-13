import {
    FLAG_PROPERTY_CLOSED,
    newRequestParams,
    nextRequestId, parseCgiKv,
    recvMsgByFiber, sendGetCgiVal,
    sendRequest,
    sendRequestByHttp,
    toQueryString, try_sock_close
} from "./consts";
import {FcgiResponse} from "./FcgiResponse";
import {FcgiClientApi, FcgiRequestOpts} from "../@types";

let net=require("net");
let path=require("path");
let util=require("util");
let coroutine=require("coroutine");
/**
 * fastcgi-request
 */
export class FcgiClient implements FcgiClientApi{
    private sock:Class_Socket;
    private root:string;
    private recv:Class_Fiber;
    private opts:{host:string,port:number,autoReconnect:boolean, serverParams?:any};
    private wait_connect:Class_Event;
    private is_reConnectIng:boolean;
    constructor(opts:{host?:string,port?:number,root?:string,autoReconnect?:boolean, serverParams?:any}={}){
        this.opts={host:opts.host||"127.0.0.1",port:opts.port||9000,autoReconnect:opts.autoReconnect,serverParams:opts.serverParams||{}};
        this.root=opts.root||path.fullpath(process.cwd()+'/php');
        this.wait_connect = new coroutine.Event(false);
        this.autoConnect()
    }
    private connect(){
        let sock=new net.Socket();
        sock.connect(this.opts.host,this.opts.port);
        if(this.sock){
            try_sock_close(this.sock);
        }
        this.recv=recvMsgByFiber(sock);
        this.sock=sock;
        this.wait_connect.set();
        return sock;
    }
    private autoConnect(){
        if(this.is_reConnectIng){
            this.wait_connect.wait();//等待重连
            if(this.isClosed()){
                throw new Error("io_error:connect fcgi fail");
            }
        }
        this.wait_connect.clear();
        this.is_reConnectIng=true;
        var i=999;
        while(i>0){
            i--;
            try{
                this.connect();
                return true;
            }catch (e) {
                coroutine.sleep(Math.ceil(Math.random()*100));
            }
        }
        this.wait_connect.set();
        throw new Error("io_error:connect fcgi fail");
    }
    private tryAutoConnect(){
        if(this.isClosed() && this.opts.autoReconnect){
            this.autoConnect();
        }
    }
    /**
     * 关闭连接
     */
    public close(){
        this.opts.autoReconnect=false;
        try{
            if(this.is_reConnectIng){
                this.wait_connect.wait();//等待重连
            }
        }catch (e) {
        }
        if(this.sock){
            try_sock_close(this.sock);
        }
        this.sock=null;
    }
    /**
     * 是否断开
     */
    public isClosed():boolean{
        return !this.sock || this.sock[FLAG_PROPERTY_CLOSED]==true;
    }
    /**
     * 转发http请求
     * @param req
     * @returns number 状态码0=成功
     */
    public requestByHttp(req:Class_HttpRequest):number{
        this.tryAutoConnect();
        return sendRequestByHttp(this.sock, nextRequestId(), req, this.root, this.opts.serverParams);
    }

    /**
     * 模拟参数请求
     * @param path  php文件相对路径
     * @param query get参数数据kv或者kvstring
     * @param post  post原始参数
     * @param headers headers参数
     * @param addressInfo 客户端网络信息
     */
    public requestByParams(path:string, query:string|{[index:string]:string|number}, post?:Class_Buffer, headers?:{[index:string]:string}, addressInfo?:{remoteAddress?:string,remotePort?:number,localAddress?:string,localPort?:number}):FcgiResponse{
        this.tryAutoConnect();
        var query_str = query==null?"":(util.isString(query)?query:toQueryString(query)).toString();
        var opts:FcgiRequestOpts = {path:path,root:this.root, query:query_str, headers:headers||{}};
        if(addressInfo){
            for(var k in addressInfo){
                opts[k]=addressInfo[k];
            }
        }
        var cgiParams = newRequestParams(opts, post, this.opts.serverParams);
        return sendRequest(this.sock, nextRequestId(), cgiParams, post);
    }

    /**
     * 发送cgi请求
     * @param cgiParams 组装的cgi参数
     * @param body post数据
     */
    public requestByCgiParams(cgiParams:{[index:string]:string|number}, body?:Class_Buffer):FcgiResponse{
        this.tryAutoConnect();
        cgiParams["DOCUMENT_ROOT"]=this.root;
        return sendRequest(this.sock, nextRequestId(), cgiParams, body);
    }

    /**
     * 获取cgi运行参数
     */
    public requestCgiVars(params:{[index:string]:string}){
        this.tryAutoConnect();
        params = params?params:{FCGI_MAX_CONNS: '',FCGI_MAX_REQS: '',FCGI_MPXS_CONNS: '',};
        let rsp = sendGetCgiVal(this.sock, params);
        let kv = parseCgiKv(rsp.content);
        let ret:{[index:string]:number}={};
        for(var k in kv){
            if(!isNaN(parseInt(kv[k]))){
                ret[k.replace("FCGI_","")]=parseInt(kv[k]);
            }
        }
        return ret;
    }
}