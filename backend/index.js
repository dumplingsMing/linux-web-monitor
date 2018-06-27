var express = require('express')
var app     = require('express')()
var server  = require('http').Server(app)
var path    = require('path')
var spawn   = require('child_process').spawn
var fs      = require('fs')
var ws      = require('websocket').server
var args    = require('yargs').argv
var port    = args.port || process.env.LINUX_DASH_SERVER_PORT || 80

server.listen(port, function() {
  console.log('Linux Dash Server Started on port ' + port + '!');
})

app.use(express.static(path.resolve(__dirname + '/../../../web/admin/')))

app.get('/', function (req, res) {
    console.log(path.resolve(__dirname + '/../../../web/admin/index.html'))
	res.sendFile(path.resolve(__dirname + '/../../../web/admin/index.html'))
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
