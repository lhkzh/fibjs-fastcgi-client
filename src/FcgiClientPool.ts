import {FcgiClient} from "./FcgiClient";
import {FcgiResponse} from "./FcgiResponse";
import {FcgiClientApi} from "../@types";

let coroutine = require("coroutine");
const default_opts = {min: 1, max: 4, autoReconnect: true, host: "127.0.0.1", port: 9000};

export class FcgiClientPool implements FcgiClientApi {
    private clients: FcgiClient[];
    private cfg: { host?: string, port?: number, root?: string, autoReconnect?: boolean, min?: number, max?: number, serverParams?: any };
    private _closed: boolean;
    private num: number;
    private semaphore: Class_Semaphore;

    constructor(opts?: { host?: string, port?: number, root?: string, autoReconnect?: boolean, min?: number, max?: number, serverParams?: any }) {
        if (!opts) {
            opts = default_opts;
        } else {
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

    private borrowClient(): FcgiClient {
        this.semaphore.acquire();
        if (this.clients.length > 0) {
            return this.clients.shift();
        }
        this.num++;
        try {
            return new FcgiClient(this.cfg);
        } catch (e) {
            this.num--;
            this.semaphore.release();
            throw e;
        }
    }

    private returnClient(c: FcgiClient, fail: boolean) {
        if(fail){
            this.num--;
            c.close();
        }else{
            this.clients.push(c);
            if (this.clients.length > this.cfg.min || this._closed) {
                this.num--;
                this.clients.shift().close();
            }
        }
        this.semaphore.release();
    }

    public close() {
        this._closed = true;
        this.cfg.min = -1;
        while (this.clients.length > 0) {
            this.num--;
            this.clients.shift().close();
            this.semaphore.release();
        }
    }

    public isClosed(): boolean {
        return this._closed;
    }

    /**
     * 转发http请求
     * @param req
     * @returns number 状态码0=成功
     */
    public requestByHttp(req: Class_HttpRequest): number {
        var c = this.borrowClient(), fail:boolean;
        try {
            return c.requestByHttp(req);
        } catch (e) {
            fail = true;
        } finally {
            this.returnClient(c, fail);
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
    public requestByParams(path: string, query: string | { [index: string]: string | number }, post?: Class_Buffer, headers?: { [index: string]: string }, addressInfo?: { remoteAddress?: string, remotePort?: number, localAddress?: string, localPort?: number }): FcgiResponse {
        var c = this.borrowClient(), fail:boolean;
        try {
            return c.requestByParams(path, query, post, headers, addressInfo);
        } catch (e) {
            fail = true;
        } finally {
            this.returnClient(c, fail);
        }
    }

    /**
     * 发送cgi请求
     * @param cgiParams 组装的cgi参数
     * @param body post数据
     */
    public requestByCgiParams(cgiParams: { [index: string]: string | number }, body?: Class_Buffer): FcgiResponse {
        var c = this.borrowClient(), fail:boolean;
        try {
            return c.requestByCgiParams(cgiParams, body);
        } catch (e) {
            fail = true;
        } finally {
            this.returnClient(c, fail);
        }
    }

    /**
     * 获取cgi运行参数
     */
    public requestCgiVars(params: { [index: string]: string } = {
        FCGI_MAX_CONNS: '',
        FCGI_MAX_REQS: '',
        FCGI_MPXS_CONNS: ''
    }) {
        var c = this.borrowClient(), fail:boolean;
        try {
            return c.requestCgiVars(params);
        } catch (e) {
            fail = true;
        } finally {
            this.returnClient(c, fail);
        }
    }

    //检测所有存活的client-活性
    public check() {
        this.clients.forEach(e => e.check());
    }

    public stat(){
        return {num:this.num, idel:this.clients.length};
    }
}