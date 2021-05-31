"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcgiClient = void 0;
const consts_1 = require("./consts");
const path = require("path");
const coroutine = require("coroutine");
const net = require("net");
const util = require("util");
/**
 * fastcgi-request
 */
class FcgiClient {
    constructor(opts = {}) {
        this.opts = {
            host: opts.host || "127.0.0.1",
            port: opts.port || 9000,
            url: opts.url,
            autoReconnect: opts.autoReconnect,
            serverParams: opts.serverParams || {}
        };
        this.root = opts.root || path.fullpath(process.cwd() + '/php');
        this.wait_connect = new coroutine.Semaphore(1);
        this.autoConnect();
    }
    newSock() {
        if (this.opts.url && this.opts.url.length > 0) {
            return net.connect(this.opts.url);
        }
        let sock = new net.Socket(net.AF_INET);
        sock.connect(this.opts.host, this.opts.port);
        return sock;
    }
    connect() {
        let sock = this.newSock();
        if (this.sock) {
            consts_1.try_sock_close(this.sock);
        }
        this.recv = consts_1.recvMsgByFiber(sock);
        this.sock = sock;
        return sock;
    }
    autoConnect() {
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
            }
            catch (e) {
                coroutine.sleep(Math.ceil(Math.random() * 10));
                console.error(i + "-" + e.message);
            }
        }
        this.wait_connect.release();
        throw new Error("io_error:connect fcgi fail");
    }
    //如果在重连，等待其完成
    waitReconn() {
        if (this.wait_connect.acquire(false) == false) {
            this.wait_connect["_i_"] = 0;
            this.wait_connect.acquire();
        }
        this.wait_connect.release();
    }
    tryAutoConnect() {
        if (this.isClosed() && this.opts.autoReconnect) {
            this.autoConnect();
        }
    }
    /**
     * 关闭连接
     */
    close() {
        this.opts.autoReconnect = false;
        this.waitReconn(); //等待重连任务完成
        if (this.sock) {
            consts_1.try_sock_close(this.sock);
        }
        this.sock = null;
    }
    /**
     * 是否断开
     */
    isClosed() {
        return !this.sock || this.sock[consts_1.FLAG_PROPERTY_CLOSED] == true;
    }
    /**
     * 转发http请求
     * @param req
     * @returns number 状态码0=成功
     */
    requestByHttp(req) {
        this.tryAutoConnect();
        return consts_1.sendRequestByHttp(this.sock, consts_1.nextRequestId(), req, this.root, this.opts.serverParams);
    }
    /**
     * 模拟参数请求
     * @param path  php文件相对路径
     * @param query get参数数据kv或者kvstring
     * @param post  post原始参数
     * @param headers headers参数
     * @param addressInfo 客户端网络信息
     */
    requestByParams(path, query, post, headers, addressInfo) {
        this.tryAutoConnect();
        var query_str = query == null ? "" : (util.isString(query) ? query : consts_1.toQueryString(query)).toString();
        var opts = { path: path, root: this.root, query: query_str, headers: headers || {} };
        if (addressInfo) {
            for (var k in addressInfo) {
                opts[k] = addressInfo[k];
            }
        }
        var cgiParams = consts_1.newRequestParams(opts, post, this.opts.serverParams);
        return consts_1.sendRequest(this.sock, consts_1.nextRequestId(), cgiParams, post);
    }
    /**
     * 发送cgi请求
     * @param cgiParams 组装的cgi参数
     * @param body post数据
     */
    requestByCgiParams(cgiParams, body) {
        this.tryAutoConnect();
        cgiParams["DOCUMENT_ROOT"] = this.root;
        return consts_1.sendRequest(this.sock, consts_1.nextRequestId(), cgiParams, body);
    }
    /**
     * 获取cgi运行参数
     */
    requestCgiVars(params = {
        FCGI_MAX_CONNS: '',
        FCGI_MAX_REQS: '',
        FCGI_MPXS_CONNS: ''
    }) {
        this.tryAutoConnect();
        let rsp = consts_1.sendGetCgiVal(this.sock, params);
        let kv = consts_1.parseCgiKv(rsp.content);
        let ret = {};
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
    check() {
        try {
            this.requestCgiVars();
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
exports.FcgiClient = FcgiClient;
