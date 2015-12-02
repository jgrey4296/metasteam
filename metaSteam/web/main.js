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
        underscore:"libs/underscore",
        d3:"libs/d3.min",
        msCirclePack:'ms_circlepack2',
        msTimeline:'MetaSteamTimeline',
        
    },
    shim:{
        underscore:{
            exports:'_',
        }
    }
});


require(['d3','underscore','MetaSteamHub'],function(d3,_,Hub){
    //Main:
    //Load the json data
    
    var data = undefined;
    var metaSteamHub = new Hub();
    //metaSteamHub.draw();
    
    //Load the json Data:
    d3.json("/data/gameData.json",function(d){
        data = d;
        console.log("Base DATA:",d);

        metaSteamHub.registerData(data);
        metaSteamHub.draw();
    });

});
