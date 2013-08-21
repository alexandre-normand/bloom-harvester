// Visualization constants 
var startTimestamp = 1371739260474;
var endTimestamp =   1371793345236;                   
var numberOfTables = 2;
var tableBarWidth = 1120 / numberOfTables;
var animationDurationInSeconds = 10;

// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return Math.min(Math.max(d.mapProgress / 2 + d.reduceProgress / 2, 0), 100); }
function y(d) { return d.inputRecord }
function fontSize(d) { return zeroIfNan(d.inputRecord) + zeroIfNan(d.outputRecords); }
function job_name(j) {
  return j.name; 
}
function color(d) {   
  return job_name(d);
}
function contourOpacity(d) {
  var xVal = x(d);
  if (xVal >= 50) {
    return "0.2";
  }
  else {
    return "0.9";
  }
}
function key(d) { return d.name; }

function table_x(d, i) { return i; }
function size(d) { return d.size; }
function table_name(d) {
  return d.name;
}
function table_color(d) {   
  return table_name(d);
}
function table_key(d) {     
  return table_name(d); 
}

function zeroIfNan(d) {
  if (d === null || isNaN(d))
    return 0;
  else 
    return d;
}
var tableData = (function () {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': "./giant-squashes.json",
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
})();

var jobsData = (function () {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': "./little-rabbits.json",
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
})();

function getArrayOfValuesAtIndex(data, accessor, index) { 
  var pairs = accessor.call(data, data); 
  var values = new Array(pairs.length); 
  for (i in pairs) values[i] = pairs[i][index]; 
    return values;  
}

// Chart dimensions.
var margin = {top: 80.5, right: 30.5, bottom: 40.5, left: 60.5},
    width = 1200 - margin.right,
    height = 750 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.linear().domain([0, 100]).range([0, width]),
    yScale = d3.scale.sqrt().domain([0, maximum(jobsData, y)]).range([height, 0]),
    fontScale = d3.scale.sqrt().domain([0, maximum(jobsData, y)]).range([5, 9]),
    colorScale = d3.scale.category20();

var tableXScale = d3.scale.linear().domain([0, numberOfTables]).range([0, width]),    
    tableHeightScale = d3.scale.sqrt().domain([minimum(tableData, size) - 10000, maximum(tableData, size)]).range([0, height]),
    tableLabelPositionScale = d3.scale.sqrt().domain([minimum(tableData, size) - 100, maximum(tableData, size)]).range([height, 80]),
    tableColorScale = d3.scale.category10();

function maximum(data, accessor) {
  return d3.max(data, function(d) { return d3.max(accessor.call(d, d), function(e) { return e[1] })})
}

function minimum(data, accessor) {
  return d3.min(data, function(d) { return d3.min(accessor.call(d, d), function(e) { return e[1] })})
}

// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(3, d3.format(",d")),
    yAxis = d3.svg.axis().orient("right").scale(yScale).ticks(6, d3.format("b"));

// Create the SVG container and set the origin.
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width - 20)
    .attr("y", height + 13)
    .text("marching in hadoop (progress)");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -15)    
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("it's big (number of rows)");

