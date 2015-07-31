define([],function(d){
  var interface = {};

  //INTERFACE HEADER:

  //For a property p
  //Get the max value of that
  //across all elements in an array of objects
  interface.maxOfProperty = undefined;

  //Take an object, and use every value 
  //in a new array, discarding keys.
  interface.objectToArray = undefined;

  //Take a game, return an array of
  //the tags it belongs to
  interface.gameTags = undefined;

  //Take an array of game objects
  //convert to an object
  //key = the tag, 
  //value = array of games that belong to that tag
  interface.gameListToTagObject = undefined;

  //Take an array of games
  //sort by releaseDate
  interface.sortGameList = undefined;

  //Sort an array
  interface.gamesObjectToArray = undefined;
  
  //END OF INTERFACE HEADER
  
  //get the data
  //convert it into an array
  //take the array and categorise by tags
  //sort the games in each tag by release date

  

  interface.sortGameList = function(gameList,sortProperty){
    var theArray = gameList;
    theArray.sort(function(a,b){
      if(a.hasOwnProperty("releaseDate")
       && b.hasOwnProperty("releaseDate")){
        var aRelease = a.releaseDate;
        var bRelease = b.releaseDate;


      }
         
    });



  };

  var standardiseDateRepresentation = function(game){
    var gamesReleaseDate = game.releaseDate;
    if(gamesReleaseDate instanceof Date){
      return game;
    };

    //if its a string:
    if(typeof(gamesReleaseDate) === typeof("")){
      game.releaseDate = new Date(gamesReleaseDate);
      return game;
    }

    //if its a general object:
    if(typeof(gamesReleaseDate) === typeof({})){
      if(gamesReleaseDate.hasOwnProperty("year")
         && gamesReleaseDate.hasOwnProperty("month")
         && gamesReleaseDate.hasOwnProperty("day")){
        game.releaseDate = new Date(
          gamesReleaseDate.year, gamesReleaseDate.month,
          gamesReleaseDate.day);
        return game;
      }
    }

    console.log("Date difficulty for: ",game);
    game.releaseDate = new Date();
    return game;
  };


  interface.gameListToTagObject = function(gameList){
    var outputObject = {};
    for(var i in gameList){
      var game = gameList[i]; //sort here
      var tags = interface.gameTags(game);
      for(var i in tags){
        var tag = tags[i];
        if(outputObject[tag] === undefined){
          outputObject[tag] = [];
        }
        outputObject[tag].push(game);
      }
    }
    return outputObject;
  };

  interface.gameTags = function(inGame){
    var tagArray = [];
    if(!inGame.hasOwnProperty("jgTags")){
      return tagArray;
    }
    for(var i in inGame.jgTags){
      var tag = inGame.jgTags[i];
      tagArray.push(tag);
    }
    return tagArray;
  };

  interface.objectToArray = function(inObject){
    var outArray = [];
    for(var i in inObject){
      if(inObject.hasOwnProperty(i)){
        outArray.push(inObject[i]);
      }
    }
    return outArray;
  };

  //normalise all dates while at it
  interface.gamesObjectToArray = function(gamesObject){
    var retArray = interface.objectToArray(gamesObject);
    for(var i in retArray){
      var game = retArray[i]; 
      game = standardiseDateRepresentation(game);
      retArray[i] = game;
    };

  };

  interface.maxOfProperty = function(dataArray,searchProperty){
    var maxValue = undefined;
    for(var i in dataArray){
      //if the property exists
      if(dataArray[i][searchProperty] !== undefined){
        var value = dataArray[i][searchProperty];
        //if the max hasnt been set
        if(maxValue === undefined){
          maxValue = dataArray[i][searchProperty];
        }else if(value > maxValue){
          maxValue = value;
        }
      }
    }
    return maxValue;
  };








  return interface;

});