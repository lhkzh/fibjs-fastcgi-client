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
	* @brief 文件系统观察对象
	* @detail 当调用 `fs.watch(target)` 成功时, 返回该类型对象,```JavaScript,var fs = require("fs");,var watcher = fs.watch((eventType, filename) => {,   if (filename) {,     console.log(filename);,     // Prints: <Buffer ...>,   },});,,watcher.close();,,// 带回调地调用,fs.watch('./tmp', { encoding: 'buffer' }, (eventType, filename) => {, if (filename) {,   console.log(filename);,   // Prints: <Buffer ...>, },});,```
	*/
/// <reference path="EventEmitter.d.ts" />
declare class Class_FSWatcher extends Class_EventEmitter {
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 查询和绑定"文件改变"事件，相当于 on("change", func);
	 * 
	 * 
	 * @type Function
	 */
	
	onchange: Function
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 查询和绑定"watcher 关闭"的事件，相当于 on("close", func);
	 * 
	 * 
	 * @type Function
	 */
	
	onclose: Function
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 查询和绑定"错误发生"的事件，相当于 on("error", func);
	 * 
	 * 
	 * @type Function
	 */
	
	onerror: Function
	
	
	
	/**
	 * 
	 * @brief 关闭该 Watcher, 不再接收对应的文件变化处理事件
	 * 
	 * 
	 */
	close(): void;

} /** endof class */

/** endof `module Or Internal Object` */


