/// <reference types="@fibjs/types" />
import { ProtocolStatus } from "./consts";
export declare class FcgiResponse {
    version: number;
    requestId: number;
    appStatus: number;
    protocolStatus: ProtocolStatus;
    out: Class_Buffer;
    err: Class_Buffer;
    headers: {
        [index: string]: string;
    };
    content: Class_Buffer;
    constructor(data: {
        id: number;
        version: number;
    });
    process(data: {
        type: number;
        body: Class_Buffer;
        reserved: boolean;
    }): boolean;
    private parse;
}
