/**
   The Main module of metasteam.js
   relies on being run from a server,
   at root ../ to allow access to ../data
   @module metasteam
   @main
*/

require(['libs/d3.min','ms_circlepack2','underscore'],function(d3,Mscp,_){
    //Main:
    //Load the json data
    console.log("hello world");

    var data = undefined;
    var mscp = undefined;
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
    d3.json("gameData.json",function(d){
        data = d;
        console.log("Base DATA:",d);
        mscp = new Mscp(svgHeight,svgWidth,d.installed);
        mscp.draw();
        
    });

});
