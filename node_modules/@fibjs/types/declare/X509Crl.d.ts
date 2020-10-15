/***************************************************************************
 *                                                                         *
 *   This file was automatically generated with idlc.js                    *
 *	 build info: 								   						   *
 *   	- fibjs	: 0.31.0                                                   *
 *   	- date	: Jul 19 2020 12:24:05                                     *
 *                                                                         *
 ***************************************************************************/

/** 
 * @author Richard <richardo2016@gmail.com>
 *
 */

/// <reference path="_common.d.ts" />
/// <reference path="object.d.ts" />





/** module Or Internal Object */
/**
	* @brief x509 撤销证书对象
	* @detail X509Crl 对象属于 crypto 模块，创建：,```JavaScript,var k = new crypto.X509Crl();,```
	*/

declare class Class_X509Crl extends Class__object {
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 获取证书的版本
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	version: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 获取证书颁发者的可分辨名称
	 * 
	 * @readonly
	 * @type String
	 */
	
	issuer: string
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 获取证书吊销序列号列表
	 * 
	 * @readonly
	 * @type Array
	 */
	
	serials: any[]
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 获取证书的本次更新时间
	 * 
	 * @readonly
	 * @type Date
	 */
	
	thisUpdate: Date
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 获取证书的下次更新时间
	 * 
	 * @readonly
	 * @type Date
	 */
	
	nextUpdate: Date
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 获取证书链中得下一个证书
	 * 
	 * @readonly
	 * @type X509Crl
	 */
	
	next: Class_X509Crl
	
	
	
	/**
	 * 
	 * @brief X509Crl 构造函数
	 * 
	 * 
	 */
	constructor();

	/**
	 * 
	 * @brief X509Crl 构造函数,加载一个 DER 格式的撤销证书
	 * @param derCrl DER 格式的撤销证书
	 * 
	 * 
	 * 
	 */
	constructor(derCrl: Class_Buffer);

	/**
	 * 
	 * @brief X509Crl 构造函数,加载一个 PEM 格式的撤销证书
	 * @param pemCrl PEM 格式的撤销证书
	 * 
	 * 
	 * 
	 */
	constructor(pemCrl: string);

	/**
	 * 
	 * @brief 加载一个 DER 格式的撤销证书，可多次调用
	 * @param derCrl DER 格式的撤销证书
	 * 
	 * 
	 * 
	 */
	load(derCrl: Class_Buffer): void;

	/**
	 * 
	 * @brief 加载一个 PEM 格式的撤销证书，可多次调用
	 * @param pemCrl PEM 格式的撤销证书
	 * 
	 * 
	 * 
	 */
	load(pemCrl: string): void;

	/**
	 * 
	 * @brief 加载一个 PEM/DER 格式的撤销证书，可多次调用
	 * @param filename 撤销证书文件名
	 * 
	 * 
	 * 
	 */
	loadFile(filename: string): void;

	/**
	 * 
	 * @brief 导出已经加载的撤销证书
	 * @param pem 指定输出 PEM 格式的撤销证书，缺省为 true
	 * @return 以数组方式导出撤销证书链
	 * 
	 * 
	 * 
	 */
	dump(pem?: boolean/** = true*/): any[];

	/**
	 * 
	 * @brief 清空已经加载的撤销证书
	 * 
	 * 
	 * 
	 */
	clear(): void;

} /** endof class */

/** endof `module Or Internal Object` */


