//D3 DEMO
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //set width, height
    var width=1050, height=550;
    //use queue.js to parallelize asynchronous data loading
    var q = d3_queue.queue();
        .defer(d3.csv, "data/StateData.csv") //load attributes from csv
        .defer(d3.json, "data/USAStates.topojson") //load choroplethspatial data
        .await(callback);

    function callback(error, csvData, europe, france){
        console.log(error);
        console.log(csvData);
        console.log(europe);
    };
};


