
//begin script when window loads
window.onload = setMap();

//sets up choropleth map
function setMap(){
    //set width, height
    var width=1050, 
        height=550;

      //creates an Albers equal area conic projection for the US
    var projection = d3.geo.albersUsa()
        .rotate([96, 0])
        .center([-.6, 38.7])
        .parallels([29.5, 45.5])
        .scale(1070)
        .translate([width / 2, height / 2])

    var path = d3.geo.path()
        .projection(projection);
        
    //use queue.js to parallelize asynchronous data loading
    var q = d3_queue.queue();   
        q
        .defer(d3.csv, "data/StateData.csv") //load attributes from csv
        .defer(d3.json, "data/USAStates.topojson") //load choroplethspatial data
        .await(callback);

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

  

    function callback(error, csvData, us){
        //translate the Counties to topojson
        var usUSAStates = topojson.feature(us, us.objects.USAStates);
        console.log(usUSAStates);

    //add out usCounties to the map
        var state = map.append("path")
          .datum(usUSAStates)
          .attr("class", "state")
          .attr("d", path);
    };
};


