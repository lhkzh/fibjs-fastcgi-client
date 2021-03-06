import {FcgiResponse} from "./FcgiResponse";

let coroutine = require("coroutine");
let util = require("util");
var PADDING_BUFS = [
    new Buffer(0),
    new Buffer('\0'),
    new Buffer('\0\0'),
    new Buffer('\0\0\0'),
    new Buffer('\0\0\0\0'),
    new Buffer('\0\0\0\0\0'),
    new Buffer('\0\0\0\0\0\0'),
    new Buffer('\0\0\0\0\0\0\0'),
];
export const EMPTY_BUF = new Buffer(0);
export const FLAG_PROPERTY_CLOSED = "$@closed";
const FLAG_PROPERTY_LOCK = "$@locked";

let E = encodeURIComponent, S = Object.prototype.toString, F = function () {
};

//编码对象-节点
function encodeFormObjChild(k, v, pName) {
    var r = [];
    k = pName === undefined ? k : pName + "[" + k + "]";
    if (typeof v === "object" && v !== null) {
        r = r.concat(encodeFormObj(v, k));
    } else {
        k = E(k);
        v = E(v);
        r.push(k + "=" + v);
    }
    return r;
}

//设置对象的遍码
function encodeFormObj(D, pName?: string) {
    var A = [], V;
    if (S.call(D) == '[object Array]') {
        for (var i = 0, len = D.length; i < len; i++) {
            V = D[i];
            A = A.concat(encodeFormObjChild(typeof V == "object" ? i : "", V, pName));
        }
    } else if (S.call(D) == '[object Object]') {
        for (var k in D) {
            A = A.concat(encodeFormObjChild(k, D[k], pName));
        }
    }
    return A;
};

//设置字符串的遍码，字符串的格式为：a=1&b=2;
function encodeFormStr(D) {
    var a = D.split("&"), n, v;
    for (var i = 0, len = a.length; i < len; i++) {
        n = E(a[i].split("=")[0]);
        v = E(a[i].split("=")[1]);
        a[i] = n + "=" + v;
    }
    return a;
}

//编码数据
export function toQueryString(d) {
    return d ? (typeof d == "string" ? encodeFormStr(d) : encodeFormObj(d)).join("&").replace("/%20/g", "+") : "";
}

// export function toQueryString(kv:any) {
//     var arr=[];
//     for(var k in kv){
//         arr.push(k+'='+encodeURIComponent(String(kv[k])));
//     }
//     return arr.join("&");
// }

function stringifyPair(key, value) {
    var bufKey = Buffer.from(key);
    var bufValue = Buffer.from(String(value));
    var bufHead = null;
    var keyLen = bufKey.length;
    var valueLen = bufValue.length;
    if (keyLen > 127 && valueLen > 127) {
        bufHead = new Buffer(8);
        bufHead.writeInt32BE(keyLen | 0x80000000, 0, true);
        bufHead.writeInt32BE(valueLen | 0x80000000, 4, true);
    } else if (keyLen > 127) {
        bufHead = new Buffer(5);
        bufHead.writeInt32BE(keyLen | 0x80000000, 0, true);
        bufHead.writeUInt8(valueLen, 4, true);
    } else if (valueLen > 127) {
        bufHead = new Buffer(5);
        bufHead.writeUInt8(keyLen, 0, true);
        bufHead.writeInt32BE(valueLen | 0x80000000, 1, true);
    } else {
        bufHead = new Buffer(2);
        bufHead.writeUInt8(keyLen, 0, true);
        bufHead.writeUInt8(valueLen, 1, true);
    }
    return [
        bufHead,
        bufKey,
        bufValue,
        bufHead.length + keyLen + valueLen
    ];
}

function stringifyKv(kv) {
    var bufs = [];
    var bufsLen = 0;
    for (var k in kv) {
        var bs = stringifyPair(k, kv[k]);
        bufs.push(bs[0], bs[1], bs[2]);
        bufsLen += bs[3];
    }
    return Buffer.concat(bufs, bufsLen);
}

