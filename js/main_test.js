//testing on random things 

(function(){
//array to hold header names of csvData
keyArray=[["var1_Norm_Num_firms", "var2_Norm_M_firms", "var3_Norm_F_firms", "var4_Norm_MI_firms", "var5_Norm_NonMI_firms"];
var expressed = keyArray[0];
console.log(expressed);//delete all console.logs before submission

//key to assign colors to each variable
var objectColors={
      var1_Norm_Num_firms:[  '#ffffcc','#c2e699','#78c679','#31a354','#006837'],
      var2_Norm_M_firms:['#c2e699','#78c679','#31a354','#006837'],
      var3_Norm_F_firms:['#005a32','#238443','#41ab5d','#78c679','#addd8e','#d9f0a3','#ffffcc' ],
      var4_Norm_MI_firms:['#005a32','#238443','#41ab5d','#78c679','#addd8e','#d9f0a3','#ffffcc' ],
      var5_Norm_NonMI_firms:[ '#ffffcc','#c2e699','#78c679','#31a354','#006837']
};

//key to assign chart titles to each variable
var chartTitles={
      var1_Norm_Num_firms:['Internet Users per 100 People'],
      var2_Norm_M_firms:['Average Connection Speed (kbps)'],
      var3_Norm_F_firms:['Freedom House: Political Rights (1-7)'],
      var4_Norm_MI_firms:['Freedom House: Civil Liberties (1-7)'],
      var5_Norm_NonMI_firms:['OpenNet Initiative: Political Censorship (0-4)']
};

//chart dimensions
var chartWidth = 720,
    chartHeight = 697.5,
    leftPadding=29,//more room for scale
    rightPadding=20,
    topBottomPadding=20,
    chartInnerWidth=chartWidth - leftPadding - rightPadding,
    chartInnerHeight=chartHeight-(topBottomPadding*2),//make chartInnerHeight contined within padding
    translate="translate(" + leftPadding + "," + topBottomPadding + ")";
//an emptyy array I might use
currentColors=[];

window.onload = setMap();

function setMap() {
  //set width, height
  var width= 648 //window.innerWidth * 0.9 -- this never looked how I wanted
      height=342;
  //append map svg container to body
  var map=d3.select("body")
        .append("svg")
        .attr("class","map")
        .attr("width", width)
        .attr("height",height);

  //create natural earth projection of world
  var projection=d3.geo.naturalEarth()
      .scale(114)
      .translate([width/2,height/2])
      .precision(.1);

//apply path generator to apply projection to spatial data
  var path=d3.geo.path()
      .projection(projection);

//load data asynchronously
  var q=d3_queue.queue();
      q.defer(d3.csv, "data/internet_censorship.csv")//csv data
      q.defer(d3.json, "data/ne_50m_admin_0_countries_lakes.topojson")//spatial data
      q.await(callback);

  function callback(error, csvData, world){
    //set graticule on map
    setGraticule(map,path);
    //translate topojson to geojson
    var worldCountries=topojson.feature(world, world.objects.ne_50m_admin_0_countries_lakes).features;
    //create color scale

    //loop through csvData and assign ea attribute to values in geojson
    for (var i=0; i<csvData.length; i++) {
      var csvCountry=csvData[i]; //current region
      var csvCountryCode=csvCountry.ne_50m_admin_0_countries_lakes_adm0_a3; //the csv key

      var jsonCountries=world.objects.ne_50m_admin_0_countries_lakes.geometries;//linked to the geojson

      //loop to find correct region
      for (var j=0; j<jsonCountries.length;j++) {
        if (jsonCountries[j].properties.adm0_a3==csvCountryCode){ //aka if attribute exists both in geojson and csv...
          for (var key in keyArray){//for each variable in keyArray
            var attribute=keyArray[key];//each variable assigned to the country
            var value =parseFloat(csvCountry[attribute]);//position in array -- 0,1,2,3, or 4
          //  console.log(value);
            (jsonCountries[j].properties[attribute])=value;//find values both present in csv and geojson
          };
        };
      };
    };
    //link color scale with data
    var colorScale=makeColorScale(csvData);
    //for creating choropleth
    setEnumerationUnits(worldCountries, map, path, colorScale);
    //for implementing chart with data and color`
    setChart(csvData, worldCountries, colorScale);
    createDropdown(csvData, keyArray);
  };



};//end setMap

function createDropdown(csvData){
  var dropdown=d3.select("body")
      .append("select")
      .attr("class","dropdown")
      .on("change", function(){
        changeAttribute(this.value, csvData)
      });

  var titleOption = dropdown.append("option")
      .attr("class", "titleOption")
      .attr("disabled", "true")
      .text("Select Variable");

  var attrOptions=dropdown.selectAll("attrOptions")
      .data(keyArray)
      .enter()
      .append("option")
      .attr("value", function(d){return d})
      .text(function(d){return d});
};

// function changeAttribute(attribute, csvData){
//   //change expressed attribute
//   expressed=attribute;
//   //recreate color scale
//   var colorScale=makeColorScale(csvData);
//   //recolor countries
//   var selectCountries=d3.selectAll(".selectCountries")
//       .style("fill", function(d){
//         return choropleth(d.properties, colorScale)
//       });
//
//   var bars=d3.selectAll(".bars")
//       //re-sort bars
//       .sort(function(a,b){
//         //list largest values first for easier of reading
//         return b[expressed] - a[expressed];
//       })
//       .attr("x", function(d,i){
//         return i*(chartInnerWidth/csvData.length) + leftPadding;
//       })
//       .attr("height", function(d,i){
//         return chartInnerHeight-yScale(parseFloat(d[expressed]));
//       })
//       .attr("y", function(d,i){
//         return yScale(parseFloat(d[expressed]))+topBottomPadding;
//
//       })
//       //color by colorScale
//       .style("fill", function(d){
//         return choropleth(d, colorScale);
//       });
//
// };

function setGraticule(map, path){
    //apply graticule with lines 5 units apart in both dimensions--lat,lon
    var graticule=d3.geo.graticule()
        .step([5,5]);

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
};
//create color scale with data
 function makeColorScale(data){
     var colorScale=d3.scale.quantile()//use quantile for scale generator
          .range(objectColors[expressed]);//incorporate objectColors array to change depending on variable

//creating equal interval classifcation
  var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax);
    return colorScale;
};



function setEnumerationUnits(worldCountries, map, path, colorScale){
    //add countries to map
    var selectCountries=map.selectAll(".selectCountries")
        .data(worldCountries)
        .enter()
        .append("path")
        .attr("class", function(d){
          return "selectCountries " + d.properties.adm0_a3;
        })
        .attr("d",path)//assign d with attribute path
        .style("fill", function(d){

          return choropleth(d.properties, colorScale);
        });
};
//creation of choropleth map
function choropleth(props, colorScale){
  var value = parseFloat(props[expressed]);
  //set condition to color only those !=NaN and 0
  if (value && value !=NaN && value!=0) {
    return colorScale(value);
    } else if(value==0){
  //if value 0, still color on map
    return "#ffffcc";
    //return "white"; --experimenting w/ color
    } else {
  //if NaN, return grey color
    return "grey";
  }

};

function setChart(csvData, worldCountries, colorScale){
//add chart element
  var chart = d3.select("body")
      .append("svg")
      .attr("width",chartWidth)
      .attr("height",chartHeight)
      .attr("class","chart");

//add chartBackground
  var chartBackground = chart.append("rect")
       .attr("class", "chartBackground")
       .attr("width", chartInnerWidth)
       .attr("height", chartInnerHeight)
       .attr("transform", translate);

  var yScale = d3.scale.linear()
              //change scale values dynamically with max value of each variable
              .domain([d3.max(csvData,function(d){ return parseFloat(d[expressed])})*1.02, 0])
              //output this between 0 and chartInnerHeight
              .range([0, chartInnerHeight]);
//bars el=ement added
  var bars=chart.selectAll(".bars")
      .data(csvData)
      .enter()
      .append("rect")
      .sort(function(a,b){
        //console.log(csvData);
        //list largest values first for easier of reading
        return b[expressed]-a[expressed];
      })
      .attr("class", function(d){
        //give clas name to bars--was switching out values to see how each variable plotted out
        return "bars " + d.var2_secureaccess;
      })
      //width depending on number of elements, in my case 192-1
      .attr("width", chartInnerWidth/csvData.length - 1)
      //determine position on x axis by number of elements, incl leftPadding
      .attr("x", function(d,i){
        return i*(chartInnerWidth/csvData.length) + leftPadding;
      })
      //height by yscale of each value, within chartInnerHeight
      .attr("height", function(d){
        return chartInnerHeight-yScale(parseFloat(d[expressed]));
      })
      //make bars 'grow' from bottom
      .attr("y", function(d){
        return yScale(parseFloat(d[expressed]))+topBottomPadding;

      })
      //color by colorScale
      .style("fill", function(d){
        return choropleth(d, colorScale);
      })
    //add chart title
    var chartTitle=chart.append("text")
        .attr("x", 250)
        .attr("y", 40)
        .attr("class","chartTitle")
        .text(chartTitles[expressed])

    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);//for how actual numbers will be distributed

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

//DO SOMETHING W
//Goal: go through data to identify data !=NaN and return that data
//steps
//1. create new function to output the desired data 2. access all of the data,
//2. access the properties of the data
//3. write if statement to get desired data
//4. return data
//5. incoroporting into creation of bar chart
  function newData(worldCountries){
    //console.log(worldCountries);
    for (var i=0; i<worldCountries.length; i++){
      //console.log(worldCountries[i][expressed]);
      var val=parseFloat(worldCountries[i][expressed]);
    //  console.log(val);
    };
  };
  var data2 = newData(csvData);

//updateChart(bars, csvData.length, colorScale);

};

function changeAttribute(attribute, csvData){
  expressed=attribute;

  var yScale = d3.scale.linear()
              //change scale values dynamically with max value of each variable
              .domain([d3.max(csvData,function(d){ return parseFloat(d[expressed])})*1.02, 0])
              //output this between 0 and chartInnerHeight
              .range([0, chartInnerHeight]);



  var colorScale=makeColorScale(csvData);

  var selectCountries=d3.selectAll(".selectCountries")
      .style("fill", function(d){
        return choropleth(d.properties, colorScale)
      });

  var bars=d3.selectAll(".bars")
      .sort(function(a,b){
        //list largest values first for easier of reading
      return b[expressed]-a[expressed];
    })
  //determine position on x axis by number of elements, incl leftPadding
      .attr("x", function(d,i){
        return i*(chartInnerWidth/csvData.length) + leftPadding;
    })
    //height by yscale of each value, within chartInnerHeight
      .attr("height", function(d){
        return chartInnerHeight-yScale(parseFloat(d[expressed]));
    })
      .attr("y", function(d){
        return yScale(parseFloat(d[expressed]))+topBottomPadding;

    })
      //color by colorScale
      .style("fill", function(d){
        return choropleth(d, colorScale);
    });

    var chartTitle=d3.select(".chartTitle")
        .text((chartTitles[expressed]))

  //  updateChart(bars, csvData.length, colorScale);
};

function updateChart(bars, n, colorScale, csvData){
  //  var colorScale=makeColorScale(csvData);


  bars.attr("x", function(d,i){
        return i*(chartInnerWidth/n) + leftPadding;
    })
    //height by yscale of each value, within chartInnerHeight
    .attr("height", function(d,i){
      var yScale = d3.scale.linear()
                  //change scale values dynamically with max value of each variable
                  .domain([d3.max(csvData,function(d){ return parseFloat(d[expressed])})*1.02, 0])
                  //output this between 0 and chartInnerHeight
                  .range([0, chartInnerHeight]);
      return chartInnerHeight-yScale(parseFloat(d[expressed]));
    })
    //make bars 'grow' from bottom
    .attr("y", function(d,i){
      var yScale = d3.scale.linear()
                  //change scale values dynamically with max value of each variable
                  .domain([d3.max(csvData,function(d){ return parseFloat(d[expressed])})*1.02, 0])
                  //output this between 0 and chartInnerHeight
                  .range([0, chartInnerHeight]);
      return yScale(parseFloat(d[expressed]))+topBottomPadding;

    })
    //color by colorScale
    .style("fill", function(d){
      return choropleth(d, colorScale);
    });

  var chartTitle=d3.select(".chartTitle")
          .text(chartTitles[expressed]);

  var yScale = d3.scale.linear()
              //change scale values dynamically with max value of each variable
              .domain([d3.max(csvData,function(d){ return parseFloat(d[expressed])})*1.01, 0])
              //output this between 0 and chartInnerHeight
              .range([0, chartInnerHeight]);


};



})();