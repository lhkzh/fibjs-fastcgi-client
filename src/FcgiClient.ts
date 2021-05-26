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
import {FcgiClientApi, FcgiRequestOpts} from "./consts";
import * as path from "path";
import * as coroutine from "coroutine";
import * as net from "net";
import * as util from "util";

/**
 * fastcgi-request
 */
export class FcgiClient implements FcgiClientApi {
    private sock: Class_Socket;
    private root: string;
    private recv: Class_Fiber;
    private opts: { url?: string, host?: string, port?: number, autoReconnect: boolean, serverParams?: any };
    private wait_connect: Class_Semaphore;

    constructor(opts: { url?: string, host?: string, port?: number, root?: string, autoReconnect?: boolean, serverParams?: any } = {}) {
        this.opts = {
            host: opts.host || "127.0.0.1",
            port: opts.port || 9000,
            url: opts.url,
            autoReconnect: opts.autoReconnect,
            serverParams: opts.serverParams || {}
        };
        this.root = opts.root || path.fullpath(process.cwd() + '/php');
        this.wait_connect = new coroutine.Semaphore(1);
        this.autoConnect()
    }

    private newSock(): Class_Socket {
        if (this.opts.url && this.opts.url.length > 0) {
            return <any>net.connect(this.opts.url);
        }
        let sock = new net.Socket(net.AF_INET, net.SOCK_STREAM);
        sock.connect(this.opts.host, this.opts.port);
        return sock;
    }

    private connect() {
        let sock = this.newSock();
        if (this.sock) {
            try_sock_close(this.sock);
        }
        this.recv = recvMsgByFiber(sock);
        this.sock = sock;
        return sock;
    }

    private autoConnect() {
        if (this.wait_connect.acquire(false) == false) {
            this.wait_connect.acquire();
            if (this.isClosed()) {
                this.wait_connect.release();
                throw new Error("io_error:connect fcgi fail");
            }
        }
        let i = this.wait_connect["_i_"] = 60;
        while (i > 0) {
            i--;
            try {
                this.connect();
                this.wait_connect.release();
                return true;
            } catch (e) {
                coroutine.sleep(Math.ceil(Math.random() * 10));
                console.error(i + "-" + e.message)
            }
        }
        this.wait_connect.release();
        throw new Error("io_error:connect fcgi fail");
    }

    //如果在重连，等待其完成
    private waitReconn() {
        if (this.wait_connect.acquire(false) == false) {
            this.wait_connect["_i_"] = 0;
            this.wait_connect.acquire();
        }
        this.wait_connect.release();
    }

    private tryAutoConnect() {
        if (this.isClosed() && this.opts.autoReconnect) {
            this.autoConnect();
        }
    }

    /**
     * 关闭连接
     */
    public close() {
        this.opts.autoReconnect = false;
        this.waitReconn();//等待重连任务完成
        if (this.sock) {
            try_sock_close(this.sock);
        }
        this.sock = null;
    }

    /**
     * 是否断开
     */
    public isClosed(): boolean {
        return !this.sock || this.sock[FLAG_PROPERTY_CLOSED] == true;
    }

    /**
     * 转发http请求
     * @param req
     * @returns number 状态码0=成功
     */
    public requestByHttp(req: Class_HttpRequest): number {
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
    public requestByParams(path: string, query: string | { [index: string]: string | number }, post?: Class_Buffer, headers?: { [index: string]: string }, addressInfo?: { remoteAddress?: string, remotePort?: number, localAddress?: string, localPort?: number }): FcgiResponse {
        this.tryAutoConnect();
        var query_str = query == null ? "" : (util.isString(query) ? query : toQueryString(query)).toString();
        var opts: FcgiRequestOpts = {path: path, root: this.root, query: query_str, headers: headers || {}};
        if (addressInfo) {
            for (var k in addressInfo) {
                opts[k] = addressInfo[k];
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
    public requestByCgiParams(cgiParams: { [index: string]: string | number }, body?: Class_Buffer): FcgiResponse {
        this.tryAutoConnect();
        cgiParams["DOCUMENT_ROOT"] = this.root;
        return sendRequest(this.sock, nextRequestId(), cgiParams, body);
    }

    /**
     * 获取cgi运行参数
     */
    public requestCgiVars(params: { [index: string]: string } = {
        FCGI_MAX_CONNS: '',
        FCGI_MAX_REQS: '',
        FCGI_MPXS_CONNS: ''
    }) {
        this.tryAutoConnect();
        let rsp = sendGetCgiVal(this.sock, params);
        let kv = parseCgiKv(rsp.content);
        let ret: { [index: string]: number } = {};
        for (var k in kv) {
            if (!isNaN(parseInt(kv[k]))) {
                ret[k.replace("FCGI_", "")] = parseInt(kv[k]);
            }
        }
        return ret;
    }

    /**
     * test-connection
     */
    public check() {
        try {
            this.requestCgiVars()
            return true;
        } catch (e) {
            return false;
        }
    }
}