//wraps everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["Norm_Num_firms", "Norm_M_firms", "Norm_F_firms", "Norm_MI_firms", "Norm_NonMI_firms"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

//begins script when window loads
window.onload = setMap();

//sets up choropleth map
function setMap(){
    //map frame size
    var width = 960,
        height = 500;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //creates Albers equal area conic projection for the United States
    //Still need to figure out how to get Hawaii and Alaska on here...
    var projection = d3.geo.albers()
        .rotate([96, 0])
        .center([-.6, 38.7])
        .parallels([29.5, 45.5])
        .scale(1070)
        .translate([width / 2, height / 2])

    var path = d3.geo.path()
        .projection(projection);

    //uses queue.js to parallelize asynchronous data loading
    d3_queue.queue()
        //loads attributes from csv
        .defer(d3.csv, "data/StateData.csv") 
        //loads choropleth spatial data
        .defer(d3.json, "data/USAStates.topojson") 
        .await(callback);

    function callback(error, csvData, us){
        //translates the states topojson
        var usStates = topojson.feature(us, us.objects.USAStatesOnly);
        console.log(usStates);

        //add out usStates to the map
        var states = map.append("path")
          .datum(usStates)
          .attr("class", "states")
          .attr("d", path);
    };
};


//writing a function to join the data from the csv and geojson
function joinData (usStates, csvData){

      //loops through csv to assign each set of csv attribute values to geojson
      for (var i= 0; i<csvData.length; i++){
      var csvRegion = csvData[i];
      var csvKey = csvRegion.Name;

        //loops through geojson regions to find correct region
        for (var a=0; a<worldcountries.length; a++){
          var geojsonProps = usStates[a].properties;
          var geojsonKey = geojsonProps.name;


          if (geojsonKey==csvKey){
            attrArray.forEach(function(attr){
              var val = parseFloat(csvRegion[attr]);
              geojsonProps[attr] = val;
            });
          };
        };
    };
    return usStates;
};

function setEnumerationUnits(usStates, map, path, colorScale){    
  var states = map.selectAll(".states")
          .data(usStates)
          .enter()
          .append("path")
          .attr("class", function(d){
            return "states " + d.properties.name;

          })

          .attr("d",path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        });
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scale.quantile()
        .range(colorClasses);
     //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //  //build two-value array of minimum and maximum expressed attribute values
    // var minmax = [
    //     d3.min(data, function(d) { return parseFloat(d[expressed]); }),
    //     d3.max(data, function(d) { return parseFloat(d[expressed]); })
    //     ];

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    return colorScale;

};


//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460;

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    var yScale = d3.scale.linear()
        .range([0, chartHeight])
        .domain([0, 105]);
    //set bars for each province
       var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.adm0_a3;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartWidth / csvData.length);
        })
        .attr("height", function(d){
            return yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

     var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.adm1_code;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        })
})();







