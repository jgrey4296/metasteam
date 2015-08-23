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
    },
    shim:{
        underscore:{
            exports:'_',
        }
    }
});


require(['d3','ms_circlepack2','underscore','ms_tooltip','metaSteamHub'],function(d3,Mscp,_,Tooltip,Hub){
    //Main:
    //Load the json data
    console.log("hello world");

    
    var data = undefined;
    var mscp = undefined;

    var metaSteamHub = new Hub();
    metaSteamHub.draw();
    
    //Load the json Data:
    d3.json("/data/gameData.json",function(d){
        data = d;
        console.log("Base DATA:",d);

	//convert and copy 'hours_forever' into number before using in mscp
    //from profile data to installed data
	var installed = d.installed;
	for(var i in d.profile){
	    var game = d.profile[i];
	    if(game['appid'] === undefined) continue;
	    if(game['hours_forever'] === undefined) continue;
	    var installedGame = installed[game['appid']];
	    if(installedGame === undefined) continue;
	    installedGame['hours_forever'] = Number(game['hours_forever']);
	}

        metaSteamHub.registerData(data);
        metaSteamHub.draw();
        //mscp = new Mscp(svgWidth-100,svgHeight,d.installed,tooltip);
        //mscp.draw();
        
    });

});
