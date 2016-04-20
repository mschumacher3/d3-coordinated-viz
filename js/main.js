//main.js file for D3 choropleth lab//
//wraps everything in a self-executing anonymous function to move to local scope, funciton ends at bottom of main.js
(function(){



  //pseudo-global variables
  //took out one attribute that i thought was causing issues-- Norm_Num_firms.  
  var attrArray = ["Male Owned Firms", "Female Owned Firms", "Minority Owned Firms", "Non Minority Owned Firms","Total Firms"];
  var expressed = attrArray[0]; //initial attribute
 

  //assigns chart titles to each variable
  var chartTitle=[
      "Firms Owned by Men",
      "Firms Owned by Women",
      "Firms Owned by Minorities",
      "Firms not Owned by Minorities",
      "Total Firms"
  ];

  //chart frame dimensions
  var chartWidth = window.innerWidth * 0.425,
    chartHeight = 525,
    leftPadding = 25,
    rightPadding = 5,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame and for axis
  var yScale = d3.scale.linear()
    .range([800, 0])
    .domain([0, 100]);

  //begins script when window loads
  window.onload = setMap();

  //sets up choropleth map
  function setMap(){
    //map frame size. Adjusted so Chart and map can fit next to eachother.
    var width = window.innerWidth * 0.5,
      height = 500;

    //create new svg container for the map
    var map = d3.select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    //creates Albers equal area conic projection for the United States with Hawaii and Alaska included
    //this is already set, so no center or rotate needed.
    var projection = d3.geo.albersUsa()
      .scale(883)
      .translate([width / 2, height / 2]);
    //draws the spatial data as a path of stings of 'd' attributes
    var path = d3.geo.path()
        .projection(projection);

    //uses queue.js to parallelize asynchronous data loading
    //these are like AJAX functions.
    d3_queue.queue()
      .defer(d3.csv, "data/StateData.csv") //loads attributes from csv
      .defer(d3.json, "data/usStates.topojson") //loads choropleth spatial data
      .await(callback);

      function callback(error, csvData, us){
        //translates the states topojson. I think this is where I am having issues. Read APi documentation and not sure what is happening that is wrong.
        //suppose to convert our topo to a geojson with featureclass
        var usStates = topojson.feature(us, us.objects.USAStates).features;
        
        //add out usStates to the map
        var states = map.append("path")
          .datum(usStates)
          .attr("class", "states")
          .attr("d", path);

        //joins csv data to GeoJSON enumeration units
        usStates = joinData(usStates, csvData);
        var colorScale = makeColorScale(csvData);
        setChart(csvData, colorScale);
        createDropdown(csvData);   

        //adds enumeration units to the map
        setEnumerationUnits(usStates, map, path, colorScale);
        
        
      };
  };//end of setMap

  //writes a function to join the data from the csv and geojson
  function joinData (usStates, csvData){
    //loops through csv to assign each set of csv attribute values to geojson
    for (var i=0; i<csvData.length; i++){
      var csvRegion = csvData[i];
      var csvKey = csvRegion.adm1_code;
      //loops through geojson regions to find correct region
        for (var a=0; a<usStates.length; a++){
          var geojsonProps = usStates[a].properties;
          var geojsonKey = geojsonProps.adm1_code;
          //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){
              attrArray.forEach(function(attr){
                var val = parseFloat(csvRegion[attr]); //get csv attribute value
                geojsonProps[attr] = val;
              });
            };
        };
    };
    return usStates;
  };


  function setEnumerationUnits(usStates, map, path, colorScale){ 
    console.log("reaching setEnumerationUnits?");
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
    .text('{"stroke": "white", "stroke-width": "0.5px"}');
  };


  //function to create color scale generator
  function makeColorScale(data){
    //orange color ramp from color brewer
    var colorClasses = [
      "#fee5d9",
      "#fcae91",
      "#fb6a4a",
      "#de2d26",
      "#a50f15"
    ];
    //creates color scale generator
    //quantile because data is not continuous
    var colorScale = d3.scale.quantile()
      .range(colorClasses);

      //build array of all values of the expressed attribute
    var domainArray = [];
      for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
      };
      //this domain shift removes the first value of the array and returns that item. We want 3 breakpoints for now.
      domainArray.shift();
      //assign array of expressed values as scale domain
      colorScale.domain(domainArray);
      return colorScale;
  };

  function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (isNaN(val)) {
        return "#CCC";
    } else {
        return colorScale(val);
    };
  };

