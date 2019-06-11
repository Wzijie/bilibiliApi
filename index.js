var express = require('express');
// express 用来完成API的路由访问配置
var app = express();

// superagent 用来完成对网站页面的访问
var superagent = require('superagent');

// cheerio 用来处理数据访问返回的HTML数据
var cheerio = require('cheerio');

var server = app.listen(8888, function () {
	var port = server.address().port;
	console.log('server start, port:' + port);
});

const allowOrigins = ['http://a.com', 'http://b.com'];

const userAgent = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36';

// 设置静态文件目录
app.use(express.static('public'));

app.all('*', function (req, res, next) {
	if (req.path !== '/' && !req.path.includes('.')) {
		// console.log(req.headers);
		const { headers: { origin = '' } } = req;
		// res.header('Access-Control-Allow-Credentials', true)

		// 这里获取 origin 请求头 而不是用 *
		// const isAllowOrigin = allowOrigins.includes(origin) || origin.includes('localhost');
		// res.header('Access-Control-Allow-Origin', isAllowOrigin ? origin : null);

		// 暂时用*
		res.header('Access-Control-Allow-Origin', '*');

		// res.header('Access-Control-Allow-Headers', 'X-Requested-With')
		// res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
		// res.header('Content-Type', 'application/json;charset=utf-8')
	}
	next()
})

// 视频信息获取
// 页面抓取数据
app.get('/video/description', function (request, response) {

	var aid = request.query.aid;

	var responseObj = {
		success: true,
		data: {}
	}

	var infoRequestURL = `http://m.bilibili.com/video/av${aid}.html`;
	var detaiedRequestURL = `https://api.bilibili.com/x/web-interface/archive/stat?jsonp=jsonp&aid=${aid}`;

	var videoInfo = {};
	var detaied = {};

	var infoRequest = new Promise((resolve, reject) => {
		superagent.get(infoRequestURL).set('User-Agent', userAgent).end(function (err, superagentRes) {
			if (!err) {

				// 使用 cheerio 加载 dom
				// decodeEntities 指定不把中文字符转为 unicode 字符
				// superagentRes.text为页面所有dom节点 <html>...</html>
				var $ = cheerio.load(superagentRes.text, { decodeEntities: false });

				// 用户名
				videoInfo.username = $('span[itemprop="name"]').text();
				// 头像URL
				videoInfo.face = $('.index__upFace__src-videoPage-upInfo-').find('img').attr('src');
				// 视频标题
				videoInfo.title = $('.index__title__src-videoPage-videoInfo-').text();
				// 视频描述
				videoInfo.descript = $('span[itemprop="description"]').text();
				// 导航 主页>二级页>三级页
				videoInfo.navInfo = [];
				// 视频创建时间
				videoInfo.createTime = $('.index__time__src-videoPage-upInfo-').text();

				var navInfoEle = $('.index__crumb__src-videoPage-videoInfo-');
				navInfoEle.each(function (index, navInfoItem) {
					videoInfo.navInfo.push($(navInfoItem).text());
				});

				// responseObj.data = videoInfo;
				console.log('get success');
				resolve();

			} else {
				responseObj.success = false;
				reject(err);
				console.log('get data error');
			}

			// response.send(responseObj);

		});
	})

	var detaiedRequest = new Promise((resolve, reject) => {
		superagent.get(detaiedRequestURL).end(function (err, superagentRes) {
			if (!err) {
				detaied = JSON.parse(superagentRes.text);
				resolve();
				console.log('detaied success');
			} else {
				responseObj.success = false;
				reject(err);
				console.log('err');
			}
		});
	});

	var allRequestSuceess = Promise.all([infoRequest, detaiedRequest]);
	allRequestSuceess.then(() => {
		responseObj.data = Object.assign({}, videoInfo, detaied.data);
		response.send(responseObj);
	})
	.catch(err => {
		response.send({ ...responseObj, data: err });
	});

});