function parsePair(msgData, start) {
    if (msgData.length - start < 1) throw new Error('Unexpected server message: illegal key pair format.');
    var keyLen = msgData.readUInt8(start, true);
    if (keyLen > 127) {
        if (msgData.length - start < 4) throw new Error('Unexpected server message: illegal key pair format.');
        keyLen = (msgData.readInt32BE(start, true) & 0x7fffffff);
        start += 4;
    } else {
        start++;
    }
    if (msgData.length - start < 1) throw new Error('Unexpected server message: illegal key pair format.');
    var valueLen = msgData.readUInt8(start, true);
    if (valueLen > 127) {
        if (msgData.length - start < 4) throw new Error('Unexpected server message: illegal key pair format.');
        valueLen = (msgData.readInt32BE(start, true) & 0x7fffffff);
        start = start + 4;
    } else {
        start++;
    }
    if (msgData.length - start < keyLen + valueLen) throw new Error('Unexpected server message: illegal key pair format.');
    return {
        key: msgData.toString('utf8', start, start + keyLen),
        value: msgData.toString('utf8', start + keyLen, start + keyLen + valueLen),
        end: start + keyLen + valueLen
    };
}

function query_uri(path: string, queryStr: string) {
    if (!queryStr) return path;
    return queryStr[0] != '?' ? `${path}?${queryStr}` : `${path}${queryStr}`;
}

export function parseCgiKv(msgData: Class_Buffer) {
    var res = {};
    for (var pos = 0; pos < msgData.length;) {
        var pair = parsePair(msgData, pos);
        res[pair.key] = pair.value;
        pos = pair.end;
    }
    return res;
}

export function newRequestParams(opts: FcgiRequestOpts, data?: Class_Buffer, serverParamss: any = {}) {
    let path = opts.path;
    let query = opts.query || "";
    let root = opts.root || process.cwd() + '/php';
    let cgi_file = root + path;
    let params: { [index: string]: string } = {};
    for (var k in opts.headers) {
        if (!util.isFunction(opts.headers[k])) {
            params['HTTP_' + k.replace(/-/g, '_').toUpperCase()] = String(opts.headers[k]);
        }
    }
    serverParamss.SERVER_NAME = serverParamss.SERVER_NAME || "localhost";
    serverParamss.SERVER_SOFTWARE = serverParamss.SERVER_SOFTWARE || "fibjs";
    params = {
        ...params,
        ...serverParamss,
        GATEWAY_INTERFACE: "FastCGI/1.0",
        REQUEST_METHOD: opts.method || (data && data.length > 0 ? "POST" : "GET"),
        DOCUMENT_ROOT: root,
        SCRIPT_FILENAME: cgi_file,
        SCRIPT_NAME: path,
        REQUEST_URI: query_uri(path, query),
        QUERY_STRING: query,
        REMOTE_ADDR: opts.remoteAddress || "127.0.0.1",
        REMOTE_PORT: (opts.remotePort || 90999) + "",
        SERVER_ADDR: opts.localAddress || "127.0.0.1",
        SERVER_PORT: (opts.localPort || 80) + "",
        SERVER_PROTOCOL: "HTTP/1.1",
        CONTENT_TYPE: opts.headers && opts.headers["Content-Type"] ? opts.headers["Content-Type"] : "",
        CONTENT_LENGTH: (data ? data.length : 0) + ""
    }
    return params;
}

function packPart(msgType: number, requestId: number, data: Class_Buffer, version: number = 1) {
    let length = data == null ? 0 : data.length;
    let buf = new Buffer(8);
    buf.writeInt8(version, 0);
    buf.writeInt8(msgType, 1);
    buf.writeInt16BE(requestId, 2);
    buf.writeInt16BE(length, 4);
    buf.writeInt8(0, 6);
    buf.writeInt8(0, 7);
    return buf;
}

function before_send_request(socket: Class_Socket, requestId: number) {
    if (!socket[FLAG_PROPERTY_LOCK]) {
        socket[FLAG_PROPERTY_LOCK] = new coroutine.Lock();
    }
    (<Class_Lock>socket[FLAG_PROPERTY_LOCK]).acquire(true);//写数据包时锁定一下
    let wrap = {evt: new coroutine.Event(), rsp: null};
    if (requestId == 0 && socket["@" + requestId] != null) {
        return socket["@" + requestId];
    }
    socket["@" + requestId] = wrap;
    return wrap;
}

function writeMsgPartSlice(socket: Class_Socket, msgType: number, requestId: number, data: Class_Buffer, len: number, start: number, end: number, version: number) {
    var contentLen = end - start;
    var paddingLen = (8 - (contentLen % 8)) % 8;
    if (start || end !== len) data = data.slice(start, end);
    var buf = Buffer.alloc(8);
    buf.writeUInt8(version, 0);
    buf.writeUInt8(msgType, 1);
    buf.writeUInt16BE(requestId, 2);
    buf.writeUInt16BE(contentLen, 4);
    buf.writeUInt8(0, 6);
    buf.writeUInt8(0, 7);
    socket.write(buf);
    if (paddingLen) {
        socket.write(data);
        socket.write(PADDING_BUFS[paddingLen]);
    } else {
        socket.write(data);
    }
}

