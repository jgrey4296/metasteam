/*global function eventContainer  */
define(['d3'],function(d3){
  //General Variables:
  var utilv, data, mainElement, eventContainer,
  tooltip, buttonArea;
  var interface = {};

  //Main Draw function of data:
  var draw = function(data){
    console.log("Drawing jgCircles");
    

  };    


  //Setup Before Drawing the data
  //util object, data = {ids : object }
  var setup = function(utils,data){
    console.log("Setting up jgCircles");
    utilv = utils;

    //Data is object of ids->objects of information
    //need it to be an array for circlepacking


    //Make the main Elements:
    mainElement = d3.select('svg');
    eventContainer = mainElement.append("g")
                     .classed("eventContainer",true)
                                .attr("id","eventContainer")
                     .attr("transform",translate(250,100));

    //Make the tooltip
    tooltip = mainElement.append("g")
              .classed("tooltip",true)
              .attr("transform",translate(20,utilv.height * 0.8));
	tooltip.append("rect").attr("width",0).attr("height",0).style("opacity",0);
    tooltip.append("text").text(" ").attr("transform","translate(10,30)")
    .style("fill","white")
    .style("opacity",0);
    tooltip.append("text").attr("id","value").text("").attr("transform",translate(10,50))
    .style("fill","white")
    .style("opacity",0);

    //buttons

    //slider
    

  };

  //utility functions:
  //Function to get the max from an array of objects,
//for a particular field
  var maxOfProperty = function(dataArray,property){
    var propertyArray = [];
    for(var i in dataArray){
      if(dataArray.hasOwnProperty(i) && dataArray[i].hasOwnProperty(property)){
        propertyArray.push(dataArray[i][property]);
      }
    };
    return Math.max.apply(Math,propertyArray);
  };


  //utility translate function:
  var translate = function(x,y){
    return "translate(" + x + "," + y + ")";
  };

  var convertDataToTree(d){


  }

 
  var processData = function(d){
    //Take the data
    var useData = d.slice(0);//copy it
    //pack it
    var nodes = utilv.bubble.nodes({children:useData});
    //get only the nodes with children:
    var filteredNodes = nodes.filter(function(d,i){
                          if(d.hasOwnProperty('children')){
                            return false;
                          }else{
                            return true;
                          }
                        });

    utilv.scale.range([1,maxOfProperty(d,'value')]);

    return filteredNodes;
  };


  var getGameCategories = function(game){
    if(game.hasOwnProperty('jgTags')){
      return game['jgTags'];
    }else{
      return [];
    }
  };

  //Tooltip Functions
  var updateTooltip = function(d){
   
    tooltip.select("rect").transition().duration(1000)
    .style("opacity",1)
    .attr("width",utilv.ttWidth)
    .attr("height",utilv.ttHeight);
    
	tooltip.select("text")
	.text(function(){
      var string = d['name'];
      return "Name: " + string;
    });
    
    tooltip.select("#value")
    .text(function(){
      return "Value: " + d['value'];
    });
    
    tooltip.selectAll("text").transition().delay(500)
    .style("opacity",1);
  };

  var hideTooltip = function(d){
    tooltip.select("rect").transition().duration(1000)
        .style("opacity",0)
        .attr("height",0)
        .attr("width",0);
    
    
    tooltip.selectAll("text").transition().style("opacity",0);
  };

  var moveTooltip = function(d){
    tooltip.attr("transform",function(d){
	  var s = d3.select("svg");
	  return "translate(" + (d3.mouse(s.node())[0] + 20) 
		   + "," + d3.mouse(s.node())[1] + ")";
	});
  };

  interface.draw = draw;
  interface.setup = setup;


  return interface;
});