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
    var leftBar = d3.select('#mainsvg').append("g")
        .attr("id","leftBar");
    leftBar.append('rect')
        .attr('width',(window.innerWidth * 0.15) )
        .attr('height',svgHeight);

    var rightBar = d3.select("#mainsvg").append("g")
        .attr("id","rightBar")
        .attr('transform',function(){
            return 'translate(' + (svgWidth - 100) + ',0)';
        });

    rightBar.append('rect')
        .attr('width',100)
        .attr('height',svgHeight);

    d3.select("#mainsvg")
	.append("g")
	.attr("id","circlePack");

    var tooltip = new Tooltip();
    
    //Load the json Data:
    d3.json("gameData.json",function(d){
        data = d;
        console.log("Base DATA:",d);

	//copy 'hours_forever' into data before using in mscp:
	var installed = d.installed;
	for(var i in d.profile){
	    var game = d.profile[i];
	    if(game['appid'] === undefined) continue;
	    if(game['hours_forever'] === undefined) continue;
	    var installedGame = installed[game['appid']];
	    if(installedGame === undefined) continue;
	    installedGame['hours_forever'] = Number(game['hours_forever']);
	}
	
        mscp = new Mscp(svgWidth-100,svgHeight,d.installed,tooltip);
        mscp.draw();
        
    });

});
