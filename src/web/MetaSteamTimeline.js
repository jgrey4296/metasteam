/**visualises release dates of games across time
   EITHER: release dates [x] vs time played [y]
   OR: last played [x] across time played [y]
   OR: relase data [x] across category [y]x
   @module metasteamtimeline
*/

define(['d3','underscore'],function(d3,_){

    /**The main class
       @class Timeline
       @constructor
     */
    var Timeline = function(width,height,colours){
        this.width = width - 30;
        this.height = height;
        this.colours = colours;
        //Time format:
        this.timeFormat = d3.time.format("%b %e, %Y");
        console.log("Time format test:",this.timeFormat.parse("May 12, 2012"));
        //Time scale:
        this.timeScale = d3.time.scale().range([0,this.width]);
        console.log(this.timeScale(this.timeFormat.parse("May 12,2012")));
        //Axis:
        this.axis = d3.svg.axis().scale(this.timeScale);

        //Play time axis:
        this.playScale = d3.scale.linear()
            .range([0,height * 0.8]);
        
    };

    /**
       @method registerdata
    */
    Timeline.prototype.registerData = function(data){
        this.data = data;
        var releaseDates = [];
        //Set the scale for the release dates:
        for(var x in data.installed){
            var game = data.installed[x];
            if(game.releaseDate.original){
                game["_parsedReleaseDate"] = this.timeFormat.parse(game.releaseDate.original);
                releaseDates.push(game["_parsedReleaseDate"]);
            }
        }
        var extent = d3.extent(releaseDates);
        //Use the release dates to set the timescales domain:
        this.timeScale.domain(extent);

        //Get the extent
        var played_extent = d3.extent(
            _.values(data.profile).filter(function(d){
                if(d.last_played && d.last_played > 90000) return true;
                return false;
            }),function(d){
                return d.last_played;
            });

        var max = d3.max(_.values(data.profile),function(d){
            return d.last_played;
        });
        var min = d3.min(_.values(data.profile),function(d){
            return d.last_played;
        });
        console.log("MAx:",new Date(Date.now() - max),"MIN:",new Date(Date.now() - min));
        
        console.log("Played Extents:",played_extent);
        for(var i in played_extent){
            console.log(played_extent[i],new Date(Date.now() - played_extent[i]));
        }
        
    };

    /**
       @method draw
     */
    Timeline.prototype.draw = function(){
        tlRef = this;
        this.drawAxes();

        //Bind the data
        var games = _.values(this.data.installed).filter(function(d){
            if(d["_parsedReleaseDate"]) return true;
            return false;
        });

        var gameData = d3.select("#mainVisualisation").append("g")
            .attr("id","gameData").selectAll(".indGame")
            .data(games,function(d){return d.appid;});

        gameData.exit().remove();

        //Draw the individual games
        var indGames = gameData.enter().append("g")
            .classed("indGame",true)
            .attr("transform",function(d){
                return "translate(" + (10 + tlRef.timeScale(d["_parsedReleaseDate"])) + "," + (tlRef.height * 0.8) + ")";
                });

        indGames.append("rect")
            .attr("height",200)
            .attr("width",5)
            .attr("transform","translate(0,-200)")
            .style("fill","white");
        
    };


    //Draw the axes:
    Timeline.prototype.drawAxes = function(){
        if(!d3.select("#mainVisualisation").select("#axis").empty()){
            return;
        }
        //Draw the axes:
        d3.select("#mainVisualisation").append("g")
            .attr("id","axis")
            .attr("transform","translate(10," + (this.height * 0.8) +")")
            .call(this.axis);

        d3.select("#axis")
            .selectAll(".tick")
            .style("fill","white");
        
        d3.select("#axis")
            .select(".domain")
            .style("fill","white");
    };

    /**
       @method cleanUp
     */
    Timeline.prototype.cleanUp = function(){
        d3.select("#axis").remove();
        d3.selectAll(".indGame").remove();
    };

    return Timeline;
    
});
