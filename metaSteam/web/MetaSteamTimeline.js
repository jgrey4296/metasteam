/**visualises release dates of games across time
   EITHER: release dates [x] vs time played [y]
   OR: last played [x] across time played [y]
   OR: relase data [x] across category [y]x
   @module metasteamtimeline
*/

define(['d3','underscore'],function(d3,_){

    /**
       @class Timeline
       @constructor
     */
    var Timeline = function(hub){
        this.hub = hub;
        this.colours = this.hub.colours;

        this.helpText = [
            "Timeline visualisation",
            "Displays INSTALLED games on a timeline of when they were released",
            "Height of bars shows how much each game has been played"
        ];
        
        //Time format:
        this.timeFormat = d3.time.format("%b %e, %Y");
        //console.log("Time format test:",this.timeFormat.parse("May 12, 2012"));
        this.x_offset = 20;

        this.width = this.hub.internalWidth;
        this.height = this.hub.internalHeight;
        //Time scale:
        this.timeScale = d3.time.scale();//.range([0,this.width]);
        //console.log(this.timeScale(this.timeFormat.parse("May 12,2012")));
        //Axis:
        this.axis = d3.svg.axis();//.scale(this.timeScale);
        //Play time axis:
        this.playScale = d3.scale.log()
            //.range([0,this.height * 0.5]);

        //updating the scale and axis:
        this.timeScale.range([0,(this.width-(2 * this.x_offset))]);
        this.axis.scale(this.timeScale);
        this.playScale.range([0,this.height * 0.5]);

        
        //--------------------
        
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
       @class MetaSteamTimeline
       @method registerdata
       @purpose load the data in and transform as necessary
    */
    Timeline.prototype.registerData = function(data){
        this.data = data;
        var releaseDates = [];

        //copy over hours_forever from profile
        for(var x in data.profile){
            var game = data.profile[x];
            if(data.installed[game.appid]){
                data.installed[game.appid]["hours_forever"] = game.hours_forever;
            }
        }
        
        //Set the scale for the release dates:
        for(var x in data.installed){
            var game = data.installed[x];
            if(game.releaseDate && game.releaseDate.original){
                game["_parsedReleaseDate"] = this.timeFormat.parse(game.releaseDate.original);
                releaseDates.push(game["_parsedReleaseDate"]);
            }
        }
        var extent = d3.extent(releaseDates);
        //Use the release dates to set the timescales domain:
        this.timeScale.domain(extent);
        
        //Get the extent of time played
        var time_played_extent = d3.extent(
            data.profile.filter(function(d){
                if(d.hours_forever) return true;
                return false;
            }), function(d){
                return Number(d.hours_forever);
            });

        console.log("Hours Played Extent:",time_played_extent);
        this.playScale.domain(time_played_extent);

        //Setup scaleToColours for size on disk
        var sizeExtent = d3.extent(
            _.values(data.installed),function(d){
                if(Number(d.SizeOnDisk) > 0){
                    return Number(d.SizeOnDisk);
                }
            });

        console.log("size extent",sizeExtent);
        //this.scaleToColours.domain(sizeExtent);

        //get the date last played for each game, and the extent:
        var tlRef = this;
        this.data.profile.forEach(function(d){
            if(!d.last_played) return;
            if(d.last_played < 90000) return;
            var epoch = new Date(0);
            epoch.setUTCSeconds(d.last_played);
            d.__date_last_played = epoch;
            if(d.appid && tlRef.data.installed[d.appid]){
                tlRef.data.installed[d.appid]["__date_last_played"] = epoch;
            }
        });

        var playedRange = d3.extent(this.data.profile,
                                    function(d){
                                        if(!d.__date_last_played) return new Date()
                                        return d.__date_last_played;
                                    });

        console.log("Played Range:",playedRange);
        
    };

    /**
       @class MetaSteamTimeline
       @method draw
       @purpose draws the visualisation
     */
    Timeline.prototype.draw = function(){
        var tlRef = this;
        this.drawAxes();

        var games = _.values(this.data.installed).filter(function(d){
            if(d["_parsedReleaseDate"]) return true;
            return false;
        });

        //Bind the data
        var bound = d3.select("#mainVisualisation").append("g")
            .attr("id","gameData").selectAll(".indGame")
            .data(games,function(d){return d.appid;});

        bound.exit().remove();

        //Draw the individual games
        var enter = bound.enter().append("g")
            .classed("indGame",true)
            .on("mouseover",function(d){
                //first line: hours and release date
                var outString = d.name;
                outString += ": Hours: " + d.hours_forever;
                outString += " Released: " + d.releaseDate.original;
                console.log("Setting text to",outString);
                d3.select("#gameTitle").select("#gameTitleMainText")
                    .text(outString);

                //Second line: last played
                if(d.__date_last_played){
                    var s = " Last Played: " + d.__date_last_played.toDateString();
                    d3.select("#gameTitle").select("#gameTitleSecondary")
                        .text(s);
                }
                    
            })
            .on("mouseout",function(d){
                d3.select("#gameTitle").selectAll("text")
                    .text("");
            })
            .on("click",function(d){
                tlRef.hub.drawGame(d);
            });

        d3.select("#mainVisualisation").selectAll(".indGame")
            .attr("transform",function(d){
                return "translate(" + (tlRef.x_offset + tlRef.timeScale(d["_parsedReleaseDate"])) + "," + (tlRef.height * 0.8) + ")";
            });


        
        enter.append("rect");

        d3.select("#mainVisualisation").selectAll("rect")
            .attr("height",function(d){
                if(d.hours_forever){
                    return tlRef.playScale(Number(d.hours_forever));
                }else{
                    return 0;
                }
            })
            .attr("width",5)
            .attr("transform",function(d){
                var a = 0;
                if(d.hours_forever){
                    a = tlRef.playScale(Number(d.hours_forever));
                }
                return "translate(0," + -(a) + ")";
            })
            .style("fill",function(d,i){
                return tlRef.oneOf20Colours(i%20);
            });
        
    };


    /**
       @class MetaSteamTimeline
       @method drawAxes
       @purpose draw the axes of the visualisation
     */
    Timeline.prototype.drawAxes = function(){
        var vRef = this;
        if(!d3.select("#mainVisualisation").select("#axis").empty()){
            return;
        }
        //Draw the axes:
        d3.select("#mainVisualisation").append("g")
            .attr("id","axis")
            .attr("transform","translate(" + this.x_offset +"," + (this.height * 0.8) +")")
            .call(this.axis);

        d3.select("#axis")
            .selectAll(".tick")
            .style("fill","white");
        
        d3.select("#axis")
            .select(".domain")
            .style("fill","white");

        if(d3.select("#axis").select(".axisTitle").empty()){
            var axisTitle = d3.select("#axis").append("g")
                .classed("axisTitle",true)
                .attr("transform","translate(" + (vRef.hub.internalWidth * 0.5) + ",40)");

            axisTitle.append("text")
                .text("X axis: Release Date, Y Axis: Play Time")
                .style("text-anchor","middle")
                .style("fill","white");
            
        }
    };

    /**
       @class MetaSteamTimeline
       @method cleanUp
       @purpose cleans up any display elements added by the visualisation's draw method
     */
    Timeline.prototype.cleanUp = function(){
        console.log("Timeline cleanup");
        d3.select("#axis").remove();
        d3.selectAll(".indGame").remove();
        d3.select("#gameTitle").selectAll("text").text("");
    };

    return Timeline;
    
});
