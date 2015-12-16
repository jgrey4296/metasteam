/**
   @class MultiplayerVisualsationn
   @purpose displays all multiplayer tagged installed games, also gets the number of players for each
   @requiredMethod registerData
   @requiredMethod draw
   @requiredMethod cleanUp
*/

define(['d3','underscore'],function(d3,_){

    /**
       @class MultiplayerVisualisation
       @constructor
     */
    var Visualisation = function(hub){
        this.hub = hub;
        this.width = this.hub.internalWidth;
        this.height = this.hub.internalHeight;
        this.colours = this.hub.colours;

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
        var vRef = this;
        console.log("Template: Registering Data");
        this.data = data;
                
        var multiplayerGames = _.values(this.data.installed).map(function(game){
            if(game.__tags && game.__tags.join(" ").match(/[mM]ulti[ -]?[Pp]layer/)){
                return game;
            }
        }).filter(function(d){
            if(d) return true;
            return false;
        });
        console.log("Multiplayer games:",multiplayerGames);
        var mpGameIds = multiplayerGames.map(function(d){
            return d.appid;
        });
        console.log("mpGameIds:",mpGameIds);
        
        this.resultData = mpGameIds.map(function(d){
            return {
                "id" : d,
                "name" : vRef.data.installed[d].name,
                "value" : 0
            };
        });
        console.log("result data:",this.resultData);


        this.hub.sendHowManyPlayingMessageToServer(mpGameIds,function(result){
            console.log("Result of how many playing: ",result);
            vRef.resultData = result.map(function(d){
                return {
                    "id" : d[0],
                    "name" : vRef.data.installed[d[0]],
                    "value" : d[1]
                };
            });

            vRef.resultData.sort(function(a,b){
                if(a.value > b.value) return -1;
                if(b.value > a.value) return 1;
                return 0;
            });
            
            vRef.cleanUp();
            vRef.draw();
        });
        
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(){
        console.log("Template: Drawing:",this.resultData);
        var mpVis = d3.select("#mainVisualisation").append("g")
            .attr("id","multiplayervisualisation");
        
        var bound = mpVis.selectAll("g").data(this.resultData);

        var gs = bound.enter().append("g")
            .attr("transform",function(d,i){
                return "translate(30," + (i * 30) + ")";
            });

        gs.append("rect")
            .attr("width",500)
            .attr("height",25)
            .style("fill",this.colours.lightBlue);

        gs.append("text")
            .attr("transform","translate(15,15)")
            .style("fill",this.colours.text)
            .text(function(d){
                return d.name + " : " + d.value;
            });
        
    };



    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("cleaning up");
        d3.select("#multiplayervisualisation").remove();
    };

    return Visualisation;
    
});