function writeMsgBySlice(socket: Class_Socket, msgType: number, requestId: number, data: Class_Buffer, version: number) {
    data = data ? data : EMPTY_BUF;
    var len = data.length;
    for (var start = 0; start < len - 0xffff; start += 0xffff) {
        console.log("--", start)
        writeMsgPartSlice(socket, msgType, requestId, data, len, start, start + 0xffff, version);
    }
    writeMsgPartSlice(socket, msgType, requestId, data, len, start, len, version);
}

export function sendRequest(socket: Class_Socket, requestId: number, params: { [index: string]: string | number }, body: Class_Buffer, version: number = 1): FcgiResponse {
    let wrap = before_send_request(socket, requestId);
    try {
        //begin-request
        let cgi_role = 1;//1 2 3
        let cgi_flag = 1;//0 1
        let begin_body = new Buffer([cgi_role >> 8 & 0xFF, cgi_role & 0xFF, cgi_flag, 0, 0, 0, 0, 0]);
        socket.write(packPart(MsgType.BEGIN_REQUEST, requestId, begin_body, version));
        socket.write(begin_body);
        //kv-request
        let kv_body = stringifyKv(params);
        if (kv_body.length > 0xffff) {
            writeMsgBySlice(socket, MsgType.PARAMS, requestId, kv_body, version);
        } else {
            socket.write(packPart(MsgType.PARAMS, requestId, kv_body, version));
            socket.write(kv_body);
        }
        socket.write(packPart(MsgType.PARAMS, requestId, null, version));
        //body-request
        if (body) {
            if (body.length > 0xffff) {
                writeMsgBySlice(socket, MsgType.STDIN, requestId, body, version);
            } else {
                socket.write(packPart(MsgType.STDIN, requestId, body, version));
                socket.write(body);
            }
        } else {
            socket.write(packPart(MsgType.STDIN, requestId, null, version));
        }
        wrap.evt.wait();
    } catch (e) {
        try_sock_close(socket);
        throw e;
    } finally {
        (<Class_Lock>socket[FLAG_PROPERTY_LOCK]).release();//写数据包时锁定一下
    }
    if(wrap.err){
        throw new Error(wrap.err);
    }
    return wrap.rsp;
}

export function sendRequestByHttp(socket: Class_Socket, requestId: number, req: Class_HttpRequest, cgiRoot?: string, serverParamss: any = {}, version: number = 1) {
    let path = req.address;
    let query = req.queryString;
    let root = cgiRoot ? cgiRoot : process.cwd() + '/php';
    let cgi_file = root + path;
    let params: { [index: string]: string | number } = {};
    for (var k in req.headers) {
        if (!util.isFunction(req.headers[k])) params['HTTP_' + k.replace(/-/g, '_').toUpperCase()] = String(req.headers[k]);
    }
    serverParamss.SERVER_NAME = serverParamss.SERVER_NAME || "localhost";
    serverParamss.SERVER_SOFTWARE = serverParamss.SERVER_SOFTWARE || "fibjs";
    params = {
        ...params,
        ...serverParamss,
        GATEWAY_INTERFACE: "FastCGI/1.0",
        REQUEST_METHOD: req.method,
        DOCUMENT_ROOT: root,
        SCRIPT_FILENAME: cgi_file,
        SCRIPT_NAME: path,
        REQUEST_URI: query_uri(path, query),
        QUERY_STRING: query,
        REMOTE_ADDR: req.socket["remoteAddress"],
        REMOTE_PORT: req.socket["remotePort"],
        SERVER_ADDR: req.socket["localAddress"],
        SERVER_PORT: req.socket["localPort"],
        SERVER_PROTOCOL: req.protocol,
        CONTENT_TYPE: req.hasHeader("Content-Type") ? req.firstHeader("Content-Type") : "",
        CONTENT_LENGTH: (req.data ? req.data.length : 0)
    }
    let rsp = sendRequest(socket, requestId, params, req.data, version);
    let err_msg: string;
    if (!rsp) {
        err_msg = "io_error";
    } else if (rsp.protocolStatus == ProtocolStatus.CANT_MPX_CONN) {
        err_msg = "rejected:limit full.";
    } else if (rsp.protocolStatus == ProtocolStatus.OVERLOADED) {
        err_msg = "rejected:not available.";
    } else if (rsp.protocolStatus == ProtocolStatus.UNKNOWN_ROLE) {
        err_msg = "rejected:no role.";
    }
    if (err_msg) {
        req.response.writeHead(500, err_msg);
    } else {
        for (var k in rsp.headers) {
            req.response.headers[k] = rsp.headers[k];
        }
        req.response.write(rsp.content);
    }
    req.end();
    return err_msg ? 500 : 0;
}

