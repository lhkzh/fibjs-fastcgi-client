"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcgiResponse = void 0;
const consts_1 = require("./consts");
class FcgiResponse {
    constructor(data) {
        this.requestId = data.id;
        this.version = data.version;
    }
    process(data) {
        if (data.type == consts_1.MsgType.STDOUT) {
            if (!this.out) {
                this.out = data.body;
            }
            else {
                this.out = Buffer.concat([this.out, data.body]);
            }
        }
        else if (data.type == consts_1.MsgType.END_REQUEST) {
            let end = data.body;
            this.appStatus = ((end[0] << 24) & 0xFF000000) + ((end[1] << 16) & 0xFF0000) + //
                ((end[2] << 8) & 0xFF00) + (end[3] & 0xFF);
            this.protocolStatus = end[4];
            if (this.protocolStatus == 0) {
                this.parse();
            }
            return true;
        }
        else if (data.type == consts_1.MsgType.STDERR || data.type == consts_1.MsgType.UNKNOWN_TYPE) {
            if (!this.err) {
                this.err = data.body;
            }
            else {
                this.err = Buffer.concat([this.err, data.body]);
            }
        }
        else if (data.type == consts_1.MsgType.GET_VALUES_RESULT) {
            // console.log("---?",data)
            this.content = data.body;
            return true;
        }
        return false;
    }
    parse() {
        var split_idx = this.out.indexOf('\r\n\r\n');
        var headers = {};
        var body = this.out.slice(split_idx + 4);
        this.out.slice(0, split_idx).toString().split("\r\n").forEach(val => {
            if (val.length < 2)
                return;
            var valArr = val.split(':');
            headers[valArr[0]] = valArr[1].trimLeft();
        });
        this.headers = headers;
        this.content = body;
    }
}
exports.FcgiResponse = FcgiResponse;
