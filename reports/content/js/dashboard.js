/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7625, 1000, 4000, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 1000, 4000, "dashboard-1"], "isController": false}, {"data": [0.95, 1000, 4000, "Login  Request-1"], "isController": false}, {"data": [1.0, 1000, 4000, "employee list-0"], "isController": false}, {"data": [0.925, 1000, 4000, "Login  Request-0"], "isController": false}, {"data": [0.575, 1000, 4000, "Employee Flow"], "isController": true}, {"data": [1.0, 1000, 4000, "dashboard-0"], "isController": false}, {"data": [0.575, 1000, 4000, "employee list"], "isController": false}, {"data": [0.5, 1000, 4000, "Login  Request"], "isController": false}, {"data": [0.55, 1000, 4000, "dashboard"], "isController": false}, {"data": [0.4, 1000, 4000, "Login Flow"], "isController": true}, {"data": [0.675, 1000, 4000, "open login page"], "isController": false}, {"data": [1.0, 1000, 4000, "employee list-1"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 200, 0, 0.0, 827.0450000000001, 454, 2213, 626.5, 1240.6, 1501.95, 2052.140000000001, 4.571533063612883, 14.480643486136826, 1.3011011680266977], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["dashboard-1", 20, 0, 0.0, 551.95, 485, 653, 542.0, 624.6, 651.65, 653.0, 0.7414272474513438, 2.746792458294717, 0.1484302594995366], "isController": false}, {"data": ["Login  Request-1", 20, 0, 0.0, 727.05, 532, 1313, 618.5, 1037.3000000000002, 1299.4999999999998, 1313.0, 0.7068636460026861, 2.7114502522619635, 0.14151078850639712], "isController": false}, {"data": ["employee list-0", 20, 0, 0.0, 535.5500000000001, 475, 704, 521.0, 659.4000000000002, 702.35, 704.0, 0.7639419404125286, 0.69157634644767, 0.16039796600458364], "isController": false}, {"data": ["Login  Request-0", 20, 0, 0.0, 704.1, 504, 1290, 608.0, 1063.6000000000001, 1278.7999999999997, 1290.0, 0.6991784653032687, 0.6329476927110644, 0.22272657752141234], "isController": false}, {"data": ["Employee Flow", 20, 0, 0.0, 1086.2500000000002, 981, 1287, 1076.0, 1228.8000000000002, 1284.45, 1287.0, 0.7265857734505559, 3.347758142301824, 0.29801369614182954], "isController": true}, {"data": ["dashboard-0", 20, 0, 0.0, 535.1499999999999, 454, 658, 527.0, 625.4000000000001, 656.4499999999999, 658.0, 0.7415921984500724, 0.671343718714079, 0.15208433757276874], "isController": false}, {"data": ["employee list", 20, 0, 0.0, 1086.2500000000002, 981, 1287, 1076.0, 1228.8000000000002, 1284.45, 1287.0, 0.7463800567248843, 3.4389606890953877, 0.30613244514106586], "isController": false}, {"data": ["Login  Request", 20, 0, 0.0, 1432.1, 1037, 2213, 1216.5, 2044.4, 2205.0, 2213.0, 0.6863889079552474, 3.2542810826927036, 0.3560642460017846], "isController": false}, {"data": ["dashboard", 20, 0, 0.0, 1087.8500000000001, 939, 1237, 1062.5, 1235.2, 1237.0, 1237.0, 0.7259791643979817, 3.3467710375149733, 0.2942200715089477], "isController": false}, {"data": ["Login Flow", 20, 0, 0.0, 3580.55, 2793, 4461, 3538.5, 4232.400000000001, 4450.75, 4461.0, 0.6188693257418697, 8.113050503604914, 0.6818441145527122], "isController": true}, {"data": ["open login page", 20, 0, 0.0, 1060.6, 514, 1854, 1162.5, 1502.0, 1836.3999999999996, 1854.0, 0.6969369620517825, 2.6192987289612155, 0.12386965536467227], "isController": false}, {"data": ["employee list-1", 20, 0, 0.0, 549.8500000000001, 496, 642, 533.5, 625.8000000000001, 641.25, 642.0, 0.7612377726182773, 2.818289570090968, 0.15239623377611997], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 200, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
