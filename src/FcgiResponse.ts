import {MsgType, ProtocolStatus} from "./consts";

export class FcgiResponse {
    public version: number;
    public requestId: number;
    public appStatus: number;
    public protocolStatus: ProtocolStatus;
    public out: Class_Buffer;
    public err: Class_Buffer;

    public headers: { [index: string]: string };
    public content: Class_Buffer;

    constructor(data: { id: number, version: number }) {
        this.requestId = data.id;
        this.version = data.version;
    }

    public process(data: { type: number, body: Class_Buffer, reserved: boolean }) {
        if (data.type == MsgType.STDOUT) {
            if (!this.out) {
                this.out = data.body;
            } else {
                this.out = Buffer.concat([this.out, data.body]);
            }
        } else if (data.type == MsgType.END_REQUEST) {
            let end = data.body;
            this.appStatus = ((end[0] << 24) & 0xFF000000) + ((end[1] << 16) & 0xFF0000) + //
                ((end[2] << 8) & 0xFF00) + (end[3] & 0xFF);
            this.protocolStatus = end[4];
            if (this.protocolStatus == 0) {
                this.parse();
            }
            return true;
        } else if (data.type == MsgType.STDERR || data.type == MsgType.UNKNOWN_TYPE) {
            if (!this.err) {
                this.err = data.body;
            } else {
                this.err = Buffer.concat([this.err, data.body]);
            }
        } else if (data.type == MsgType.GET_VALUES_RESULT) {
            // console.log("---?",data)
            this.content = data.body;
            return true;
        }
        return false;
    }

    private parse() {
        var split_idx = this.out.indexOf('\r\n\r\n');
        var headers = {};
        var body = this.out.slice(split_idx + 4);
        this.out.slice(0, split_idx).toString().split("\r\n").forEach(val => {
            if (val.length < 2) return;
            var valArr = val.split(':');
            headers[valArr[0]] = valArr[1].trimLeft();
        });
        this.headers = headers;
        this.content = body;
    }
}