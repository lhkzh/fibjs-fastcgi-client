/// <reference path="../_import/_fibjs.d.ts" />
/// <reference path="../interface/Buffer.d.ts" />
/**
 * @description bson 编码与解码模块
 *  引用方式：
 *  ```JavaScript
 *  var encoding = require('encoding');
 *  var bson = encoding.bson;
 *  ```
 *  或者
 *  ```JavaScript
 *  var bson = require('bson');
 *  ```
 *  
 */
declare module 'bson' {
    /**
     * @description 以 bson 格式编码变量
     * 	 @param data 要编码的变量
     * 	 @return 返回编码的二进制数据
     * 	 
     */
    function encode(data: FIBJS.GeneralObject): Class_Buffer;

    /**
     * @description 以 bson 方式解码字符串为一个变量
     * 	 @param data 要解码的二进制数据
     * 	 @return 返回解码的变量
     * 	 
     */
    function decode(data: Class_Buffer): FIBJS.GeneralObject;

}

