/**
   The Main module of metasteam.js
   relies on being run from a server,
   at root ../ to allow access to ../data
   @module metasteam
   @main
*/
require.config({
    paths:{
        baseUrl : 'web',
        lodash : "libs/lodash",
        d3:"libs/d3.min",
        msTimeline:'MetaSteamTimeline',
        
    },
    shim:{
        underscore:{
            exports:'_',
        }
    }
});


require(['d3','lodash','MetaSteamHub'],function(d3,_,Hub){
    //Main:
    //Load the json data
    var metaSteamHub = new Hub();
    
    //Load the json Data:
    d3.json("/data/gameData.json",function(d){
        console.log("Loaded Game Data:",d);

        metaSteamHub.registerData(d);
        metaSteamHub.draw();
    });

    // //Test post message:
    // console.log("Setting up test request");

    // //Create the commands/parameters of the post message
    // var commandString = "";
    // commandString += "&command=" + "testCommand";
    // commandString += '&testField=' + "blah";
    // console.log("Command string: " + commandString);

    // //create the request
    // var request = new XMLHttpRequest();
    // request.open("POST","nowhere.html",true);
    // //the callback for the request:
    // request.onreadystatechange = function(){
    //     console.log("state change: ",request.readyState);
    //     if(request.readyState === 4){
    //         var result = request.responseText;
    //         var resultJson = JSON.parse(result)
    //         console.log("XML Respone to test command:",resultJson[2]);
    //     }
    // };
    // //Set the headers of the request
    // request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
    // request.setRequestHeader('Content-Length',commandString.length);
    // //send it, with the parameters:
    // request.send(commandString);

    
});