// partList数据获取
// 页面抓取数据
app.get('/video/part', function (request, response) {

	var aid = request.query.aid;

	var responseObj = {
		success: true,
		data: {}
	}

	superagent.get(`http://m.bilibili.com/video/av${aid}.html`).set('User-Agent', userAgent).end(function (err, superagentRes) {

		if (!err) {

			var partData = [];

			var $ = cheerio.load(superagentRes.text, { decodeEntities: false });

			var partList = $('.index__part__src-videoPage-multiP-part-');

			partList.each(function (index, partListItem) {
				partData.push($(partListItem).find('p').text());
			});

			responseObj.data = partData;
			console.log('part success');
		} else {
			responseObj.success = false;
			console.log('part error');
		}

		response.send(responseObj);

	});



});

/*
 *  转发请求 start
 *  下面内容为转发请求
 */

// 主页banner数据
// 转发请求
app.get('/indexBanner', function (request, response) {


	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,主页banner数据'
	}

	var requestURL = 'http://api.bilibili.com/x/web-show/res/loc?jsonp=jsonp&pf=7&id=1695';

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text).data;
			console.log('indexBanner success');
		} else {
			responseObj.success = false;
			console.log('indexBanner err');
		}

		response.send(responseObj);

	});

});

// 直播页数据
// 转发请求
app.get('/live', function (request, response) {


	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,直播页数据'
	}

	var requestURL = 'http://api.live.bilibili.com/AppIndex/home?device=phone&platform=ios&scale=3&build=10000';

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text).data;
			console.log('live success');
		} else {
			responseObj.success = false;
			console.log('err');
		}

		response.send(responseObj);

	});

});

// 主页推荐视频数据
// 转发请求
app.get('/indexRecommend', function (request, response) {


	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,主页推荐视频数据'
	}

	// var requestURL = 'http://www.bilibili.com/index/ranking-3day.json';
	var requestURL = 'https://api.bilibili.com/x/web-interface/ranking/index?day=3';

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text);
			console.log('indexRecommend success');
		} else {
			responseObj.success = false;
			console.log('err');
		}

		response.send(responseObj);

	});

});

// 主页番剧更新数据
// 转发请求
app.get('/indexBangumi', function (request, response) {


	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,主页番剧更新数据'
	}

	var requestURL = 'http://www.bilibili.com/api_proxy?app=bangumi&action=timeline_v2';

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text);
			console.log('indexBangumi success');
		} else {
			responseObj.success = false;
			console.log('err');
		}

		response.send(responseObj);

	});

});

// 主页大部分数据
// 转发请求
app.get('/indexMain', function (request, response) {


	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,主页大部分数据'
	}

	// var requestURL = 'http://m.bilibili.com/index/ding.html';
	var requestURL = 'https://api.bilibili.com/x/web-interface/dynamic/index';

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			function createStructrue(title, icon, dataKey) {
				return {
					title,
					icon,
					dataKey,
					list: []
				};
			}

			let dataList = [
				createStructrue('番剧', 'douga', '13'),
				createStructrue('动画', 'douga', '1'),
				createStructrue('音乐', 'music', '3'),
				createStructrue('游戏', 'game', '4'),
				createStructrue('电影', 'movie', '23'),
				createStructrue('科技', 'technology', '36'),
				createStructrue('生活', 'life', '160'),
				createStructrue('鬼畜', 'kichiku', '119'),
				createStructrue('时尚', 'fashion', '155'),
				createStructrue('娱乐', 'ent', '5'),
				createStructrue('电视剧', 'teleplay', '11'),
				createStructrue('舞蹈', 'dance', '129'),
				createStructrue('广告', 'advertise', '165'),
				createStructrue('国创', 'guoman', '168'),
			];

			let result = JSON.parse(superagentRes.text).data;

			dataList.forEach((dataItem) => {
				dataItem.list = result[dataItem.dataKey].slice(0, 4);
			});


			responseObj.data = dataList;
			console.log('indexMain success');
		} else {
			responseObj.success = false;
			console.log('err');
		}

		response.send(responseObj);

	});

});

