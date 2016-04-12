//wraps everything in a self-executing anonymous function to move to local scope
(function(){

  //pseudo-global variables
  var attrArray = ["Norm_Num_firms", "Norm_M_firms", "Norm_F_firms", "Norm_MI_firms", "Norm_NonMI_firms"];
  var expressed = attrArray[0]; //initial attribute

  //thought this may be easier... doesn't seem like it 
  //global variables to assign colors to each variable
  // var objectColors={
  //       Norm_Num_firms:['#ffffcc','#c2e699','#78c679','#31a354','#006837'],
  //       Norm_M_firms:['#c2e699','#78c679','#31a354','#006837'],
  //       Norm_F_firms:['#005a32','#238443','#41ab5d','#78c679','#addd8e','#d9f0a3','#ffffcc'],
  //       Norm_MI_firms:['#005a32','#238443','#41ab5d','#78c679','#addd8e','#d9f0a3','#ffffcc'],
  //       Norm_NonMI_firms:['#ffffcc','#c2e699','#78c679','#31a354','#006837']};

  //assigns chart titles to each variable
  var chartTitles={
      Norm_Num_firms:['Total Number of Firms'],
      Norm_M_firms:['Number of Firms Owned by Men'],
      Norm_F_firms:['Number of Firms Owned by Women'],
      Norm_MI_firms:['Number of Firms Owned by Minorities'],
      Norm_NonMI_firms:['Number of Firms not Owned by Minorities']};

  //chart frame dimensions
  var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  //create a scale to size bars proportionally to frame and for axis
  var yScale = d3.scale.linear()
    .range([463, 0])
    .domain([0, 110]);

  //begins script when window loads
  window.onload = setMap();

  //sets up choropleth map
  function setMap(){
    //map frame size
    var width = window.innerWidth * 0.5,
      height = 500;

    //create new svg container for the map
    var map = d3.select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    //creates Albers equal area conic projection for the United States with Hawaii and Alaska included
    var projection = d3.geo.albersUsa()
      .scale(1000)
      .translate([width / 2, height / 2])

    var path = d3.geo.path()
      .projection(projection);

    //uses queue.js to parallelize asynchronous data loading
    d3_queue.queue()
      .defer(d3.csv, "data/StateData.csv") //loads attributes from csv
      .defer(d3.json, "data/usaStates.topojson") //loads choropleth spatial data
      .await(callback);

      function callback(error, csvData, us){
        //translates the states topojson
        var usStates = topojson.feature(us, us.objects.USAStates).features;
        
        //add out usStates to the map
        var states = map.append("path")
          .datum(usStates)
          .attr("class", "states")
          .attr("d", path);

        usStates = joinData(usStates, csvData);
        var colorScale = makeColorScale(csvData);
        setEnumerationUnits(usStates, map, path, colorScale);
        setChart(csvData, colorScale);
        createDropdown(csvData);   
      };
  };//end of setMap()


  //writing a function to join the data from the csv and geojson
  function joinData (usStates, csvData){
        //loops through csv to assign each set of csv attribute values to geojson
        for (var i= 0; i<csvData.length; i++){
            var csvRegion = csvData[i];
            var csvKey = csvRegion.adm1_code;
          //loops through geojson regions to find correct region
          for (var a=0; a<usStates.length; a++){
            var geojsonProps = usStates[a].properties;
            var geojsonKey = geojsonProps.adm1_code;

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
        return "states " + d.properties.adm1_code;
      })

      .attr("d",path)
      .style("fill", function(d){
        return choropleth(d.properties, colorScale);
      })
      .on("mouseover", function(d){
        highlight(d.properties);
      })
      .on("mouseout", function(d){
      dehighlight(d.properties);
      })
      .on("mousemove", moveLabel);

   //adds style descriptor to each path
   var desc= states.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
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
      //assign array of expressed values as scale domain
      colorScale.domain(domainArray);
      return colorScale;
  };

  function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (val && val != NaN){
      return colorScale(val);
    } else {
      return "#CCC";
    };
  };


//function to create coordinated bar chart
function setChart(StateData, colorScale){
  //chart frame dimensions
  // var chartWidth = window.innerWidth * 0.425,
  //   chartHeight = 460;

  //create a second svg element to hold the bar chart
  var chart = d3.select("body")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("class", "chart");

  //create a rectangle for chart background fill
  var chartBackground = chart.append("rect")
    .attr("class", "chartBackground")
    .attr("width", chartInnerWidth)
    .attr("height", chartInnerHeight)
    .attr("transform", translate);

  //set bars for each province
  var bars = chart.selectAll(".bar")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function(a, b){
      return b[expressed]-a[expressed]
    })
    .attr("class", function(d){
      return "bar " + d.adm1_code;
    })
    .attr("width", chartInnerWidth / csvData.length - 1)
    .on("mouseover", highlight)
    .on("mouseout", dehighlight)
    .on("mousemove", moveLabel);

  //add style descriptor to each rect
  var desc = bars.append("desc")
    .text('{"stroke": "none", "stroke-width": "0px"}');

   //create a text element for the chart title
  var chartTitle = chart.append("text")
    .attr("x", 40)
    .attr("y", 40)
    .attr("class", "chartTitle");

  //create vertical axis generator
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left");

  //place axis
  var axis = chart.append("g")
    .attr("class", "axis")
    .attr("transform", translate)
    .call(yAxis);

  //create frame for chart border
  var chartFrame = chart.append("rect")
    .attr("class", "chartFrame")
    .attr("width", chartInnerWidth)
    .attr("height", chartInnerHeight)
    .attr("transform", translate);

  //set bar positions, heights, and colors
  updateChart(bars, csvData.length, colorScale);
};

  
})();







