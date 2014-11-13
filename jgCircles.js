/*global  circle append    log fill  d */
function generateCircles(){
    //Main Globals
  var globalData = [];
  var currentDataSet = [];


  //Tool tip variables:
  var ttWidth = 400;
  var ttHeight = 150;

  //General Globals
    var margin = 10;
    var height = window.innerHeight - margin;
    var width = window.innerWidth - margin;
    var centerx = window.innerWidth * 0.5;
    var centery = window.innerHeight * 0.5;
    var headerSize = 50;
    
    var bubble = d3.layout.pack()
                 .sort(null)
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
    d3.select("#button1").text("Reset");
    d3.selectAll(".events").remove();
    drawData(globalData);
  })
  .transition().duration(1000)
  .attr("width",80)
  .attr("height",50);

  button.append("text")
  .attr("transform",function(d){
    return "translate(" + 25 + "," + 20 + ")";
  })
  .attr("id","button1")
  .text("Start")
  .style("fill","white");

  //Adding the slider:
  var scale = d3.scale.linear().domain([200,0])
  .range([1,300]);

  var drag = d3.behavior.drag()
  .on("drag", dragmove)
  .on("dragstart",function(d){
               console.log("Started Dragging");
             })
  .on("dragend",dragEnd);
  

  function dragmove(){
    //console.log("Dragging");
    var value = Math.max(0, Math.min(200, d3.event.y));
    d3.select(this)
    .attr("transform",function(d){
      return "translate(" + 0 + "," + value + ")";
    });
    console.log('Value',value);
    var maxr = maxOfProperty(currentDataSet,"r");
    console.log("Drag Max Radius",maxr);

    var floorVal = Math.floor(scale(value));

    d3.select(this).select("#sliderText1").text(floorVal)
    .attr("floorVal",floorVal);


    d3.selectAll(".events").each(function(d,i){
      if(d['value'] > floorVal){
        d3.select(this).select("circle").transition().attr("r",0);
      }else{
        d3.select(this).select("circle").transition().attr("r",d['r']);
      }
    });

    }

  function dragEnd(){
    console.log("End Drag");

    //d3.select(this).attr("cy", value);
    var value = d3.select("#sliderGroup1").attr("y");

    var maxRadius = maxOfProperty(currentDataSet,"r");

  //Use Value to slice data before redrawing
    if(currentDataSet.length != null){
      scale.range([1,maxOfProperty(currentDataSet,'value')]);
    }
    //var floorValue = Math.floor(scale(value));
  //console.log(value,floorValue);

   // d3.selectAll(".events").transition()
   //  .attr("opacity",function(a,i){
   //    if(i > floorValue){
   //      return 0;
   //    }else{
   //      return 1;
   //      }
   //  });

   // console.log("Redrawing",0,floorValue);
   //drawData(currentDataSet);

  }

  var slider = mainElement.append("g").classed("slider",true)
               .attr("id","highSlider")
               .attr("transform",function(d){
                 return "translate(" + 50 + "," + (height * 0.5) + ")";
               });


  slider.append("rect")
  .attr("width",10)
  .attr("height",200);

  var sg1 = slider.append("g").attr("id","sliderGroup1")
  .attr("transform",function(d){
              return "translate(" + 0 + "," + 0 + ")";
            })
  .call(drag);


  sg1.append("circle")
  .attr("r",20)
  .attr("cx",5)
  .attr("cy",0)
  .attr("fill","green");


  sg1.append("text").text("")
  .attr("transform",function(d){
    return "translate(" + -5 + "," + 5 + ")";
  })

  .attr("id","sliderText1")
  .style("fill","white");


  //Resize Button:
  var resizeButton = buttonArea.append("g").classed("button",true)
  .attr("transform",function(d){
    return "translate(" + 20 + "," + 350 + ")";
  });

  resizeButton.append("rect")
  .attr("width",0)
  .attr("height",0)
  .style("fill","green")
  .on("click",function(d){
    console.log("Resize");
    //d3.selectAll(".events").remove();
    drawData(currentDataSet);
  })
  .transition().duration(1000)
  .attr("width",80)
  .attr("height",50);

  resizeButton.append("text")
  .attr("transform",function(d){
    return "translate(" + 25 + "," + 20 + ")";
  })
  .attr("id","button2")
  .text("Resize")
  .style("fill","white");






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
    //console.log("Categories:",categories);
    globalData = [];
    for (var i in categories){
      if(categories.hasOwnProperty(i)){
        globalData.push(categories[i]);
      }
    }


    //console.log("Global Data:",globalData);
    //    drawData(globalData);


    
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
  function drawData(inData, maxRad=250){
    //console.log("Drawing", inData, start, end);
//    currentDataSet = inData.slice(start,end);

    currentDataSet = inData;
    var localDataSet = currentDataSet.slice(0);
    console.log("Local Size:",localDataSet.length);

    localDataSet.filter(function(d){
                     if(d.hasOwnProperty('r')){
                       if(d['r'] < 0.1){
                       return false;
                       }else{
                         return true;
                       }
                     }
                     return true;
                   });
    console.log("Filtered Size:",localDataSet.length);
    
    var nodes;
      console.log("Packing");
      nodes = bubble.nodes({children:localDataSet});
      


      var filteredNodes = nodes.filter(function(d,i){
                            if(d.hasOwnProperty('children')){
                              return false;
                            }else{
                              return true;
                            }});


      var maxr = maxOfProperty(filteredNodes,"r");
      console.log("Max Radius:",maxr);
      scale.range([1.0,maxOfProperty(currentDataSet,'value')]);
      nodes = filteredNodes;





//    console.log("Nodes:",nodes);
//    console.log("Filtered:",filteredNodes);

  //Data join
    var events = mainElement.select("#eventContainer")
                 .selectAll(".events")
                 .data(nodes,
                       function(d){
                         if(d.hasOwnProperty("appid")){
                           return d['appid'];
                         }else{
                           return d['name'];
                         }}
                      );



    //console.log("Events:",events);

	events.enter().append("g").classed("events",true)
	.append("circle")
	.attr("r",0)
	.style("fill", function(d)
		   { return color(Math.random(20))})
	.transition().duration(1000)
	.attr("r",function(d){ return d['r']; });
    

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
		drawData(gamesList);
	  }else{
		if(d.hasOwnProperty('games')
		 && d['games'].length > 0){
		  var gamesList = d['games'];
		  drawData(gamesList)
		}else{
		  drawData(currentDataSet);
		}
	  }
    });

  //Enter and update
    //Update:
    events.each(function(d,i){
      var single = d3.select(this);
      if(d['r'] > maxRad){
        single//.transition().duration(1000)
        //.attr("r", 0)
        .remove();
      }else{
        single.attr("r",d['r'])
        .attr("cx",d['x'])
        .attr("cy",d['y']);
        }
    });

   //Exit
    events.exit().transition().attr("r",0).remove();

}

}