// 排行榜数据
// 转发请求
app.get('/rank', function (request, response) {


	// var rankingKey = request.params.rankingKey;
	var rankId = request.query.rankId || '0';
	var day = request.query.day || '3';

	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,排行榜数据'
	}

	// var requestURL = 'http://m.bilibili.com/rank/'+ rankingKey +'.json';
	var requestURL = `https://api.bilibili.com/x/web-interface/ranking?rid=${rankId}&day=${day}`;

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text);
			console.log('rank success');
		} else {
			responseObj.success = false;
			console.log('err');
		}

		response.send(responseObj);

	});
});

// 热门搜索数据
// 转发请求
app.get('/search/hot', function (request, response) {

	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,热门搜索数据'
	}

	var requestURL = 'http://www.bilibili.com/search?action=hotword&main_ver=v1';

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text).list;
			console.log('/search/hot success');
		} else {
			responseObj.success = false;
			console.log('/search/hot err');
		}

		response.send(responseObj);

	});
});

// 搜索结果
// 转发请求
/*
app.get('/search', function (request, response) {


	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,搜索结果数据'
	}

	// 中文的话需要转码
	var keyword = encodeURI(request.query.keyword || '你搜的啥');
	var type = request.query.type || 'video';
	var tids = request.query.tids || '-1';
	var order = request.query.order || 'default';
	var page = request.query.page || '1';

	var requestURL = 'https://www.bilibili.com/search?action=autolist&main_ver=v1&pagesize=20&keyword=' + keyword + '&page=' + page + '&order=' + order + '&tids=' + tids + '&type=' + type;

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = superagentRes.text;
			console.log('search success');
		} else {
			responseObj.success = false;
			console.log('err');
		}

		response.send(responseObj);

	});
});
*/

app.get('/test', function (request, response) {

	// '*' 允许所有人访问
	response.header("Access-Control-Allow-Credentials", "true");
	response.header("Access-Control-Allow-Origin", "http://localhost:8080");

	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,搜索结果数据'
	};

	var requestData = {
		user: request.query.userid,
		pwd: request.query.pwd,
		captcha: request.query.vdcode,
		keeptime: 'true',
		gourl: 'http://m.bilibili.com/space.html'
	};

	// var cookie;

	// superagent.get('https://passport.bilibili.com/login')
	// 	.end(function(err, superagentRes){
	// 		cookie = superagentRes.header['set-cookie'][2];
	// 		console.log(superagentRes.header['set-cookie'][2]);
	// 		console.log(superagentRes.header['set-cookie'].length);
	// 		console.log(requestData);
	// 		postLogin();
	// 	});

	// console.log('cookie');
	console.log(request.headers.cookie, '123');

	var requestCookie = request.headers.cookie;
	var requestURL = 'https://passport.bilibili.com/web/login';

	// function postLogin(){
	superagent.post(requestURL)

		.set('Accept', 'application/json, text/javascript, */*; q=0.01')
		.set('Accept-Encoding', 'gzip, deflate')
		.set('Accept-Language', 'zh-CN,zh;q=0.8')
		// .set('Cache-Control', 'max-age=0')
		.set('Connection', 'keep-alive')
		// .set('Content-Length', '296')
		.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
		.set('Cookie', requestCookie)
		.set('Host', 'passport.bilibili.com')
		.set('Origin', 'https://passport.bilibili.com')
		.set('Referer', 'https://passport.bilibili.com/login')
		.set('Upgrade-Insecure-Requests', '1')
		.set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1')
		.set('X-Requested-With', 'XMLHttpRequest')
		// .withCredentials()
		.send(requestData)
		.end(function (err, superagentRes) {

			if (!err) {
				responseObj.data = superagentRes.text;
				// console.log(superagentRes);
				console.log('login success');
			} else {
				responseObj.success = false;
				console.log('login err');
			}

			response.send(responseObj);

		});
	// }
});