// Load the data.
d3.json("./little-rabbits.json", function(jobs) {

 d3.json("./giant-squashes.json", function(tables) {
  
  // A bisector since many nation's data is sparsely-defined.
  var bisect = d3.bisector(function(d) { return d[0]; });

  // Add the timestamp label; the value is set on transition.
  var label = svg.append("text")
    .attr("class", "timestamp label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(millsecondsToString(startTimestamp - startTimestamp));

  // Add a bar per table. Initialize the data at oldest timestamp, and set the colors.
  var bar = svg.append("g")
      .attr("class", "bars")
    .selectAll(".bar")
      .data(interpolateTableData(startTimestamp))
    .enter().append("rect")
      .attr("class", "bar")
      .style("fill", function(d) { return tableColorScale(table_color(d)); })
      .attr("width", function(d) { return tableBarWidth; })
      .call(tableAttributes)
      .sort(tableOrder);

  // Add a bar per table. Initialize the data at oldest timestamp, and set the colors.
  var barLabels = svg.append("g")
      .attr("class", "bars")
    .selectAll("table label")
      .data(interpolateTableData(startTimestamp))
    .enter().append("text")
      .attr("class", "table label")   
      .attr("text-anchor", "middle")   
      .style("fill", function(d) { return tableColorScale(table_color(d)); })
      .call(tableLabelAttribute)
      .sort(tableOrder);

  // Add a bar per table. Initialize the data at oldest timestamp, and set the colors.
  var tableNameLabels = svg.append("g")
      .attr("class", "bars")
    .selectAll("table namelabel")
      .data(interpolateTableData(startTimestamp))
    .enter().append("text")
      .attr("class", "table namelabel")   
      .attr("text-anchor", "middle")   
      .attr("x", function(d, i) { return tableXScale(table_x(d, i)) + tableBarWidth / 2; })
      .attr("y", height + 35)
      .style("fill", function(d) { return tableColorScale(table_color(d)); })
      .text(function (d) { return table_key(d);})      
      .sort(tableOrder);

  // Add a dot per job. Initialize the data at oldest timestamp, and set the colors.
  var dot = svg.append("g")
      .attr("class", "jobs")
    .selectAll(".job")
      .data(interpolateData(startTimestamp))
    .enter().append("text")
      .attr("class", "job")
      .style("fill", function(d) { return colorScale(color(d)); })            
      .attr("text-anchor", "middle")
      .call(position)
      .sort(order);
  
  // Add a title.
  dot.append("title")
      .text(function(d) { return d.name; });

  // Add an overlay for the timestamp label.
  var box = label.node().getBBox();

  var overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width)
        .attr("height", box.height);

  // Start a transition that interpolates the data based on timestamp.
  svg.transition()
      .duration(animationDurationInSeconds * 1000)
      .ease("log")
      .tween("timestamp", tweenTimestamp)      

  // Positions the dots based on data.
  function position(dot) {
    dot .attr("x", function(d) { return xScale(x(d)); })
        .attr("y", function(d) { return yScale(y(d)); })
        .style("font-size", function(d) { return fontScale(fontSize(d)) + "pt"; })
        .style("stroke-opacity", function(d) { return contourOpacity(d); })
        .text(function (d) { return job_name(d);});
  }

  // Change the bars based on data.
  function tableAttributes(bar) {
    bar .attr("height", function(d) { return tableHeightScale(size(d)); })
        .attr("x", function(d, i) { return tableXScale(table_x(d, i)); })
        .attr("y", function(d) { return height - tableHeightScale(size(d)); });
  }

  // Change the bars based on data.
  function tableLabelAttribute(barLabel) {
    barLabel .attr("x", function(d, i) { return tableXScale(table_x(d, i)) + tableBarWidth / 2; })
             .attr("y", function(d) { return tableLabelPositionScale(size(d)); })             
             .text(function (d) { return sizeToString(size(d));});
  }

  function sizeToString(size) {
    var sizeInKB = size / 1024;
    var sizeInMB = sizeInKB / 1024;
    var sizeInGB = sizeInMB / 1024;
    var sizeInTB = sizeInGB / 1024;

    if (sizeInTB >= 1) {
      return Number(sizeInTB).toFixed(2) + "TB";
    }

    if (sizeInGB >= 1) {
      return Number(sizeInGB).toFixed(2) + "GB";
    }

    if (sizeInMB >= 1) {
      return Number(sizeInMB).toFixed(2) + "MB";
    }

    if (sizeInKB >= 1) {
      return Number(sizeInKB).toFixed(2) + "KB";
    }
  }

  // Defines a sort order so that the smallest dots are drawn on top.
  function order(a, b) {
    return fontSize(b) - fontSize(a);
  }

  // Defines a sort order so that the smallest bars are drawn on top.
  function tableOrder(a, b) {
    return size(b) - size(a);
  }

  // Tweens the entire chart by first tweening the timestamp, and then the data.
  // For the interpolated data, the dots and label are redrawn.
  function tweenTimestamp() {
    var timestamp = d3.interpolateNumber(startTimestamp, endTimestamp);
    return function(t) { displayTimestamp(timestamp(t)); };
  }

  // Updates the display to show the specified timestamp.
  function displayTimestamp(timestamp) {
    bar.data(interpolateTableData(timestamp), table_key).call(tableAttributes).sort(tableOrder);
    barLabels.data(interpolateTableData(timestamp), key).call(tableLabelAttribute).sort(tableOrder);    
    dot.data(interpolateData(timestamp), key).call(position).sort(order);        
    var date = new Date(timestamp);

    label.text(millsecondsToString(timestamp - startTimestamp));
  }

  function millsecondsToString(milliseconds)
  {
    var seconds = milliseconds / 1000;
    var numyears = Math.floor(seconds / 31536000);
    var numdays = Math.floor((seconds % 31536000) / 86400); 
    var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    numseconds = Number((numseconds).toFixed(0));
    return pad(numhours + numdays * 24, 2) + ":" + pad(numminutes, 2) + ":" + pad(numseconds, 2);
  }
  
  // Pad numeric values with leading 0s
  function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
  }

  // Interpolates the dataset for the given (fractional) timestamp.
  function interpolateData(timestamp) {
    return jobs.map(function(d) {
      return {
        name: d.name,        
        mapProgress: interpolateValues(d.mapProgress, timestamp),
        reduceProgress: interpolateValues(d.reduceProgress, timestamp),
        inputRecord: interpolateValues(d.inputRecord, timestamp),
        outputRecords: interpolateValues(d.outputRecords, timestamp)
      };
    });
  }

  // Interpolates the dataset for the given (fractional) timestamp.
  function interpolateTableData(timestamp) {
    return tables.map(function(d) {      
      return {
        name: d.name,        
        size: interpolateValues(d.size, timestamp)
      };
    });
  }

  // Finds (and possibly interpolates) the value for the specified timestamp.
  function interpolateValues(values, timestamp) {
    var i = bisect.left(values, timestamp, 0, values.length - 1),
        a = values[i];
    if (i > 0) {      
      var b = values[i - 1],
           t = (timestamp - a[0]) / (b[0] - a[0]);
      return Math.max(a[1] * (1 - t) + b[1] * t, 0);      
    }   

    return a[1];
  }
});  

});
