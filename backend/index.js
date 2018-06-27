var express = require('express')
var app     = require('express')()
var server  = require('http').Server(app)
var path    = require('path')
var spawn   = require('child_process').spawn
var fs      = require('fs')
var ws      = require('websocket').server
var args    = require('yargs').argv
var http    = require('http')
var port    = args.port || process.env.LINUX_DASH_SERVER_PORT || 80

server.listen(port, function() {
  console.log('Linux Dash Server Started on port ' + port + '!');
})

app.use(express.static(path.resolve(__dirname + '/../frontend/admin/')))

app.get('/', function (req, res) {
    console.log(path.resolve(__dirname + '/../frontend/admin/index.html'))
    res.sendFile(path.resolve(__dirname + '/../frontend/admin/index.html'))
})

app.get('/websocket', function (req, res) {

  res.send({
    websocket_support: true,
  })

})

wsServer = new ws({
	httpServer: server
})

var nixJsonAPIScript = __dirname + '/linux_json_api.sh'

function getPluginData(pluginName, callback) {
  var command = spawn(nixJsonAPIScript, [ pluginName, '' ])
  var output  = []

  command.stdout.on('data', function(chunk) {
    output.push(chunk.toString())
  })

  command.on('close', function (code) {
    callback(code, output, pluginName)
  })
}

wsServer.on('request', function(request) {

	var wsClient = request.accept('', request.origin)

  wsClient.on('message', function(wsReq) {

    var moduleName = wsReq.utf8Data
    var sendDataToClient = function(code, output) {
      if (code === 0) {
        var wsResponse = '{ "moduleName": "' + moduleName + '", "output": "'+ output.join('') +'" }'
        wsClient.sendUTF(wsResponse)
      }
    }

    getPluginData(moduleName, sendDataToClient)

  })

})

var allDataModules = ["cpu_utilization", "current_ram", "load_avg", "download_transfer_rate", "upload_transfer_rate"]

app.get('/server/', function (req, res) {

	var respondWithData = function(code, output) {
		if (code === 0) res.send(output.toString())
		else res.sendStatus(500)
	}

    var batchedData = "{"
    var finishedCnt = 0
    var concatData = function(code, output, moduleName) {
        if (code === 0) {
            batchedData += "\"" + moduleName + "\" : " + output.toString()
        }
        finishedCnt += 1
        if (finishedCnt === allDataModules.length)
            res.send(req.query.callback + "(" + batchedData + "})")
        else
            batchedData += ", "
    }


  if (req.query.module === "all") {
      for (var i = 0; i < allDataModules.length; i++) {
          var moduleName = allDataModules[i]
          getPluginData(moduleName, concatData)
      }
  }
  else
    getPluginData(req.query.module, respondWithData)
})

app.get('/pingTime/', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.send(JSON.stringify(dataInternal));
});

var pingIntervalId = setInterval(ping, 1000);
var dataInternal = new Array();
const THRESHOLD = 20;

function ping(){
  console.log("ping");
  // An object of options to indicate where to post to
  var post_options = {
    host: '218.193.183.164',
    port: '3000',
    path: '/users/getUser',
    method: 'POST'
  };

  var date = new Date();
  var time1 = date.getTime();

  var req = http.request(post_options, function(res) {
    console.log("Got response: " + res.statusCode);
    var time2 = new Date().getTime();
    addData(date, time2 - time1);
  });

  req.on('error', function(e){
    console.log(e);
    // stop pinging and send bug-report email
    clearInterval(pingIntervalId);
    sendEmail();
  })
  
  req.write("");
  req.end();
}

function addData(date, latency){
    // emulate new data
    var newItem = new Array();
    newItem.push(date.toLocaleTimeString());
    newItem.push(latency);
    dataInternal.push(newItem);

    if(dataInternal.length > THRESHOLD){
        dataInternal.splice(0,1);
    }
}

function sendEmail(){
  console.log("sendEmail");
  var email   = require("emailjs");
  var server  = email.server.connect({
      user:    "1358313967@qq.com",      // 你的QQ用户
      password:"fkibvwikqdzzfjgd",           // 注意，不是QQ密码，而是刚才生成的授权码
      host:    "smtp.qq.com",         // 主机，不改
      ssl:     true                   // 使用ssl
  });

  //开始发送邮件
  server.send({
      text:    "The server is down! 218.193.183.164:3000 cannot be reached!",       //邮件内容
      from:    "1358313967@qq.com",        //谁发送的
      to:      "123@123.com",       //发送给谁的
      subject: "Server report"          //邮件主题
  }, function(err, message) {
      //回调函数
      console.log(err || message);
  });

  server.send({
    text:    "The server is down! 218.193.183.164:3000 cannot be reached!",       //邮件内容
    from:    "1358313967@qq.com",        //谁发送的
    to:      "lijiaqi2017@sjtu.edu.cn",       //发送给谁的
    subject: "Server report"          //邮件主题
  }, function(err, message) {
      //回调函数
      console.log(err || message);
  });
}