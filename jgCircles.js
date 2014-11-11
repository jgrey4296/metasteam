/*global  circle append    log */
function generateCircles(){
    //Main Globals
  var globalData = [];

  //Tool tip variables:
  var ttWidth = 300;
  var ttHeight = 150;

  //General Globals
    var margin = 10;
    var height = window.innerHeight - margin;
    var width = window.innerWidth - margin;
    var centerx = window.innerWidth * 0.5;
    var centery = window.innerHeight * 0.5;
    var headerSize = 50;
    
    var bubble = d3.layout.pack()
//                 .sort(null)
                 .size([500,500])
                 .padding(1.5);
  //.value(function(d){ return d['games'].length; });
    
    var color = d3.scale.category20c();

    //The core element to work upon:    
  var mainElement = d3.select('body').append('svg')
	                .attr('height',height)
	                .attr('width',width)
	                .attr("transform","translate("+margin+","+ margin + ")");

  //Create a place to put the visualised data
  var eventContainer = mainElement.append("g").classed("eventContainer",true)
                       .attr("id","eventContainer")
                       .attr("transform",function(d){
                         return "translate(" + 250 + "," + 100 + ")";
                       });
  //Make the tooltip:
  createTooltip();

  //Making the Reset Button:
  var buttonArea = mainElement.append("g").classed("buttonArea",true);
  button = buttonArea.append("g").classed("button",true)
  .attr("transform",function(d){
    return "translate(" + 20 + "," + 200 + ")";
  });

  button.append("rect")
  .attr("width",0)
  .attr("height",0)
  .style("fill","green")
  .on("click",function(d){
    //console.log("Reset");
    d3.selectAll(".events").remove();
    drawData({children:globalData});
  })
  .transition().duration(1000)
  .attr("width",150)
  .attr("height",50);

  button.append("text")
  .attr("transform",function(d){
    return "translate(" + 50 + "," + 20 + ")";
  })

  .text("Reset")
  .style("fill","white");

  //Adding the slider:
  var drag = d3.behavior.drag()
  .on("drag", dragmove);

  function dragmove(d){
    var value = Math.max(0, Math.min(200, d3.event.y));
    d3.select(this)
    .attr("cy", value);
    console.log(value);

    //Use Value to slice data before redrawing
    


  }

v  var slider = mainElement.append("g").classed("slider",true)
    .attr("transform",function(d){
    return "translate(" + 50 + "," + (height * 0.5) + ")";
  });


  slider.append("rect")
  .attr("width",10)
  .attr("height",200);

  slider.append("circle")
  .attr("r",20)
  .attr("cx",0)
  .attr("cy",0)
  .attr("fill","green")
  .call(drag);



//----------------------------------------
  //Load the JSON data
  d3.json("metaSteamGameList.json",function(d){
	//pack it appropriately
    //console.log("Incoming Data",d);
    globalData = [];

    for (var i in d){
      if(d.hasOwnProperty(i)){
        if(d[i].hasOwnProperty('hours_forever')){
          d[i]['value'] = d[i]['hours_forever'];
        }else{
          d[i]['value'] = 0.1;
        }
        globalData.push(d[i]);
      }
    }


    var categories = {};
    categories['everything'] = {
      name : 'everything',
      games : [],
      value : 0
    };
    for (var i in globalData){
      if(globalData.hasOwnProperty(i)){
        var game = globalData[i];
        if(!game.hasOwnProperty('value')){
          game['value'] = 100;
        }

        categories['everything']['games'].push(game);
        categories['everything']['value'] = categories['everything']['games'].length;

         //console.log("Game:",game);
        var tags = gameCategories(game);
        for(var j = 0; j < tags.length; j++){
          if(!categories.hasOwnProperty(tags[j])){
            var tempCategory = {};
            tempCategory['name'] = tags[j];
            tempCategory['games'] = [];
            categories[tags[j]] = tempCategory;
          }
          categories[tags[j]]['games'].push(game);
          categories[tags[j]]['value'] = categories[tags[j]]['games'].length;
        }
      }
    }
    console.log("Categories:",categories);
    globalData = [];
    for (var i in categories){
      if(categories.hasOwnProperty(i)){
        globalData.push(categories[i]);
      }
    }


    //console.log("Global Data:",globalData);
    //    drawData({children:globalData});


    
  });

  /*
   * Get the categories for a game
   */
  function gameCategories(game){
    if(game.hasOwnProperty('jgTags')){
      return game['jgTags'];
    }else{
      return [];
    }
  }




  /*
   * Create the tooltip
   */
  function createTooltip(){
    
	//tooltip
	var tooltip = mainElement.append("g").classed("tooltip", true);
	              //.attr("display","none"); //only display when hovering, see later.
    
	tooltip.append("rect")
	.attr("width",0)
	.attr("height",0)
	.style("opacity",0);
    
    
    tooltip.append("text")
    .text(" ")
    .attr("transform","translate(10,30)")
    .style("fill","white")
    .style("opacity",0);

    tooltip.append("text")
    .attr("id","value")
    .text("")
    .attr("transform",function(d){
      return "translate(" + 10 + "," + 50 + ")";
    })
    .style("fill","white")
    .style("opacity",0);

  }


  /* METHODS FOR TOOLTIPS:
   * Tooltip interaction
   */
  function updateTooltip(d){
        var tooltip = mainElement.select(".tooltip");
    
    tooltip.select("rect").transition().duration(1000)
    .style("opacity",1)
    .attr("width",ttWidth)
    .attr("height",ttHeight);
    
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
  }

  /*
   * Hide the tooltip
   */
  function hideTooltip(d){
    mainElement.selectAll(".tooltip")
        .select("rect").transition().duration(1000)
        .style("opacity",0)
        .attr("height",0)
        .attr("width",0);
    
    
    mainElement.selectAll(".tooltip")
    .selectAll("text").transition().style("opacity",0);

  }

  /*
   * Move the tooltip
   */
  function moveTooltip(d){
	mainElement.select(".tooltip")
	.attr("transform",function(d){
	  var s = d3.select("svg");
	  return "translate(" + (d3.mouse(s.node())[0] + 20) 
		   + "," + d3.mouse(s.node())[1] + ")";
	});
  }

  /*
   * Draw data of form {children:[data]}
   */
  function drawData(inData){
    console.log("Drawing");
    var nodes = bubble.nodes(inData);
    var filteredNodes = nodes.filter(function(d){
                          if(d.hasOwnProperty('children')){
                            return false;
                          }else{
                            return true;
                          }});


//    console.log("Nodes:",nodes);
//    console.log("Filtered:",filteredNodes);

  //Data join
    var events = mainElement.select("#eventContainer")
                 .selectAll(".events").data(filteredNodes,
                                            function(d){
                                              if(d.hasOwnProperty("appid")){
                                                return d['appid'];
                                              }else{
                                                return d['name'];
                                              }
                                            })
                 .enter().append("g")
                 .classed("events",true);


                 events.attr("transform",function(d){
                   return "translate(" + d.x + "," + d.y + ")";
                 })
                 .on("mouseover",function(d){
                   updateTooltip(d);
                 })
                 .on("mouseout",function(d){
                   //hideTooltip(d);
                 })
                 .on("mousemove",function(d){
                   //moveTooltip(d);
                   })
                 .on("click",function(d){
                   //Get the Data from the object:
                   //console.log("Clicked:",d);
                     events.selectAll("circle")
                     .attr("r",0)
                     .transition().style("opacity",0);
                     events.transition().delay(1000).remove();
                   if(d.name == "everything"){
                     //console.log("Everything:",d);
                     var gamesList = d['games'];
                     //console.log("Slice",gamesList);
                     drawData({children:gamesList});
                   }else{
                   if(d.hasOwnProperty('games')
                     && d['games'].length > 0){
                     var gamesList = d['games'];
                     drawData({children:gamesList});
                   }else{
                     drawData({children:globalData});
                   }
                     }
                 });

  //Enter and update
  events.append("circle")
    .attr("r",0)
  .style("fill", function(d)
         { return color(Math.random(20))})
  .transition().duration(1000)
  .attr("r",function(d){ return d['r']; })

    events.exit();

}

}




