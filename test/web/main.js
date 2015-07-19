/**
   The Main module of metasteam
   relies on being run from a server,
   at root ../ to allow access to ../data
   @module metasteam
   @main
*/

require(['libs/d3.min'],function(d3){
    //Main:
    //Load the json data
    console.log("hello world");

    
    //Size Globals:
    var margin = 30;
    var svgHeight = window.innerHeight - margin;
    var svgWidth = window.innerWidth - margin;

    //Setup the svg
    d3.select('body').append('svg')
        .attr('id','mainsvg')
        .attr('height',svgHeight)
        .attr('width',svgWidth);
    //SideBar:
    d3.select('#mainsvg').append('rect')
        .attr('width',60)
        .attr('height',svgHeight)
        .attr('id','leftBar');

    d3.select("#mainsvg").append('rect')
        .attr('width',60)
        .attr('height',svgHeight)
        .attr('transform',function(){
            return 'translate(' + (svgWidth - 60) + ',0)';
        })
        .attr('id','rightBar');


    
    //Load the json Data:
    d3.json("../data/gameData.json",function(data){
        console.log("DATA: ", data);
        

        
    });

});