"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FcgiClient_1 = require("./FcgiClient");
let coroutine = require("coroutine");
const default_opts = { min: 1, max: 4, autoReconnect: true, host: "127.0.0.1", port: 9000 };
class FcgiClientPool {
    constructor(opts) {
        if (!opts) {
            opts = default_opts;
        }
        else {
            for (var k in default_opts) {
                if (opts[k] == undefined) {
                    opts[k] = default_opts[k];
                }
            }
        }
        this.cfg = opts;
        this.clients = [];
        this.num = 0;
        this.semaphore = new coroutine.Semaphore(opts.max);
    }
    borrowClient() {
        this.semaphore.acquire();
        if (this.clients.length > 0) {
            return this.clients.shift();
        }
        this.num++;
        try {
            return new FcgiClient_1.FcgiClient(this.cfg);
        }
        catch (e) {
            this.num--;
            throw e;
        }
    }
    returnClient(c) {
        this.clients.push(c);
        if (this.clients.length > this.cfg.min || this._closed) {
            this.num--;
            this.clients.shift().close();
        }
        this.semaphore.release();
    }
    close() {
        this._closed = true;
        this.cfg.min = -1;
        while (this.clients.length > 0) {
            this.num--;
            this.clients.shift().close();
            this.semaphore.release();
        }
    }
    isClosed() {
        return this._closed;
    }
    /**
     * 转发http请求
     * @param req
     * @returns number 状态码0=成功
     */
    requestByHttp(req) {
        var c = this.borrowClient();
        try {
            return c.requestByHttp(req);
        }
        finally {
            this.returnClient(c);
        }
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
        var c = this.borrowClient();
        try {
            return c.requestByParams(path, query, post, headers, addressInfo);
        }
        finally {
            this.returnClient(c);
        }
    }
    /**
     * 发送cgi请求
     * @param cgiParams 组装的cgi参数
     * @param body post数据
     */
    requestByCgiParams(cgiParams, body) {
        var c = this.borrowClient();
        try {
            return c.requestByCgiParams(cgiParams, body);
        }
        finally {
            this.returnClient(c);
        }
    }
    /**
     * 获取cgi运行参数
     */
    requestCgiVars(params = {
        FCGI_MAX_CONNS: '',
        FCGI_MAX_REQS: '',
        FCGI_MPXS_CONNS: ''
    }) {
        var c = this.borrowClient();
        try {
            return c.requestCgiVars(params);
        }
        finally {
            this.returnClient(c);
        }
    }
    //检测所有存活的client-活性
    check() {
        this.clients.forEach(e => e.check());
    }
}
exports.FcgiClientPool = FcgiClientPool;
