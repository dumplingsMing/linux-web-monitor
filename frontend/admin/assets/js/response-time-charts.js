var url = "http://218.193.183.164:8123/pingTime";
const THRESHOLD = 20;

let localResponseChart;
const localResponseData = [];
let newestLocalResponseTime = 0;

let serverResponseChart;
let serverResponseData = [];
let newestServerResponseTime = 0;



function draw() {
    localResponseChart = Highcharts.chart('local-responsetime-container', {
        title: {
            text: null
        },

        xAxis: {
            type: "date"
        },
        yAxis: {
            title: {
                text: 'Response Time (ms)'
            },
            min: 0,
            max: 100
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                threshold: null
            }
        },
        series: [{
            type: 'area',
            name: 'Response Time',
            data: localResponseData
        }]
    });

    serverResponseChart = Highcharts.chart('server-responsetime-container', {
        title: {
            text: null
        },
        xAxis: {
            type: "date"
        },
        yAxis: {
            title: {
                text: 'Response Time (ms)'
            },
            min: 0,
            max: 100
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                threshold: null
            }
        },
        series: [{
            type: 'area',
            name: 'Response Time',
            data: serverResponseData
        }]
    });
}


function ping(){
    var url = "http://218.193.183.164:3000/users/getUser";

    var date = new Date();
    var time1 = date.getTime();
    $.post(url,function(res,status){
        var time2 = new Date().getTime();
        newestLocalResponseTime = {date: date, time: time2 - time1};
    }).fail(function(){
        // stop pinging and send bug-report email
        alert("the server is down!");
    });
}

function updateData() {
    ping();

    $.getJSON(url,function(data){
       serverResponseData  = data;
    });
    serverResponseChart.series[0].setData(serverResponseData);
    updateLineSeries(localResponseChart.series[0], localResponseData, newestLocalResponseTime.date, newestLocalResponseTime.time);
}

function updateLineSeries(series, data, date, newEntry) {
    if (data.length >= THRESHOLD) {
        data.shift();
        series.setData([]);
    }
    let newItem = [];
    newItem.push(date);
    newItem.push(newEntry);
    data.push(newItem);
    series.setData(data);
}


$(function(){
    draw();
    setInterval(updateData, 1000)
});