//changes to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    console.log("why aren't u updating?");
  //position bars
  bars.attr("x", function(d, i){
      return i * (chartInnerWidth / n) + leftPadding;
    })
    //size/resize bars
    .attr("height", function(d, i){
      return 525 - yScale(parseFloat(d[expressed]));
    })
    .attr("y", function(d, i){
      return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
    //color/recolor bars
    .style("fill", function(d){
      return choropleth(d, colorScale);
    });

    var chartTitle = d3.select(".chartTitle")
      .text(expressed+ " in each state");
};


//function to create coordinated bar chart
function setChart(csvData, colorScale){
  console.log("got to set chart");
  //create a second svg element to hold the bar chart
  var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

 

  //set bars for each province
  var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.adm1_code;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

  var desc = bars.append("desc")
        .text('{"stroke": "white", "stroke-width": "0px"}');
     //create a text element for the chart title
  var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle");
        //.text(chartTitles);
  //create vertical axis generator
  var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left");

  //place axis
  var axis = chart.append("g")
    .attr("class", "axis")
    .attr("transform", translate)
    .call(yAxis);

  //set bar positions, heights, and colors
  updateChart(bars, csvData.length, colorScale);

};
//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
  //adds elements
  var dropdown = d3.select("body")
    .append("select")
    .attr("class", "dropdown")
    .on("change", function(){
      changeAttribute(this.value, csvData)
    });
  //adds starting option, first variable. Total Firms compared to occumaption 
  var titleOption = dropdown.append("option")
    .attr("class", "titleOption")
    .attr("disabled", "true")
    .text("Select Attribute");

  //add attribute name options
  var attrOptions = dropdown.selectAll("attrOptions")
    .data(attrArray)
    .enter()
    .append("option")
    .attr("value", function(d){ return d })
    .text(function(d){ return d });
};

  //dropdown can change listener handler
function changeAttribute(attribute, csvData){
  console.log(" are u updating?");
  //changes the expressed attribute
  expressed = attribute;

  //recreates the color scale
  var colorScale = makeColorScale(csvData);

  //recolors enumeration units.
  var states = d3.selectAll(".states")
    .transition()
    .duration(800)
    .style("fill", function(d){
      return choropleth(d.properties, colorScale)
    });

  //re-sort, resize, and recolor bars
  var bars = d3.selectAll(".bar")
    //re-sort bars
    .sort(function(a, b){
      return b[expressed] - a[expressed];
    })
    .transition()
    .delay(function(d, i){
      return i * 20
    })
    .duration(500);
  
    updateChart(bars, csvData.length, colorScale);
};





// function to highlight enumeration units and bars
function highlight(props){
  //change stroke
  var selected = d3.selectAll("." + props.adm1_code)
    .style({
      "stroke": "black",
      "stroke-width": "2"
    });

  setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style({
            "stroke": function(){
                return getStyle(this, "stroke")
            },
            "stroke-width": function(){
                return getStyle(this, "stroke-width")
            }
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    d3.select(".infolabel")
        .remove();
};

//function to create dynamic label
function setLabel(props){
  console.log("reaching setlabel?");
  //label content
  var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr({
            "class": "infolabel",
            "id": props.adm1_code + "_label"
        })
    .html(labelAttribute);

  var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX,
        y1 = d3.event.clientY - 1,
        x2 = d3.event.clientX - labelWidth,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style({
            "left": x + "px",
            "top": y + "px"
        });
};


})();



