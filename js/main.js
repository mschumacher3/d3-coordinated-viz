
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


     //create Albers equal area conic projection centered on France
    var projection = d3.geo.conicEqualArea()
        .center([39.300299, -99.84375])
        .parallels([43, 62])
        .scale(100)
        .translate([width / 2, height / 2]);


    var path = d3.geo.path()
        .projection(projection);

    //use queue.js to parallelize asynchronous data loading
    var q=d3_queue.queue()   
        q.defer(d3.csv, "data/StateData.csv") //load attributes from csv
        q.defer(d3.json, "data/USAStates.topojson") //load choropleth spatial data
        q.await(callback);
        console.log("2");

    
    function callback(error, csvData, us){
        console.log("3");

        //apply graticule with lines 5 units apart in both dimensions--lat,lon
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
            .enter() //create an element for each datum
            .append("path")//append each element to the svg as path element
            .attr("class", "gratLines")//assign class equal to gratLines
            .attr("d",path);
            //translate the Counties to topojson
        var usUSAStates = topojson.feature(us, us.objects.USAStates);
            //adds out usUSAStates to the map
        var state = map.selectAll(".state")
            .data(usUSAStates)
            .enter()
            .append("path")
            .attr("d", function(d){
                return "state " + d.properties.adm1_code;
             })
            .attr("d", path);
    };
};


