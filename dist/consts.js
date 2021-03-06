"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsgType = exports.ProtocolStatus = exports.nextRequestId = exports.recvMsgByFiber = exports.recvMsgPart = exports.try_sock_close = exports.sendGetCgiVal = exports.sendRequestByHttp = exports.sendRequest = exports.newRequestParams = exports.parseCgiKv = exports.toQueryString = exports.FLAG_PROPERTY_CLOSED = exports.EMPTY_BUF = void 0;
const FcgiResponse_1 = require("./FcgiResponse");
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
exports.EMPTY_BUF = new Buffer(0);
exports.FLAG_PROPERTY_CLOSED = "$@closed";
const FLAG_PROPERTY_LOCK = "$@locked";
let E = encodeURIComponent, S = Object.prototype.toString, F = function () {
};
//编码对象-节点
function encodeFormObjChild(k, v, pName) {
    var r = [];
    k = pName === undefined ? k : pName + "[" + k + "]";
    if (typeof v === "object" && v !== null) {
        r = r.concat(encodeFormObj(v, k));
    }
    else {
        k = E(k);
        v = E(v);
        r.push(k + "=" + v);
    }
    return r;
}
//设置对象的遍码
function encodeFormObj(D, pName) {
    var A = [], V;
    if (S.call(D) == '[object Array]') {
        for (var i = 0, len = D.length; i < len; i++) {
            V = D[i];
            A = A.concat(encodeFormObjChild(typeof V == "object" ? i : "", V, pName));
        }
    }
    else if (S.call(D) == '[object Object]') {
        for (var k in D) {
            A = A.concat(encodeFormObjChild(k, D[k], pName));
        }
    }
    return A;
}
;
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
function toQueryString(d) {
    return d ? (typeof d == "string" ? encodeFormStr(d) : encodeFormObj(d)).join("&").replace("/%20/g", "+") : "";
}
exports.toQueryString = toQueryString;
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
    }
    else if (keyLen > 127) {
        bufHead = new Buffer(5);
        bufHead.writeInt32BE(keyLen | 0x80000000, 0, true);
        bufHead.writeUInt8(valueLen, 4, true);
    }
    else if (valueLen > 127) {
        bufHead = new Buffer(5);
        bufHead.writeUInt8(keyLen, 0, true);
        bufHead.writeInt32BE(valueLen | 0x80000000, 1, true);
    }
    else {
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
    if (msgData.length - start < 1)
        throw new Error('Unexpected server message: illegal key pair format.');
    var keyLen = msgData.readUInt8(start, true);
    if (keyLen > 127) {
        if (msgData.length - start < 4)
            throw new Error('Unexpected server message: illegal key pair format.');
        keyLen = (msgData.readInt32BE(start, true) & 0x7fffffff);
        start += 4;
    }
    else {
        start++;
    }
    if (msgData.length - start < 1)
        throw new Error('Unexpected server message: illegal key pair format.');
    var valueLen = msgData.readUInt8(start, true);
    if (valueLen > 127) {
        if (msgData.length - start < 4)
            throw new Error('Unexpected server message: illegal key pair format.');
        valueLen = (msgData.readInt32BE(start, true) & 0x7fffffff);
        start = start + 4;
    }
    else {
        start++;
    }
    if (msgData.length - start < keyLen + valueLen)
        throw new Error('Unexpected server message: illegal key pair format.');
    return {
        key: msgData.toString('utf8', start, start + keyLen),
        value: msgData.toString('utf8', start + keyLen, start + keyLen + valueLen),
        end: start + keyLen + valueLen
    };
}
function query_uri(path, queryStr) {
    if (!queryStr)
        return path;
    return queryStr[0] != '?' ? `${path}?${queryStr}` : `${path}${queryStr}`;
}
function parseCgiKv(msgData) {
    var res = {};
    for (var pos = 0; pos < msgData.length;) {
        var pair = parsePair(msgData, pos);
        res[pair.key] = pair.value;
        pos = pair.end;
    }
    return res;
}
exports.parseCgiKv = parseCgiKv;
function newRequestParams(opts, data, serverParamss = {}) {
    let path = opts.path;
    let query = opts.query || "";
    let root = opts.root || process.cwd() + '/php';
    let cgi_file = root + path;
    let params = {};
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
    };
    return params;
}
exports.newRequestParams = newRequestParams;
function packPart(msgType, requestId, data, version = 1) {
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
function before_send_request(socket, requestId) {
    if (!socket[FLAG_PROPERTY_LOCK]) {
        socket[FLAG_PROPERTY_LOCK] = new coroutine.Lock();
    }
    socket[FLAG_PROPERTY_LOCK].acquire(true); //写数据包时锁定一下
    let wrap = { evt: new coroutine.Event(), rsp: null };
    if (requestId == 0 && socket["@" + requestId] != null) {
        return socket["@" + requestId];
    }
    socket["@" + requestId] = wrap;
    return wrap;
}
function writeMsgPartSlice(socket, msgType, requestId, data, len, start, end, version) {
    var contentLen = end - start;
    var paddingLen = (8 - (contentLen % 8)) % 8;
    if (start || end !== len)
        data = data.slice(start, end);
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
    }
    else {
        socket.write(data);
    }
}
function writeMsgBySlice(socket, msgType, requestId, data, version) {
    data = data ? data : exports.EMPTY_BUF;
    var len = data.length;
    for (var start = 0; start < len - 0xffff; start += 0xffff) {
        console.log("--", start);
        writeMsgPartSlice(socket, msgType, requestId, data, len, start, start + 0xffff, version);
    }
    writeMsgPartSlice(socket, msgType, requestId, data, len, start, len, version);
}
function sendRequest(socket, requestId, params, body, version = 1) {
    let wrap = before_send_request(socket, requestId);
    try {
        //begin-request
        let cgi_role = 1; //1 2 3
        let cgi_flag = 1; //0 1
        let begin_body = new Buffer([cgi_role >> 8 & 0xFF, cgi_role & 0xFF, cgi_flag, 0, 0, 0, 0, 0]);
        socket.write(packPart(MsgType.BEGIN_REQUEST, requestId, begin_body, version));
        socket.write(begin_body);
        //kv-request
        let kv_body = stringifyKv(params);
        if (kv_body.length > 0xffff) {
            writeMsgBySlice(socket, MsgType.PARAMS, requestId, kv_body, version);
        }
        else {
            socket.write(packPart(MsgType.PARAMS, requestId, kv_body, version));
            socket.write(kv_body);
        }
        socket.write(packPart(MsgType.PARAMS, requestId, null, version));
        //body-request
        if (body) {
            if (body.length > 0xffff) {
                writeMsgBySlice(socket, MsgType.STDIN, requestId, body, version);
            }
            else {
                socket.write(packPart(MsgType.STDIN, requestId, body, version));
                socket.write(body);
            }
        }
        else {
            socket.write(packPart(MsgType.STDIN, requestId, null, version));
        }
        wrap.evt.wait();
    }
    catch (e) {
        try_sock_close(socket);
        throw e;
    }
    finally {
        socket[FLAG_PROPERTY_LOCK].release(); //写数据包时锁定一下
    }
    if (wrap.err) {
        throw new Error(wrap.err);
    }
    return wrap.rsp;
}
exports.sendRequest = sendRequest;
function sendRequestByHttp(socket, requestId, req, cgiRoot, serverParamss = {}, version = 1) {
    let path = req.address;
    let query = req.queryString;
    let root = cgiRoot ? cgiRoot : process.cwd() + '/php';
    let cgi_file = root + path;
    let params = {};
    for (var k in req.headers) {
        if (!util.isFunction(req.headers[k]))
            params['HTTP_' + k.replace(/-/g, '_').toUpperCase()] = String(req.headers[k]);
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
    };
    let rsp = sendRequest(socket, requestId, params, req.data, version);
    let err_msg;
    if (!rsp) {
        err_msg = "io_error";
    }
    else if (rsp.protocolStatus == ProtocolStatus.CANT_MPX_CONN) {
        err_msg = "rejected:limit full.";
    }
    else if (rsp.protocolStatus == ProtocolStatus.OVERLOADED) {
        err_msg = "rejected:not available.";
    }
    else if (rsp.protocolStatus == ProtocolStatus.UNKNOWN_ROLE) {
        err_msg = "rejected:no role.";
    }
    if (err_msg) {
        req.response.writeHead(500, err_msg);
    }
    else {
        for (var k in rsp.headers) {
            req.response.headers[k] = rsp.headers[k];
        }
        req.response.write(rsp.content);
    }
    req.end();
    return err_msg ? 500 : 0;
}
exports.sendRequestByHttp = sendRequestByHttp;
function sendGetCgiVal(socket, params, version = 1) {
    let requestId = 0;
    let wrap = before_send_request(socket, requestId);
    try {
        let kv_body = stringifyKv(params);
        socket.write(packPart(MsgType.GET_VALUES, requestId, kv_body, version));
        socket.write(kv_body);
        wrap.evt.wait();
    }
    catch (e) {
        try_sock_close(socket);
        throw e;
    }
    finally {
        socket[FLAG_PROPERTY_LOCK].release(); //写数据包时锁定一下
    }
    return wrap.rsp;
}
exports.sendGetCgiVal = sendGetCgiVal;
function try_sock_close(socket, err) {
    socket[exports.FLAG_PROPERTY_CLOSED] = true;
    try {
        socket.close();
    }
    catch (e) {
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
exports.try_sock_close = try_sock_close;
function recv_len(sock, len) {
    let readData;
    try {
        readData = sock.read(len);
    }
    catch (e) {
        throw e;
    }
    if (readData == null) {
        throw new Error('io-error');
    }
    return readData;
}
function recvMsgPart(socket) {
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
    let content = restBodyLen > 0 ? recv_len(socket, restBodyLen) : exports.EMPTY_BUF;
    if (restPaddingLen > 0) {
        recv_len(socket, restPaddingLen);
    }
    return { id: reqId, type: msgType, body: content, version: version, reserved: reserved };
}
exports.recvMsgPart = recvMsgPart;
function recvMsgByBlock(sock) {
    try {
        while (!sock[exports.FLAG_PROPERTY_CLOSED]) {
            let part = recvMsgPart(sock);
            let wait = sock["@" + part.id];
            // console.log("while",wait,part,part.body.toString())
            if (wait.rsp == null) {
                wait.rsp = new FcgiResponse_1.FcgiResponse(part);
            }
            if (wait.rsp.process(part)) {
                delete sock["@" + part.id];
                wait.evt.set();
            }
        }
    }
    catch (e) {
        if (!sock[exports.FLAG_PROPERTY_CLOSED]) {
            console.error("fcgi_recv_err", e);
            try_sock_close(sock, e.message);
        }
    }
}
function recvMsgByFiber(sock) {
    return coroutine.start(recvMsgByBlock, sock);
}
exports.recvMsgByFiber = recvMsgByFiber;
if (!global.hasOwnProperty("fibfcgi_request_id")) {
    global["fibfcgi_request_id"] = 0;
}
function nextRequestId() {
    let r = global["fibfcgi_request_id"] + 1;
    if (r >= 0xFFFF) {
        r = 1;
    }
    global["fibfcgi_request_id"] = r;
    return r;
}
exports.nextRequestId = nextRequestId;
/**
 * 协议状态
 */
var ProtocolStatus;
(function (ProtocolStatus) {
    ProtocolStatus[ProtocolStatus["REQUEST_COMPLETE"] = 0] = "REQUEST_COMPLETE";
    ProtocolStatus[ProtocolStatus["CANT_MPX_CONN"] = 1] = "CANT_MPX_CONN";
    ProtocolStatus[ProtocolStatus["OVERLOADED"] = 2] = "OVERLOADED";
    ProtocolStatus[ProtocolStatus["UNKNOWN_ROLE"] = 3] = "UNKNOWN_ROLE";
})(ProtocolStatus = exports.ProtocolStatus || (exports.ProtocolStatus = {}));
/**
 * 消息类型
 */
var MsgType;
(function (MsgType) {
    MsgType[MsgType["BEGIN_REQUEST"] = 1] = "BEGIN_REQUEST";
    MsgType[MsgType["ABORT_REQUEST"] = 2] = "ABORT_REQUEST";
    MsgType[MsgType["END_REQUEST"] = 3] = "END_REQUEST";
    MsgType[MsgType["PARAMS"] = 4] = "PARAMS";
    MsgType[MsgType["STDIN"] = 5] = "STDIN";
    MsgType[MsgType["STDOUT"] = 6] = "STDOUT";
    MsgType[MsgType["STDERR"] = 7] = "STDERR";
    MsgType[MsgType["DATA"] = 8] = "DATA";
    MsgType[MsgType["GET_VALUES"] = 9] = "GET_VALUES";
    MsgType[MsgType["GET_VALUES_RESULT"] = 10] = "GET_VALUES_RESULT";
    MsgType[MsgType["UNKNOWN_TYPE"] = 11] = "UNKNOWN_TYPE";
    MsgType[MsgType["MAXTYPE"] = 11] = "MAXTYPE";
})(MsgType = exports.MsgType || (exports.MsgType = {}));
