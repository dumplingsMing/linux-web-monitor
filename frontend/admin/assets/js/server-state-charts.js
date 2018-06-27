const stateURL = "http://192.168.12.84:8123/server/?module=all";
const THRESHOLD = 20;

let cpuUtilizationChart;
const cpuUtilizationData = [];
let newestCPUUtilization = 0;

let memoryUtilizationChart;
const memoryUtilizationData = [];
let newestMemoryUtilization = 0;

let cpuAverageChart;
const cpuAverageData1 = [];
const cpuAverageData5 = [];
const cpuAverageData15 = [];
let newestCPUAverage = { "1_min_avg": 0, "5_min_avg": 0, "15_min_avg": 0};

let transferRateChart;
const downloadRateData = [];
const uploadRateData = [];
let newestDownloadRate = 0;
let newestUploadRate = 0;

function draw() {
    cpuUtilizationChart = Highcharts.chart('cpu-utilization-container', {
        title: {
            text: null
        },
        yAxis: {
            title: {
                text: 'CPU Utilization (%)'
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
        tooltip: {
            pointFormat: "<span style=\"color:{series.color}\">\u25CF</span> {series.name}: <b>{point.y}%</b><br/>.\n"
        },
        series: [{
            type: 'area',
            name: 'CPU Utilization',
            data: cpuUtilizationData
        }]
    });

    cpuAverageChart = Highcharts.chart('cpu-average-container', {
        title: {
            text: null
        },
        yAxis: {
            title: {
                text: 'Average CPU Utilization (%)'
            },
            min: 0,
            max: 100
        },
        legend: {
            enabled: true,
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
        tooltip: {
            pointFormat: "<span style=\"color:{series.color}\">\u25CF</span> {series.name}: <b>{point.y}%</b><br/>.\n"
        },
        series: [
            {
                type: 'line',
                name: '1 Min Average',
                data: cpuAverageData1
            },
            {
                type: 'line',
                name: '5 Min Average',
                data: cpuAverageData5
            },
            {
                type: 'line',
                name: '15 Min Average',
                data: cpuAverageData15
            }
        ]
    });

    memoryUtilizationChart = Highcharts.chart('memory-utilization-container', {
        title: {
            text: null
        },
        yAxis: {
            title: {
                text: 'Memory Utilization (MB)'
            },
            min: 0,
            max: 15000
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
        tooltip: {
            pointFormatter: function() {
                return '<span style="color: '+ this.series.color + '">\u25CF</span> '+
                    this.series.name+': <b>'+ this.y +' ('+ (this.y/15735*100).toFixed(2)+'%)</b><br/>.'
            }
        },

        series: [{
            type: 'area',
            name: 'Memory Utilization',
            data: memoryUtilizationData
        }]

    });

    transferRateChart = Highcharts.chart('transfer-rate-container', {
        title: {
            text: null
        },
        yAxis: {
            title: {
                text: 'Transfer Rate (KB/s)'
            },
        },
        legend: {
            enabled: true,
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
        tooltip: {
            pointFormat: "<span style=\"color:{series.color}\">\u25CF</span> {series.name}: <b>{point.y}KB/s</b><br/>.\n"
        },
        series: [
            {
                type: 'line',
                name: 'upload Rate',
                data: uploadRateData
            },
            {
                type: 'line',
                name: 'Download Rate',
                data: downloadRateData
            }
        ]
    });


}

function updateData() {

    $.ajax({
        url: stateURL,
        dataType: 'JSONP',
        success: (data, status, xhttp) => {
            newestCPUUtilization = data.cpu_utilization;
            newestMemoryUtilization = data.current_ram.used;
            newestCPUAverage = data.load_avg;
            newestDownloadRate = data.download_transfer_rate.enp0s31f6;
            newestUploadRate = data.upload_transfer_rate.enp0s31f6;
        }
    });
    let curDate = new Date().toLocaleDateString();
    updateLineSeries(cpuUtilizationChart.series[0], cpuUtilizationData, curDate, newestCPUUtilization);
    updateLineSeries(cpuAverageChart.series[0], cpuAverageData1, curDate, newestCPUAverage["1_min_avg"]);
    updateLineSeries(cpuAverageChart.series[1], cpuAverageData5, curDate, newestCPUAverage["5_min_avg"]);
    updateLineSeries(cpuAverageChart.series[2], cpuAverageData15, curDate, newestCPUAverage["15_min_avg"]);
    updateLineSeries(memoryUtilizationChart.series[0], memoryUtilizationData, curDate, newestMemoryUtilization);
    updateLineSeries(transferRateChart.series[0], uploadRateData, curDate, newestUploadRate);
    updateLineSeries(transferRateChart.series[1], downloadRateData, curDate, newestDownloadRate);
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
