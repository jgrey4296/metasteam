/*global  circle append    log */
function generateList(){
    //Main Globals
  var globalData = [];
  var currentDataSet = [];


  //Tool tip variables:
  var ttWidth = 400;
  var ttHeight = 150;

  //General Globals
    var margin = 10;
    var height = 10000000; window.innerHeight - margin;
    var width = 100000;//window.innerWidth - margin;
    var centerx = window.innerWidth * 0.5;
    var centery = window.innerHeight * 0.5;
    var headerSize = 50;
    
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
    drawData(globalData, 0, globalData.length);
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
  var scale = d3.scale.linear().domain([200,0])
  .range([1,300]);

  var drag = d3.behavior.drag()
  .on("drag", dragmove);

  function dragmove(d){
    var value = Math.max(0, Math.min(200, d3.event.y));
    d3.select(this)
    .attr("cy", value);
    //Use Value to slice data before redrawing
    if(currentDataSet.length != null){
      scale.range([1,currentDataSet.length]);
    }
    var floorValue = Math.floor(scale(value));
  //console.log(value,floorValue);

/*   d3.selectAll(".events").transition()
    .attr("opacity",function(a,i){
      if(i > floorValue){
        return 0;
      }else{
        return 1;
        }
    });
*/

    drawData(currentDataSet,0,floorValue);

  }

  var slider = mainElement.append("g").classed("slider",true)
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
  function drawData(inData, start, end, skip){
    //console.log("Drawing", inData, start, end);
//    currentDataSet = inData.slice(start,end);

    currentDataSet = inData;
    var nodes;
     nodes = inData;

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

	  var eventG = events.enter().append("g")
          .classed("events",true);
      
      eventG.append("rect")
          .attr("width",0)
          .attr("height",0)
	      .style("fill", function(d)
		   { return color(Math.random(20))})
	.transition().duration(1000)
	      .attr("width",300)
          .attr("height",140);

      eventG.append("text")
          .text(function(d){
              return d['name'];
          })
          .style("fill","black")
      .attr("transform",function(d){
          return "translate(" + 20 + "," + 20 + ")";
      })

    

      events.attr("transform",function(d,i){
          return "translate(" + 200 + "," + (i * 150) + ")";
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
          //TODO: Sort by release Date
		drawData(gamesList, 0, gamesList.length);
	  }else{
		if(d.hasOwnProperty('games')
		 && d['games'].length > 0){
		    var gamesList = d['games'];
            //TODO sort by release date
		  drawData(gamesList, 0, gamesList.length);
		}else{
		  drawData(currentDataSet, 0, currentDataSet.length);
		}
	  }
    });

  //Enter and update
    //Update:
    events.each(function(d,i){
      var single = d3.select(this);
      if(i > end || i < start){
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




