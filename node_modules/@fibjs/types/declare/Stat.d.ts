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
	* @brief 文件的基础信息对象
	* @detail Stat 对象通过 fs.stat, File.stat, fs.readdir 查询，不可独立创建
	*/

declare class Class_Stat extends Class__object {
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件名称
	 * 
	 * @readonly
	 * @type String
	 */
	
	name: string
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 包含该文件的设备 ID
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	dev: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件中的 Inode 数量
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	ino: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件权限，Windows 不支持此属性
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	mode: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 与此文件相关联的硬链接数量
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	nlink: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件拥有者的id
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	uid: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件所属的组id
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	gid: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 对于特殊类型的文件, 包含该文件的设备 ID
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	rdev: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件尺寸
	 * 
	 * @readonly
	 * @type Number
	 */
	
	size: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 在 I/O 操作中文件系统区块大小
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	blksize: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 分配给该文件的区块数量
	 * 
	 * @readonly
	 * @type Integer
	 */
	
	blocks: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件最后修改时间
	 * 
	 * @readonly
	 * @type Date
	 */
	
	mtime: Date
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件最后修改时间(ms)
	 * 
	 * @readonly
	 * @type Number
	 */
	
	mtimeMs: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件最后访问时间
	 * 
	 * @readonly
	 * @type Date
	 */
	
	atime: Date
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件最后访问时间(ms)
	 * 
	 * @readonly
	 * @type Number
	 */
	
	atimeMs: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件创建时间
	 * 
	 * @readonly
	 * @type Date
	 */
	
	ctime: Date
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件创建时间(ms)
	 * 
	 * @readonly
	 * @type Number
	 */
	
	ctimeMs: number
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件产生时间
	 * 
	 * @readonly
	 * @type Date
	 */
	
	birthtime: Date
	
	/**
	 * class prop 
	 *
	 * 
	 * @brief 文件产生时间(ms)
	 * 
	 * @readonly
	 * @type Number
	 */
	
	birthtimeMs: number
	
	
	
	/**
	 * 
	 * @brief 查询文件是否有写入权限
	 * @return 为 true 则有写入权限
	 * 
	 * 
	 * 
	 */
	isWritable(): boolean;

	/**
	 * 
	 * @brief 查询文件是否有读权限
	 * @return 为 true 则有读权限
	 * 
	 * 
	 * 
	 */
	isReadable(): boolean;

	/**
	 * 
	 * @brief 查询文件是否有执行权限
	 * @return 为 true 则有执行权限
	 * 
	 * 
	 * 
	 */
	isExecutable(): boolean;

	/**
	 * 
	 * @brief 查询文件是否隐藏
	 * @return 为 true 则隐藏
	 * 
	 * 
	 * 
	 */
	isHidden(): boolean;

	/**
	 * 
	 * @brief 查询文件是否是目录
	 * @return 为 true 则是目录
	 * 
	 * 
	 * 
	 */
	isDirectory(): boolean;

	/**
	 * 
	 * @brief 查询文件是否是文件
	 * @return 为 true 则是文件
	 * 
	 * 
	 * 
	 */
	isFile(): boolean;

	/**
	 * 
	 * @brief 查询文件是否是符号链接
	 * @return 为 true 则是符号链接
	 * 
	 * 
	 * 
	 */
	isSymbolicLink(): boolean;

	/**
	 * 
	 * @brief 查询文件是否是内存文件
	 * @return 为 true 则是内存文件
	 * 
	 * 
	 * 
	 */
	isMemory(): boolean;

	/**
	 * 
	 * @brief 查询文件是否是 Socket
	 * @return 为 true 则是 Socket
	 * 
	 * 
	 * 
	 */
	isSocket(): boolean;

} /** endof class */

/** endof `module Or Internal Object` */


