/// <reference types="@fibjs/types" />
import { FcgiResponse } from "./FcgiResponse";
import { FcgiClientApi } from "./consts";
/**
 * fastcgi-request
 */
export declare class FcgiClient implements FcgiClientApi {
    private sock;
    private root;
    private recv;
    private opts;
    private wait_connect;
    constructor(opts?: {
        url?: string;
        host?: string;
        port?: number;
        root?: string;
        autoReconnect?: boolean;
        serverParams?: any;
    });
    private newSock;
    private connect;
    private autoConnect;
    private waitReconn;
    private tryAutoConnect;
    /**
     * 关闭连接
     */
    close(): void;
    /**
     * 是否断开
     */
    isClosed(): boolean;
    /**
     * 转发http请求
     * @param req
     * @returns number 状态码0=成功
     */
    requestByHttp(req: Class_HttpRequest): number;
    /**
     * 模拟参数请求
     * @param path  php文件相对路径
     * @param query get参数数据kv或者kvstring
     * @param post  post原始参数
     * @param headers headers参数
     * @param addressInfo 客户端网络信息
     */
    requestByParams(path: string, query: string | {
        [index: string]: string | number;
    }, post?: Class_Buffer, headers?: {
        [index: string]: string;
    }, addressInfo?: {
        remoteAddress?: string;
        remotePort?: number;
        localAddress?: string;
        localPort?: number;
    }): FcgiResponse;
    /**
     * 发送cgi请求
     * @param cgiParams 组装的cgi参数
     * @param body post数据
     */
    requestByCgiParams(cgiParams: {
        [index: string]: string | number;
    }, body?: Class_Buffer): FcgiResponse;
    /**
     * 获取cgi运行参数
     */
    requestCgiVars(params?: {
        [index: string]: string;
    }): {
        [index: string]: number;
    };
    /**
     * test-connection
     */
    check(): boolean;
}
