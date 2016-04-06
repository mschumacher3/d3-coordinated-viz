//wrap everything in a self-executing anonymous function to move to local scope
(function(){

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
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

})();