app.get('/captcha', function (request, response) {

	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,搜索结果数据'
	};

	var requestURL = 'https://passport.bilibili.com/captcha?r=' + Math.random();

	superagent.get(requestURL)
		.end(function (err, superagentRes) {

			if (!err) {
				responseObj.data = superagentRes.text;
				console.log('captcha success');
				console.log(superagentRes.header['set-cookie']);
			} else {
				responseObj.success = false;
				console.log('captcha err');
			}
			response.header("set-cookie", superagentRes.header['set-cookie'][1]);
			response.send(superagentRes.body);

		});
});

app.get('/getkey', function (request, response) {


	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,getkey'
	}

	var requestURL = 'https://passport.bilibili.com/login?act=getkey&r=' + Math.random();

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = superagentRes.text;
			console.log('getkey success');
		} else {
			responseObj.success = false;
			console.log('err');
		}

		response.send(responseObj);

	});
});


// 主页直播数据
app.get('/indexLive', function (request, response) {

	// response.header('Content-Type', 'image/*');

	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,主页直播数据'
	}

	var requestURL = 'http://api.live.bilibili.com/h5/recommendRooms?_=' + Date.now();

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			// jsonp方式的返回数据，字符串左右有函数的括号，slice截取'({...data});' -> '{...data}'
			responseObj.data = JSON.parse(superagentRes.text.slice(1, -2));
			console.log('indexLive success');
		} else {
			responseObj.success = false;
			console.log('err');
		}

		response.send(responseObj);

	});

});


// 图片的转接 因防盗链的限制
app.get('/img', function (request, response) {


	var requestURL = request.query.url

	if (!requestURL) {
		response.send('');
		return false;
	}
	// console.log(requestURL);
	superagent.get(request.query.url)
		// .set('Referer', '')
		// .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1')
		// .accept('image/webp,image/apng,image/*,*/*;q=0.8')
		.end(function (err, superagentRes) {
			if (err) {
				// console.log(1);
				response.send(err);
				return;
			}
			// console.log(2);
			response.send(superagentRes.body);
		});
});

// 播放器
app.get('/video/player', function (request, response) {

	var responseObj = {
		success: true,
		data: {},
		messgae: 'nodejs转发数据,播放器数据'
	}

	let aid = request.query.aid;
	let page = request.query.page;

	var requestURL = `https://api.bilibili.com/playurl?aid=${aid}&page=${page}&platform=html5&quality=1&vtype=mp4&token=b2ef39252e8c8673f13e66da95db9a76`;
	// console.log(requestURL);
	// `http://api.bilibili.com/playurl?callback=getPlayerData&aid=${aid}&page=${page}&platform=html5&quality=1&vtype=mp4&type=jsonp&token=fb4ddc7a1b10ee45bd962f2833c453c2&_=${Date.now()}`;
	superagent.get(requestURL)
		// .set('Accept', '*/*')
		// .set('Accept-Encoding', 'gzip, deflate, br')
		// .set('Accept-Language', 'zh-CN,zh;q=0.8')
		// .set('Cache-Control', 'max-age=0')
		// .set('Connection', 'keep-alive')
		// .set('Content-Length', '296')
		// .set('Content-Type', 'application/json')
		// .set('Host', 'api.bilibili.com')
		// .set('Origin', 'https://m.bilibili.com/video.html')
		// .set('Referer', '')
		// .set('Upgrade-Insecure-Requests', '1')
		.set('Cookie', `purl_token=bilibili_${Math.round(Date.now() / 1000)}`)
		.set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1')
		.end(function (err, superagentRes) {

			if (!err) {
				responseObj.data = JSON.parse(superagentRes.text);
				console.log('player success');
			} else {
				responseObj.success = false;
				console.log('err');
				// console.log(err);
				// console.log(superagentRes);
			}
			// console.log(superagentRes.text);
			response.send(responseObj);

		});

});

// 视频tag
app.get('/video/tag', function (request, response) {

	var aid = request.query.aid;

	var responseObj = {
		success: true,
		data: {}
	}

	var requestURL = `http://api.bilibili.com/x/tag/archive/tags?aid=${aid}&jsonp=jsonp&_=${Date.now()}`;

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text).data;
			console.log('video/tag success');
		} else {
			responseObj.success = false;
			console.log('video/tag err');
		}

		response.send(responseObj);

	});

});