export function sendGetCgiVal(socket: Class_Socket, params: { [index: string]: any }, version: number = 1) {
    let requestId = 0;
    let wrap = before_send_request(socket, requestId);
    try {
        let kv_body = stringifyKv(params);
        socket.write(packPart(MsgType.GET_VALUES, requestId, kv_body, version));
        socket.write(kv_body);
        wrap.evt.wait();
    } catch (e) {
        try_sock_close(socket);
        throw e;
    } finally {
        (<Class_Lock>socket[FLAG_PROPERTY_LOCK]).release();//写数据包时锁定一下
    }
    return wrap.rsp;
}

export function try_sock_close(socket: Class_Socket, err?:string) {
    socket[FLAG_PROPERTY_CLOSED] = true;
    try {
        socket.close();
    } catch (e) {
    }
    for (var k in socket) {
        if (k.charAt(0) == '@') {
            let wrap = socket[k];
            delete socket[k];
            wrap.err = err;
            wrap.evt.set();
        }
    }
}
function recv_len(sock: Class_Socket, len: number) {
    let readData: Class_Buffer;
    try{
        readData = sock.read(len)
    }catch (e) {
        throw e;
    }
    if (readData == null) {
        throw new Error('io-error');
    }
    return readData;
}
export function recvMsgPart(socket: Class_Socket) {
    let expectLen = 8;
    let headData = recv_len(socket, expectLen);
    if (headData.readUInt8(0) !== 1) {
        let err = 'The server does not speak a compatible FastCGI protocol.';
        try_sock_close(socket, err);
        throw new Error(err);
    }
    let version = headData.readUInt8(0);
    let msgType = headData.readUInt8(1);
    let reqId = headData.readUInt16BE(2);
    let restBodyLen = headData.readUInt16BE(4);
    let restPaddingLen = headData.readUInt8(6);
    let reserved = headData.readUInt8(7) != 0;
    let content = restBodyLen > 0 ? recv_len(socket, restBodyLen) : EMPTY_BUF;
    if (restPaddingLen > 0) {
        recv_len(socket, restPaddingLen);
    }
    return {id: reqId, type: msgType, body: content, version: version, reserved: reserved};
}

function recvMsgByBlock(sock: Class_Socket) {
    try {
        while (!sock[FLAG_PROPERTY_CLOSED]) {
            let part = recvMsgPart(sock);
            let wait: { evt: Class_Event, rsp: FcgiResponse } = sock["@" + part.id];
            // console.log("while",wait,part,part.body.toString())
            if (wait.rsp == null) {
                wait.rsp = new FcgiResponse(part);
            }
            if (wait.rsp.process(part)) {
                delete sock["@" + part.id];
                wait.evt.set();
            }
        }
    } catch (e) {
        if (!sock[FLAG_PROPERTY_CLOSED]) {
            console.error("fcgi_recv_err", e);
            try_sock_close(sock, e.message);
        }
    }
}

export function recvMsgByFiber(sock: Class_Socket) {
    return coroutine.start(recvMsgByBlock, sock);
}


if (!global.hasOwnProperty("fibfcgi_request_id")) {
    global["fibfcgi_request_id"] = 0;
}

export function nextRequestId(): number {
    let r = global["fibfcgi_request_id"] + 1;
    if (r >= 0xFFFF) {
        r = 1;
    }
    global["fibfcgi_request_id"] = r;
    return r;
}


/**
 * 协议状态
 */
export enum ProtocolStatus {
    REQUEST_COMPLETE = 0,
    CANT_MPX_CONN = 1,
    OVERLOADED = 2,
    UNKNOWN_ROLE = 3
}

/**
 * 消息类型
 */
export enum MsgType {
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
    path: string,
    query?: string,
    headers?: { [index: string]: string },
    remoteAddress?: string,
    remotePort?: number,
    localAddress?: string,
    localPort?: number,
    method?: string,
    root?: string
}

export interface FcgiClientApi {
    close();

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
    requestByParams(path: string, query: string | { [index: string]: string | number }, post?: Class_Buffer, headers?: { [index: string]: string }, addressInfo?: { remoteAddress?: string, remotePort?: number, localAddress?: string, localPort?: number }): FcgiResponse;

    /**
     * 发送cgi请求
     * @param cgiParams 组装的cgi参数
     * @param body post数据
     */
    requestByCgiParams(cgiParams: { [index: string]: string | number }, body?: Class_Buffer): FcgiResponse;
}