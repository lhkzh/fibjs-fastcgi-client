/// <reference types="@fibjs/types" />
import { FcgiResponse } from "./FcgiResponse";
export declare const EMPTY_BUF: Class_Buffer;
export declare const FLAG_PROPERTY_CLOSED = "$@closed";
export declare function toQueryString(d: any): any;
export declare function parseCgiKv(msgData: Class_Buffer): {};
export declare function newRequestParams(opts: FcgiRequestOpts, data?: Class_Buffer, serverParamss?: any): {
    [index: string]: string;
};
export declare function sendRequest(socket: Class_Socket, requestId: number, params: {
    [index: string]: string | number;
}, body: Class_Buffer, version?: number): FcgiResponse;
export declare function sendRequestByHttp(socket: Class_Socket, requestId: number, req: Class_HttpRequest, cgiRoot?: string, serverParamss?: any, version?: number): 0 | 500;
export declare function sendGetCgiVal(socket: Class_Socket, params: {
    [index: string]: any;
}, version?: number): any;
export declare function try_sock_close(socket: Class_Socket, err?: string): void;
export declare function recvMsgPart(socket: Class_Socket): {
    id: number;
    type: number;
    body: Class_Buffer;
    version: number;
    reserved: boolean;
};
export declare function recvMsgByFiber(sock: Class_Socket): any;
export declare function nextRequestId(): number;
/**
 * 协议状态
 */
export declare enum ProtocolStatus {
    REQUEST_COMPLETE = 0,
    CANT_MPX_CONN = 1,
    OVERLOADED = 2,
    UNKNOWN_ROLE = 3
}
/**
 * 消息类型
 */
export declare enum MsgType {
    BEGIN_REQUEST = 1,
    ABORT_REQUEST = 2,
    END_REQUEST = 3,
    PARAMS = 4,
    STDIN = 5,
    STDOUT = 6,
    STDERR = 7,
    DATA = 8,
    GET_VALUES = 9,
    GET_VALUES_RESULT = 10,
    UNKNOWN_TYPE = 11,
    MAXTYPE = 11
}
export interface FcgiRequestOpts {
    path: string;
    query?: string;
    headers?: {
        [index: string]: string;
    };
    remoteAddress?: string;
    remotePort?: number;
    localAddress?: string;
    localPort?: number;
    method?: string;
    root?: string;
}
export interface FcgiClientApi {
    close(): any;
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
}
