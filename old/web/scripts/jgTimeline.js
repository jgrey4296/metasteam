/*global function eventContainer  priorGames 15  releaseDate */
define(['d3'],function(d3){
  //General Variables:
  var utilv, data, mainElement, eventContainer,
  tooltip, buttonArea;
  var interface = {};
  var cachedData = [];

  //Main Draw function of data:
  //Where sorted games is an object:
  //{focus: {}, post: [{}], pre: [{}], same: [{}] }
  var draw = function(sortedGames){
    cachedData = sortedGames;

    //select and update:
    //focus game
    drawFocusGame(sortedGames.focusGame);

    //Draw expandable genres:
    drawGenres(sortedGames.allTags);

  };    

  var drawGenres = function(genreList){
    var allTagsE = mainElement.select("#allTags")
    .attr("transform","translate(0," + 250 + ")");

    var groups = allTagsE.selectAll("g")
    .data(genreList).enter().append("g")
    .attr("transform",function(d,i){
                   this.x = 0;
                   this.y = i * 40;
      return "translate(" + this.x + "," + this.y  + ")";
    })
    .on("mouseenter",mouseEnter);

    groups.append("rect")
    .attr("width",200)
    .attr("height",30);


    groups.append("text")
    .text(function(d){ return d; })
    .attr("fill",'red')
    .attr("transform","translate(10,20)")
    .attr("text-anchor","left");

  };

  var mouseEnter = function(d){
    var mousedThis = this;
    //Get rid of the other groups
    d3.select("#allTags").selectAll("g")
    .filter(function(d){
      if(mousedThis === this){
        return false;
      }
      return true;})
    .transition().duration(300)
    .attr("transform",function(d,i){
      return "translate(" + -300 + "," + i * 40 + ")";
    });

    //expand the rectangle
    d3.select(this).select("rect")
    .transition().duration(300)
    .attr("width",utilv.width)
    .attr("height",1000);
    //move the group
    d3.select(this).transition().delay(300).duration(300)
    .attr("transform",function(d,i){
      return "translate(" + 0 + "," + 0 + ")";
    })
    .each("end",function(d){
      d3.select(this).on("mouseleave",mouseExit);
    });

    //visualise the data for that tag:
    console.log("TAG: ",d,cachedData.allTagsHashes[d]);
    drawGames(this,cachedData.allTagsHashes[d]);
  };

  var drawGames = function(container,data){
    var g = d3.select(container).append("g")
    .attr("id",'allgames');

    var gamesGroups = g.selectAll("g").data(data).enter()
                      .append("g")
                      .attr("transform",function(d,i){
                        return "translate(" + (utilv.width/2 - 250) + ","
                             + i * 55 + ")";
                      });

    gamesGroups.append("rect")
    .attr("width",500)
    .attr("height",50)
    .attr("fill","green");

    gamesGroups.append('text')
    .text(function(d){
      if(typeof(d.releaseData) !== typeof("")){
      return d.name + " : " + d.releaseDate.year;
      }else{
        return d.name + " : " + d.releaseDate;
      }
    })
    .attr("transform",function(d){
      return "translate(0,25)";
                      })
    .attr("fill","red");


  };


  var mouseExit = function(d){
    var mousedThis = this;
    // //move the group
    // d3.select(this).transition().duration(300)
    // .attr("transform",function(d,i){
    //   return "translate(" + 0 + "," + this.y + ")";
    // });
    d3.selectAll("#allgames").remove();


    //shrink the rectangle
    d3.select(this).select("rect")
    .transition().duration(300).delay(300)
    .attr("width",200)
    .attr("height",30);

    
    d3.select("#allTags").selectAll("g")
    .transition().duration(300).delay(600)
    .attr("transform",function(d,i){
      this.y = i * 40;
      return "translate(" + 0 + "," + this.y + ")";
    });




  };


  var drawFocusGame = function(game){
    
    var gameElement = mainElement.select("#focusGame")
                      .attr("transform","translate("+ (utilv.width/2) + ",100)").data([game]);

    gameElement.append("rect")
    .attr("width",500)
    .attr("height",50)
    .attr("transform",function(d){
      return "translate(" + -250 + ",0)";
    });

    gameElement.append("text")
    .text(function(d){
      return d.name;
    })
    .attr("fill","red")
    .attr("transform","translate(0,40)")
    .attr("text-anchor","middle");


  };

  //Where prior games is an object:
  //{ genre: [games] }
  var drawPriorGames = function(priorGames){
    console.log(Object.keys(priorGames));
    //for each genre:
    //draw an enclosing rect
    //draw the 5 nearest games
    //Get the Container:
    var pgContainer = mainElement.select("#priorGames")
    .attr("transform","translate("+ 0
          + "," + (200) + ")");

    //Pass it to the general Draw function with the data:
    drawGenreData(pgContainer,priorGames, "Prior Release Games");

  };


  var drawGenreData = function(container,data,name){
    container.append("rect")
    .attr("width",(utilv.width/2 - 100))
    .attr("height",50);

    container.append("text")
    .text(name)
    .attr("fill","red")
    .attr("transform","translate(" + utilv.width/5 + ",40)")
    .attr("text-anchor","middle");

    //Drawing each genre
    var allG = container.selectAll("g").data(Object.keys(data));

    var gs = allG.enter().append("g")
    .attr("transform",function(d,i){
      return "translate(0," + (100 + (i * 30)) + ")";
    });

    gs.append("rect")
    .attr("height",10)
    .attr("width",utilv.width/2 - 200);

    gs.append("text")
    .text(function(d){
      return d;
    });

  };

  //Also in the form of: { genre: [games] }
  var drawPostGames = function(postGames){
    var pgContainer = mainElement.select("#postGames")
    .attr("transform","translate("+ (utilv.width/2 + 100 )
          + "," + (200) + ")");

    drawGenreData(pgContainer,postGames,"Post Release Games");


  };

  var drawSameYearGames = function(games){
    var pgContainer = mainElement.select("#sameGames")
                      .attr("transform","translate("+
                            (utilv.width/2 - 100)
                                       + "," + (200) + ")");
    
    pgContainer.append("rect")
    .attr("width",(200))
    .attr("height",50);
    
    pgContainer.append("text")
    .text("Same Games")
    .attr("fill","red")
    .attr("transform","translate("+ 100 + "," + 40 + ")")
    .attr("text-anchor","middle");

  }


  //Setup Before Drawing the data
  //util object, data = {ids : object }
  var setup = function(utils,data){
    console.log("Setting up jgCircles");
    utilv = utils;


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


    //setup the timeline above everything
    mainElement.append("g")
    .attr('id',"timeline");

    d3.select("#timeline").append("rect")
    .attr("width",utilv.width - (utilv.margin * 2)).attr("height",50);

    mainElement.append("g").attr("id","focusGame");
    mainElement.append("g").attr("id","allTags");


    //Reset button:
    var reset = mainElement.append("g").attr("id",'reset')
    .attr("transform","translate(0,100)")
    .on("mousedown",function(){
                  console.log("resetting");
                  console.log("cache:",cachedData);
                  d3.select("#focusGame").selectAll("g")
                  .remove();
                  d3.select("#allTags").selectAll("g")
                  .remove();


                  draw(cachedData);
                });

    reset.append("rect")
    .attr("width",100)
    .attr('height',100);

    reset.append("text").text("Reset")
    .classed("unselectable","true")
    .attr("fill","red")
    .attr("transform","translate(50,50)")
    .attr("text-anchor","middle");

          

    

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

  //pass in data, get an array of all games:
  var listGames = function(d){
    var gameList = [];
    for(var i in d){
      gameList.push(d[i]);
    }
    return gameList;
  };

  //from a tagHash, get the list of tag objects for a game:
  var tagObjectsForGame = function(game,tagHash){
    var relevantTags = {};
    for(var i in game.jgTags){
      relevantTags[game.jgTags[i]]
                                = tagHash[game.jgTags[i]];
    }

    return relevantTags;
  };

  var getYear = function(d){
    if(d.releaseDate === undefined){
      console.log(d.name + " has no release date");
      d.releaseDate = { day: 1, month: "jan", year: 2015};
      return d.releaseDate.year;
    }
    if(typeof(d.releaseDate) === typeof({})){
      return d.releaseDate.year;
    }else{
      return parseInt(d.releaseDate.split(",")[1]);
    }
  };


  //from an array of gameObjects and a game,
  //split the array into two halves. pre and post release of
  //the game:
  var tagArrayReleaseSplit = function(game,tagArray){
    var returnObject = {
        "focus" : game,
        "prior" : [],
        "same" : [],
        "post" : [],
        "all" : [],
    };

    //sort the array into release date order:
    tagArray.sort(function(a,b){
      var year1 = getYear(a);//parseInt(a.releaseDate.split(",")[1]);
      var year2 = getYear(b);//parseInt(b.releaseDate.split(",")[1]);
      return year1 - year2;      
    });
    //split by year
    for(var i in tagArray){
      returnObject.all.push(tagArray[i]);
      if(getReleaseYear(game) > getReleaseYear(tagArray[i])){
        returnObject.prior.push(tagArray[i]);
        continue;
      }

      if(getReleaseYear(game) < getReleaseYear(tagArray[i])){
        returnObject.post.push(tagArray[i]);
        continue;
      }

      returnObject.same.push(tagArray[i]);

    }
    return returnObject;
  };

  var getReleaseYear = function(game){
    if(game.hasOwnProperty("releaseDate")){
      if(typeof(game.releaseDate) === typeof("")){
        return parseInt(game.releaseDate.split(",")[1]);
      }else if(typeof(game.releaseDate) === typeof({})){
        return parseInt(game.releaseDate.year);
      }
    }
    return 0;
  }


  //Passed in an object of ids->gameObjects
  //return an object of tags->[gameObjects]
  var dataToTagHash = function(d){
    //Take the data
    var useData = d;
    var allTags = {};

    //go through every game
    for(var i in useData){
      //console.log("Game: ", useData[i]);
      var tags = useData[i].jgTags;
      for(var tag in tags){
        if(!allTags.hasOwnProperty(tags[tag])){
          allTags[tags[tag]] = [];
        }
        allTags[tags[tag]].push(useData[i]);
      }
    }
    return allTags;
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

  //Get the values of an object:
  var values = function(hash){
    var keys = Object.keys(hash);
    var output = [];
    for(var i in keys){
      output.push(hash[keys[i]]);
    };
    return output;
  };

  //Mouseover functions
  var mouseOver = function(d){


  };

  var mouseOut = function(d){


  };


  interface.draw = draw;
  interface.setup = setup;
  interface.listGames = listGames;
  interface.dataToTagHash = dataToTagHash;
  interface.tagObjectsForGame = tagObjectsForGame;

  interface.tagArrayReleaseSplit = tagArrayReleaseSplit;


  return interface;
});