Ueditor七牛云存储版本
===========

>声明：该版本为widuu版本优化后的版本，老版本请查看 : [https://github.com/widuu/qiniu_ueditor_1.4.3](https://github.com/widuu/qiniu_ueditor_1.4.3)

### 关于地址报错

> 请修改 `php/config.json` 中的 `uploadQiniuUrl` 和 `ChunkUploadQiniuUrl` 参数，因为最近反馈地区错误报错比较多，举个简单的例子华南地区修改如下

```
"uploadQiniuUrl"     : "http://up-z2.qiniu.com/", /* 七牛上传地址 */
"ChunkUploadQiniuUrl": "http://up-z2.qiniu.com", /* 分片上传创建的host地址 */
```
具体地区的上传URL请查看七牛官方存储区域，地址:[https://developer.qiniu.com/kodo/manual/1671/region-endpoint](https://developer.qiniu.com/kodo/manual/1671/region-endpoint)

> 使用ssl协议时，请认真查看七牛官方的上传url地址，然后打开看是否报错，有人已经反馈ssl无法上传，其实是config.json配置中的URL问题。

### BUG修复

 - 视频分片上传时最后一片计算错误的问题
 - 文件和图片上传时路径没有按规则生成的问题
 - 文件和图片上传时没有判断是否七牛环境的问题
 - 优化了视频，音频上传后直接可预览

### 新版本说明

>注意：新版本不兼容老版本，网上整合教程现在最多的是老版本，如果查看的是网站教程请点击老版本地址来下载老版本

#### 新增

 - 音频模块的支持
 - 视频增加在线列表管理


### 配置

> 配置两个文件，一个是 `php` 的配置文件 `config.php` 和 `Ueditor` 的配置文件 `config.json` ，默认的配置文件都在 `php` 目录下。


#### 本地上传配置 

> 修改 `config.php`

	'upload_type' => 'local',  // local 是上传到本地服务器
	'orderby'     => 'asc',    // 可选项 [desc|asc]列出文件的排序方式，此配置仅支持本地服务器
	'root_path'	  => $_SERVER['DOCUMENT_ROOT'],  // 本地上传的根目录地址

> 修改 `config.json`

	"uploadType" : "local", /* qiniu|local 【qiniu】七牛云存储 【local】本地上传*/

> 上传文件名称和保存路径可修改 `config.json` 中的配置信息，按照官网的配置就可以

#### 上传到七牛云存储 

> 修改 `config.php`

	'upload_type' => 'qiniu',    // qiniu 上传到七牛云存储服务器
	/* 七牛云存储信息配置 */
	'bucket'      => 'gitwiduu', // 七牛Bucket的名称
	'host'        => 'http://gitwiduu.u.qiniudn.com', // 七牛绑定的域名
	'access_key'  => 'KUN6xYZlOAtid2MjHm90-6VFY2M7HC90ijDH4uOR', // 七牛的access_key
	'secret_key'  => 'D-K57TE5hPe3krexftxLWFKmL2xbQEKA-mtkrUfB', // 七牛的secret_key

	/* 上传配置 */
	'timeout'     => '3600',  // 上传时间
	'save_type'   => 'date',  // 保存类型

	/* 水印设置 */
	'use_water'   => false,  // 是否开启水印
	/* 七牛水印图片地址 */
	'water_url'   => 'http://gitwiduu.u.qiniudn.com/ueditor-bg.png',

	/* 水印显示设置 */ 
	'dissolve'    => 50,  // 水印透明度
	'gravity'	  => 'SouthEast',  // 水印位置具体见文档图片说明和选项
	'dx'		  => 10,  //边距横向位置
	'dy'		  => 10   //边距纵向位置

> 修改 `config.json`

	/* 七牛云存储配置start */
	"uploadType" 	   : "qiniu",  /*  [qiniu]七牛云存储 */
	"qiniuUploadType"  : "url",    /*  [url|php] url 通过URL直传，根据token来判断返回地址, php 通过php文件方式传输 */
    "uploadQiniuUrl"   : "http://upload.qiniu.com/", /* 七牛上传地址 */
    "qiniuUploadPath"  : "uploads/",   /* 七牛上传的前缀 */
	"qiniuDatePath"    : "mmdd",       /* 自定义文件夹后的时间例如 uploads/0712 留空uploads/, 格式 yyyy == 2017 yy == 17 mm 月份 07 dd 日期 12 */
	"uploadSaveType"   : "date",       /* 保存文件的名称类型 */
	"getTokenActionName" : "getToken", /* 获取 Token 的方法 */

#### 大视频分片上传

> 修改 `config.json`

	"VideoBlockFileSize" : 4194304,  /* 视频块大小,是每块4MB，所以这个不用修改 */
    "VideoChunkFileSize" : 2097152,  /* 视频上传分块大小，建议是整数倍防止出错，列如1048576（1MB），524288（512KB）默认是2MB */
    "VideoChunkMaxSize"  : 10485760, /* 视频文件超过多大来进行分片上传，现在默认是10MB */
    "ChunkUploadQiniuUrl": "http://upload.qiniu.com", /* 分块上传的首块上传域名为：上传到华东一区的域名为up.qiniu.com、up-z0.qiniu.com和upload.qiniu.com；上传到华北一区的域名为up-z1.qiniu.com和upload-z1.qiniu.com */
    "makeFileActionName" : "makeFile",  /* 合成文件的url方法 */

### 技术支持

QQ: 150093589

