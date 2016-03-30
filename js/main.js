
//begin script when window loads
window.onload = setMap();

//sets up choropleth map
function setMap(){
    //set width, height
    var width=1050, 
        height=800;
        console.log("1");

    //creates new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);


    //create natural earth projection of world
  var projection=d3.geo.naturalEarth()
      .scale(2000)
      .translate([width/2,height/2])
   


    var path = d3.geo.path()
        .projection(projection);

    //use queue.js to parallelize asynchronous data loading
    var q=d3_queue.queue()   
        q.defer(d3.csv, "data/StateData.csv") //load attributes from csv
        q.defer(d3.json, "data/USAStates.topojson") //load choropleth spatial data
        q.await(callback);
        console.log("2");

    
    function callback(error, csvData, state){
        

        //apply graticule with lines 10 units apart in both dimensions--lat,lon
        var graticule=d3.geo.graticule()
            .step([10,10]);

        //apply background to graticule
        var gratBackground=map.append("path")
            .datum(graticule.outline())
            .attr("class","gratBackground")
            .attr("d",path)

        //add graticule lines
        var gratLines=map.selectAll(".gratLines")
            .data(graticule.lines())
            .enter() 
            .append("path")
            .attr("class", "gratLines")
            .attr("d",path);
            //translate the states to topojson
        var stateUSAStates = topojson.feature(state, state.objects.state);
            //adds USAStates to the map
        var selectStates=map.selectAll(".selectStates")
            .data(stateUSAStates)
            .enter()
            .append("path")
            .attr("class", function(d){
              return "selectStates " + d.properties.adm1_code;

            })
            .attr("d",path);//assign d with attribute path
    };
};


