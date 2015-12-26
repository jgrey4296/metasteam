/**
   @class UpdatedSinceLastPlayed
   @purpose To visualise games that are installed, that have been updated since they were last playe
   by the user
*/

define(['d3','underscore'],function(d3,_){

    /**The main class
       @class Timeline
       @constructor
     */
    var Visualisation = function(hub){
        this.hub = hub;
        this.width = this.hub.internalWidth;
        this.height = this.hub.internalHeight;
        this.colours = this.hub.colours;

        this.helpText = [
            "Updated since last played visualisation",
            "Shows INSTALLED games that have a more recent update date",
            "than last played date",
            "Games are sorted from most to least played"
            

        ];
        
        //Colours scaling
        this.scaleToColours = d3.scale.linear()
            .domain([0,100])
            .rangeRound([0,20]);
        this.colourScale = d3.scale.category20b();

        //Function to get a colour from a value
        this.oneOf20Colours = function(val){
            return this.colourScale(this.scaleToColours(val));
        };


        
    };

    /**
       @method registerdata
    */
    Visualisation.prototype.registerData = function(data){
        console.log("Template: Registering Data");
        this.data = data;
        this.updatedSincePlayed = [];
        
        //Go through all installed games, getting last play time and last update time
        var lastPlayedGames = this.data.profile.map(function(game){
            if(game.last_played !== undefined && this.data.installed[game.appid]){
                var last_played = new Date(0);
                last_played.setUTCSeconds(game.last_played);
                var last_updated = new Date(0);
                last_updated.setUTCSeconds(this.data.installed[game.appid].LastUpdated);
                var hoursPlayed = Number(game.hours_forever);
                if(hoursPlayed === NaN) hoursPlayed = 0;

                
                return {
                    "name" : game.name,
                    "appid" : game.appid,
                    "last_played" : last_played,
                    "last_updated" : last_updated,
                    "hours_played" : hoursPlayed
                };
            }
        },this).filter(function(d){if(d){return true;}});

        var updatedSinceLastPlayed = lastPlayedGames.filter(function(game){
            if(game.last_updated > game.last_played){
                return true;
            }
        });

        //Date set to a list of games that have been updated since they were last played
        //sorted by how many hours the user has played of them
        this.data = updatedSinceLastPlayed.filter(function(game){
            if(game.hours_played) return true;
        }).sort(function(a,b){ return a.hours_played < b.hours_played; });

        
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(){
        console.log("Template: Drawing");

        //todo: split into columns
        
        var list = d3.select("#mainVisualisation").append("g")
            .attr("id","updatedSinceLastPlayedList");

        var boundList = list.selectAll("g").data(this.data);
        
        var indGame = boundList.enter().append("g")
            .classed("game",true)
            .attr("transform",function(d,i){
                return "translate( " + 100 + "," + (20 + (i * 35))  + ")";
            });

        indGame.append("rect")
            .attr("width",500).attr("height","30")
            .style("fill",this.colours.darkBlue);

        indGame.append("text")
            .attr("transform",'translate(20,20)')
            .text(function(d){
                return d.name
            })
            .style("fill",this.colours.text);
                
    };



    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("Template: cleanUp");
        d3.select("#updatedSinceLastPlayedList").remove();
    };

    return Visualisation;
    
});
