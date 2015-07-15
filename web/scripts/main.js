require(['d3','jgTimeline','dataProcess'],function(d3,jgTimeline,dataProcess){
  console.log("Meta Steam Visualisation Startup");

  //utility variable object:
  var utilv = {};

  //Setup the utilv:
  //Tool tip variables:
  utilv.ttWidth = 400;
  utilv.ttHeight = 150;

  //General Globals
  utilv.margin = 10;
  utilv.height = window.innerHeight - utilv.margin;
  utilv.width = window.innerWidth - utilv.margin;
  utilv.centerx = window.innerWidth * 0.5;
  utilv.centery = window.innerHeight * 0.5;
  utilv.headerSize = 50;

  utilv.ttWidth = 400;
  utilv.ttHeight = 150;

  utilv.bubble = d3.layout.pack()
                 .sort(null)
                 .size([500,500])
                 .padding(1.5);

  utilv.mainElement = d3.select('body').append('svg')
	                .attr('height',utilv.height)
	                .attr('width',utilv.width);

  utilv.data = [];
  //Setup timeline stuff that doesnt rely on data
  jgTimeline.setup(utilv);

  //Load the JSON Data:
  d3.json("metaSteamGameList.json",function(d){
    console.log("Json Data Loaded:",d);

    utilv.data = d;

    //convert the object to a list of games
    var gameList = jgTimeline.listGames(d);
    //Sort games into tags
    var tagHash = jgTimeline.dataToTagHash(d);
    //Starting random Game: 
    var game = gameList[Math.floor(Math.random()*gameList.length)];
    //Get the games for each tag of the starting game
    var unsplitTagListsHash = jgTimeline.tagObjectsForGame(game,tagHash);

    var finalObject = {
      "allTags" : [],
      "allTagsHashes": {},
      "focusGame" : game,
      "prior" : {},
      "post" : {},
      "same" : {}
    };

    //For each tag of a game
    for(var tag in unsplitTagListsHash){

      //Get the list
      var tagList = unsplitTagListsHash[tag];
      //sort it
      var sortedTag = jgTimeline.tagArrayReleaseSplit(game,tagList);
      //add it to the final sorted object for that tag name
      finalObject.prior[tag] = sortedTag.prior;
      finalObject.post[tag] = sortedTag.post;
      finalObject.same[tag] = sortedTag.same;
      finalObject.allTags.push(tag);
      finalObject.allTagsHashes[tag] = sortedTag.all;
    };

    console.log("Final Sorted Object: ",finalObject);

    //Finally draw something:
    jgTimeline.draw(finalObject);
  });
});