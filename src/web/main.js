/**
   The Main module of metasteam.js
   relies on being run from a server,
   at root ../ to allow access to ../data
   @module metasteam
   @main
*/

require(['libs/d3.min','ms_circlepack2','underscore','ms_tooltip'],function(d3,Mscp,_,Tooltip){
    //Main:
    //Load the json data
    console.log("hello world");

    var data = undefined;
    var mscp = undefined;
    //Size Globals:
    var margin = 30;
    var svgHeight = window.innerHeight - margin;
    var svgWidth = window.innerWidth - margin;

    console.log("Height:",svgHeight,"Width:",svgWidth);

    
    //Setup the svg
    d3.select('body').append('svg')
        .attr('id','mainsvg')
        .attr('height',svgHeight)
        .attr('width',svgWidth);
    //SideBar:
    d3.select('#mainsvg').append('rect')
        .attr('width',100)
        .attr('height',svgHeight)
        .attr('id','leftBar');

    d3.select("#mainsvg").append('rect')
        .attr('width',100)
        .attr('height',svgHeight)
        .attr('transform',function(){
            return 'translate(' + (svgWidth - 100) + ',0)';
        })
        .attr('id','rightBar');

    d3.select("#mainsvg")
	.append("g")
	.attr("id","circlePack");

    var tooltip = new Tooltip();
    
    //Load the json Data:
    d3.json("gameData.json",function(d){
        data = d;
        console.log("Base DATA:",d);
        mscp = new Mscp(svgWidth-100,svgHeight,d.installed,tooltip);
        mscp.draw();
        
    });

});