// 视频相关推荐
app.get('/video/recommend', function (request, response) {

	var aid = request.query.aid;

	var responseObj = {
		success: true,
		data: {}
	}


	var requestURL = `https://comment.bilibili.com/recommendnew,${aid}`;

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text).data;
			console.log('/video/recommend success');
		} else {
			responseObj.success = false;
			console.log('/video/recommend err');
		}

		response.send(responseObj);

	});

});

// 评论
app.get('/video/comment', function (request, response) {

	const { aid, type = 1, sort = 2, pn = 1, nohot = 1 } = request.query;

	var responseObj = {
		success: true,
		data: {}
	}

	var requestURL = `https://api.bilibili.com/x/v2/reply?type=${type}&sort=${sort}&oid=${aid}&pn=${pn}&nohot=${nohot}&_=${Date.now()}`;

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			responseObj.data = JSON.parse(superagentRes.text).data;
			console.log('/video/comment success');
		} else {
			responseObj.success = false;
			console.log('/video/comment err');
		}

		response.send(responseObj);

	});

});

// 搜索建议
app.get('/search/suggest', function (request, response) {

	let { keyword } = request.query;
	keyword = encodeURI(keyword);

	var responseObj = {
		success: true,
		data: {}
	}

	var requestURL = `https://s.search.bilibili.com/main/suggest?func=suggest&suggest_type=accurate&sub_type=tag&main_ver=v1&highlight=&bangumi_acc_num=3&special_acc_num=0&upuser_acc_num=0&tag_num=10&term=${keyword}&rnd=${Math.random()}&_=${Date.now()}`;

	superagent.get(requestURL).end(function (err, superagentRes) {

		if (!err) {
			let data = JSON.parse(superagentRes.text);
			if (!data.result.tag) {
				data.result.tag = [];
			}
			responseObj.data = data.result.tag;
			console.log('/search/suggest success');
		} else {
			responseObj.success = false;
			console.log('/search/suggest err');
		}

		response.send(responseObj);

	});

});

// 搜索
app.get('/search', function (request, response) {

	response.header('Cache-Control', 'max-age=1800');

	let { keyword, search_type, order, page } = request.query;
	keyword = encodeURI(keyword);

	var responseObj = {
		success: true,
		data: {}
	};

	var requestURL = 'https://m.bilibili.com/search/searchengine';

	var sendData = {
		bangumi_num: 3,
		keyword: keyword,
		main_ver: "v3",
		movie_num: 3,
		order: order,
		page: page,
		pagesize: 20,
		platform: "h5",
		search_type: search_type
	};

	superagent.post(requestURL)
		.send(sendData)
		.end(function (err, superagentRes) {

			if (!err) {
				console.log('search success');
				let data = JSON.parse(superagentRes.text);
				if (data.result.video) {
					data.result = data.result.video;
				}
				responseObj.data = data;
			} else {
				console.log('search err');
			}

			response.send(responseObj);

		});

});

// 视频详情
app.get('/video/desc', function (request, response) {

	const { aid } = request.query;

	var responseObj = {
		success: true,
		data: {}
	};

	var requestURL = `https://api.bilibili.com/x/web-interface/view?aid=${aid}`;

	superagent.get(requestURL)
		.end(function (err, superagentRes) {
			if (!err) {
				console.log('/video/desc success');
				const { 
					title,
					owner: { name, face },
					desc,
					stat: { view, danmaku, favorite },
					ctime,
				} = JSON.parse(superagentRes.text).data;

				responseObj.data = {
					title,
					username: name,
					face,
					desc,
					view,
					danmaku,
					favorite,
					createTime: ctime * 1000,
					navInfo: [],
				};
			} else {
				console.log('/video/desc err');
				responseObj.success = false;
			}

			response.send(responseObj);
		});
});
