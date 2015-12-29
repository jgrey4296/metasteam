/**
   The hub for metaSteam, giving the general template,
   and access to different visualisations
*/

define(['d3','underscore','msTimeline','UpdatedSinceLastPlayed','GenrePie','MultiplayerVisualisation','CalendarVisualisation','CoOccurrenceMatrix','TemplateVisualisation','CirclePack3','pubDevVis','SearchVis'],function(d3,_,MetaSteamTimeline,UpdatedSinceLastPlayed,GenrePie,MultiplayerVisualisation,CalendarVisualisation,CoOccurrenceMatrix,TemplateVisualisation,CirclePack3,PubDevVis,SearchVis){

    var idRegex = /\W/g;
    
    /**The Main hub for MetaSteamWeb
       Provides buttons for the visualisations
       and general stats
       @class Hub
       @constructor
     */
    var Hub = function(){
        //internal reference for use in d3 callback functions
        console.log("Creating MetaSteam Hub");
        var hubReference = this;

        this.helpText = [
            "MetaSteam:",
            "A server and web visualisation to provide easier access to unmanageable game libraries.",
            "Buttons at the top of the screen provide different visualisations of your steam library.",
            "",
            "The hub displays proportions of:",
            "Installed vs Not Installed games",
            "Played (hours played > 1) vs Not Played games",
            "Scraped (web information retrieved) vs Not Scraped games"
        ];

        
        //Stored Colours:
        this.colours = {
            grey : d3.rgb(19,21,27),
            text : d3.rgb(237,255,255),
            textBlue : d3.rgb(98,188,238),
            textGrey : d3.rgb(132,146,154),
            darkBlue : d3.rgb(23,50,77),
            darkerBlue : d3.rgb(20,38,60),
            lightBlue: d3.rgb(53,99,142),
            green : d3.rgb(108,141,7),
        };
        
        //Stored Data
        this.data = null;//the main game data
        this.margin = 30;//side margins
        //The usable size without causing scrolling:
        this.svgHeight = window.innerHeight - this.margin;
        this.svgWidth = window.innerWidth - this.margin;
        console.log("Height:",this.svgHeight,"Width:",this.svgWidth);        

        this.sideBarWidth = this.svgWidth * 0.15;

        //Internal Width
        this.internalWidth = this.svgWidth - (2 * this.sideBarWidth);

        //Storage For buttons:
        this.buttons = {};
        this.buttonHeight = 60;
        this.button_X_Offset = this.internalWidth * 0.05;
        this.button_Y_Offset = 10;

        //An additional offset to the main visualisation for clarity purposes
        this.padding = 20;
        this.mainVisualisationOffset = 20;

        //the size of the header:
        this.headerHeight = this.mainVisualisationOffset + this.button_Y_Offset + this.buttonHeight;
        
        //Internal Height:
        this.internalHeight = this.svgHeight - (this.headerHeight + this.padding);

        /**
           ADD ADDITIONAL MODES HERE:
         */
        this.registerButton("Hub",this,true);
        this.registerButton('Circle Pack',new CirclePack3(this));
        this.registerButton("Timeline",new MetaSteamTimeline(this));
        this.registerButton('Updated/Played',new UpdatedSinceLastPlayed(this));
        this.registerButton('GenrePie', new GenrePie(this));
        this.registerButton('Multiplayer', new MultiplayerVisualisation(this));
        this.registerButton('Calendar',new CalendarVisualisation(this));
        this.registerButton('Tag Matrix',new CoOccurrenceMatrix(this));
        this.registerButton('Pubs/Devs',new PubDevVis(this));
        this.registerButton('Search', new SearchVis(this));
        

        //            {name:"timeline"},
        //          {name:"chord"},
        //        {name:"compare user"},
        
        //Button header details:
        this.buttonWidth = (this.internalWidth * 0.9) / _.values(this.buttons).length;
        
        //Store for use in circlepack/other vis:
        // d3.select("head").append("g")
        //     .attr("id","globalVars")
        //     .attr("sideBarWidth",this.sideBarWidth)
        //     .attr("internalWidth",this.internalWidth);
        
        //Reusable Scale for graph drawing
        this.scale = d3.scale.linear();
        this.scale.range([0, (this.internalHeight * 0.18)]);

        //Scale for colouring
        this.colourScale = d3.scale.category10();

        this.setupSvg();
    };


    /**
       @class Hub
       @method sendStartMessageToServer
       @purpose sends a post request to the metaSteam server to start a specified game
     */
    Hub.prototype.sendStartMessageToServer = function(appid,callback){
        //Create the commands/parameters of the post message
        var commandString = "";
        commandString += "&command=" + "startGame";
        commandString += '&value=' + appid;
        console.log("Message To Send: " + commandString);

        this.sendMessageToServer(commandString,callback);
    };


    Hub.prototype.sendHowManyPlayingMessageToServer = function(appidArray,callback){
        if(!appidArray instanceof Array){
            throw new Error("Checking how many playing takes an array");
        }
        var commandString = "";
        commandString += "&command=" + "howManyPlaying";
        commandString += "&value=" + JSON.stringify(appidArray);
        console.log("Message to send: " + commandString);

        this.sendMessageToServer(commandString,callback);
    };

    Hub.prototype.sendCompareUserMessageToServer = function(username,callback){
        var commandString = "";
        commandString += "&command=" + "compare";
        commandString += "&value=" + username;
        console.log("Message to send: " + commandString);
        this.sendMessageToServer(commandString,callback);
    };
    
    /**
       @class Hub
       @method sendMessageToServer
       @purpose the general method for communicating with the server
     */
    Hub.prototype.sendMessageToServer = function(commandString,callback){
        //create the request
        var request = new XMLHttpRequest();
        request.open("POST","nowhere.html",true);
        //the callback for the request:
        request.onreadystatechange = function(){
            if(request.readyState === 4){
                var result = request.responseText;
                console.log("Unparsed result: ",result);
                try{
                    var resultJson = JSON.parse(result)
                    console.log("XML Response:",resultJson);
                    if(callback && typeof callback === 'function'){
                        callback(resultJson);
                    }
                }catch(e){
                    console.error("Skipping result processing: ",e);
                }
            }
        };
        //Set the headers of the request
        request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        request.setRequestHeader('Content-Length',commandString.length);
        //send it, with the parameters:
        request.send(commandString);
    };
    

    /**
       @class Hub
       @method registerButton
       @purpose ensure a class has the required methods before adding it to the buttons object
       @note the buttons object is automatically turned into buttons in method:draw.
       @param selected a boolean to annotate an entry for the initally selected button
     */
    Hub.prototype.registerButton = function(name,instance,selected){
        if(selected === undefined) selected = false;
        console.log("Registering button: ",name);
        if(! instance.cleanUp){
            throw new Error("Button instance with no cleanUp Method: " + name);
        }
        if(! instance.draw){
            throw new Error("Button instance with no draw method " + name);
        }
        if(! instance.registerData){
            throw new Error("Button instance with no registerData Method " + name)
        }
        this.buttons[name] = {"name":name,"value":instance,"selected": selected};
    };
    
    /**
       @class Hub
       @method cleanUp
       @purpose cleanup the things drawn by this class. 
       @note mainly the general stats, and any buttons
     */
    Hub.prototype.cleanUp = function(){
        //cleanup the hub:
        d3.select("#generalStats").remove();

        //cleanup everything else:
        _.keys(this.buttons).forEach(function(d){
            //skip hub, as its already been cleaned
            if(d === "Hub") return;
            this.buttons[d].value.cleanUp();
        },this);
    };


    /**
       @class Hub
       @method setupSvg
       @purpose draw the things common to all views. sidebars, background etc.
     */
    //Setup the sides of the svg, which are the same
    //for all parts of MetaSteamWeb
    Hub.prototype.setupSvg = function(){
        //Reference for use in d3 callbacks
        var hubReference = this;
        //Setup the svg
        var svg = d3.select('body').append('svg')
            .attr('id','mainsvg')
            .attr('height',this.svgHeight)
            .attr('width',this.svgWidth);


        svg.append("rect")
            .attr("width",this.svgWidth)
            .attr("height",this.svgHeight)
            .style("fill",this.colours["grey"]);
        //SideBar:
        var leftBar = d3.select('#mainsvg').append("g")
            .attr("id","leftBar");
        leftBar.append('rect')
            .attr('width',this.sideBarWidth )
            .attr('height',this.svgHeight)
            .attr("rx",5)
            .attr("ry",5)
            .style("fill",this.colours["darkBlue"]);

        var rightBar = d3.select("#mainsvg").append("g")
            .attr("id","rightBar")
            .attr('transform',
                  'translate(' +
                  (this.svgWidth - this.sideBarWidth)
                  + ',0)');
       
        rightBar.append('rect')
            .attr('width',this.sideBarWidth)
            .attr('height',this.svgHeight)
            .attr("rx",5)
            .attr("ry",5)
            .style("fill",this.colours["darkBlue"]);
        
        
        d3.select("#mainsvg")
	        .append("g")
	        .attr("id","mainVisualisation")
            .attr("transform",
                  "translate("
                  + this.sideBarWidth + "," + (this.button_Y_Offset + this.buttonHeight + this.mainVisualisationOffset) + ")")
            .attr("width",this.sideBarWidth);

        //Draw the Header bar:
        var header = d3.select("#mainsvg").append("g")
            .attr("id","headerBar")
            .attr("transform",
                  "translate(" +
                  (this.sideBarWidth + 20) + ",0)");

        header.append("rect")
            .attr("width",this.internalWidth - 40)
            .attr("height",this.headerHeight)
            .attr("rx",5)
            .attr("ry",5)
            .style("fill",this.colours.darkerBlue);

        var gameTitle = header.append("g")
            .attr("id","gameTitle")
            .attr("transform","translate("
                  + (this.internalWidth * 0.5) + "," + (this.headerHeight + 20) + ")");

        gameTitle.append("text")
            .attr("id","gameTitleMainText")
            .text("")
            .style("fill",this.colours["textGrey"])
            .style("text-anchor","middle");

        gameTitle.append("text")
            .attr("id","gameTitleSecondary")
            .text("")
            .style("fill",this.colours["textGrey"])
            .style("text-anchor","middle")
            .attr("transform","translate(0,30)");
        
    };

    /**
       @class Hub
       @method registerData
       @purpose take a loaded json file of data and store it for use
     */
    Hub.prototype.registerData = function(data){
        console.log("Registering Data",data);
        this.data = data;

        //copy over hours forever to installed games
        this.data.profile.forEach(function(game){
            if(this.data.installed[game.appid] !== undefined){
                this.data.installed[game.appid].hours_forever = game.hours_forever;
            }
        },this);
        
    };

    /**
       @class Hub
       @method draw
       @purpose draw this class.
       @note ie: buttons, sidebars, graphs.
     */
    Hub.prototype.draw = function(){
        var hubRef = this;
        //Draw Button to clear and draw circlepack:
        //Draw Button to clear and draw timeline mockup
        //Draw button for chord diagram
        this.drawButtons(_.values(this.buttons));
        var sections = ["About","Installed","Played","Scraped"];        
        //If there is data to draw, create
        //the general statistics view
        if(this.data){
            //Create 3 groups, spaced appropriately
            //Create if doesnt exist, otherwise just retrieve
            if(d3.select("svg").select("#generalStats").empty()){
                //domRoot->svg->genStats->[each child stat]
                var genStats = d3.select("#mainVisualisation").append("g").attr("id","generalStats");

                //Aim for this width for the stat bars
                var aimWidth = this.internalWidth - (this.padding * 2);
                var sectionHeight = (this.internalHeight / sections.length) - this.padding;
                
                var bound = genStats.selectAll(".section").data(sections);
                var enterSelection = bound.enter().append("g").classed("section",true)
                    .attr("id",function(d){ return d; })
                    .attr("transform",function(d,i){
                        return "translate(" + hubRef.padding + "," + (hubRef.padding + ((hubRef.internalHeight / sections.length) * i)) + ")";
                    });

                enterSelection.append("rect")
                    .attr("width",aimWidth)
                    .attr("height",sectionHeight)
                    .attr("rx",5)
                    .attr("ry",5)
                    .style("fill",this.colours.darkerBlue);
            }

            //Draw the installed/not installed bar chart
            var statData = this.getStats();
            console.log("Stat Data:",statData);
            this.drawGraph("InstalledGames",d3.select("#Installed"),statData.installed);
            this.drawGraph("ScrapedGames",d3.select("#Scraped"),statData.scraped);
            this.drawGraph("PlayedGames",d3.select("#Played"),statData.played);

            this.drawText(this.helpText,d3.select("#About"),sectionHeight);
        }
    };

    /**
       @class Hub
       @method drawGraph
       @purpose draw some data to a domelement.
     */
    Hub.prototype.drawGraph = function(name,domElement,data){
        console.log("Drawing Graph");
        var hubRef = this;
        //Setup the scaling input
        var scaleDomain = [0,0];
        //scaleDomain[1] = d3.max(data,function(d){
        //    return (_.keys(d.games)).length;
        //});
        scaleDomain[1] = _.keys(data[0].games).length +
            _.keys(data[1].games).length;
        this.scale.domain(scaleDomain);
        //console.log(this.scale.domain(),this.scale.range());

        //Bind the data
        var root = domElement.selectAll("g").data(data,function(d){
            return d.name;
        });

        //remove unneeded data
        root.exit().remove();
        //draw the data
        var barWidth = (hubRef.internalWidth * 0.8) / data.length;
        var graphGroup = root.enter().append("g")
            .attr("id",function(d){
                return d.name;
            })
            .attr("transform",function(d,i){
                //console.log(d,i);
                return "translate(" + ((hubRef.internalWidth * 0.1) + (i * barWidth)) + "," + (0) +")";
            });

        //rectangle, size of the value of the datum, scaled
        graphGroup.append("rect")
            .attr("width",barWidth)
            .attr("transform",function(d){
                return "translate(0," +
                    (hubRef.scale.range()[1] - hubRef.scale(_.keys(d.games).length) + 10) + ")";
            })
            .attr("height",function(d){
                var val = hubRef.scale((_.keys(d.games)).length);
                //console.log("Height for ", d.name,val);
                return val;
            })
            .style("fill",function(d,i){
                return hubRef.colourScale(i);
            })
            .attr("rx",5)
            .attr("ry",5);


        //Draw a label:
        graphGroup.append("text")
            .text(function(d){
                return d.name + ": " + (_.keys(d.games)).length
                    + "/" + hubRef.scale.domain()[1];
            })
            .attr("transform",
                  "translate(0," +
                  (hubRef.scale.range()[1] + 25) + ")")
            .style("fill","white");
        
    };

    
    /**
       @class Hub
       @method drawButtons
       @purpose draw the passed in data about buttons, as buttons to the header bar dom element.
       @note EVERY button when clicked goes triggers: hub.cleanup, button.registerData, button.draw.
     */
    Hub.prototype.drawButtons = function(data){
        var hubRef = this;
        var buttonWidth = hubRef.buttonWidth;
        //console.log("Drawing Buttons:",data,buttonWidth);
        //select the right bar and bind
        var groups = d3.select("#headerBar").selectAll(".button").data(data,function(d){return d.name;});

        groups.exit().remove();
        var newGroups = groups.enter().append("g").attr("id",function(d){
            if(! d.id) d.id = d.name.replace(idRegex,"");
            return "button_"+ d.id;
        })
            .attr("class","button")
            .attr("transform",function(d,i){
                return "translate(" + ((hubRef.button_X_Offset) + (i * (buttonWidth))) +","
                    + hubRef.button_Y_Offset + ")";
            })
            .on("click",function(d){
                console.log("Clicked on:",d.name,d.id);
                if(hubRef.buttons[d.name]){
                    //set the selected state:
                    _.values(hubRef.buttons).forEach(function(e){
                        e.selected = false;
                    });
                    d.selected = true;
                    
                    d3.selectAll(".button").selectAll("rect").style("fill",function(e){
                        if(e.selected){
                            return hubRef.colours.green;
                        }
                        return hubRef.colours.lightBlue;
                    });

                    //Clean up
                    hubRef.cleanUp();
                    //register data
                    //ess. 'no-op' for 'hub'
                    hubRef.buttons[d.name].value.registerData(hubRef.data);
                    //draw
                    hubRef.buttons[d.name].value.draw();
                }
            })
            .on("mouseover",function(d){
                //on mouseover, turn the button green
                //console.log("mouseover button: ",d.name);
                d3.select(("#button_" + d.id)).select("rect").transition()
                    .style("fill",hubRef.colours["green"]);

                //todo:
                //draw a help window, explaining what the visualisation for the button does
                var help = d3.select("#help");
                if(help.empty()){
                    help = d3.select("#headerBar").append("g").attr("id","help")
                    .attr("transform","translate(0,100)");
                          
                    help.append("rect")
                        .attr("height",200)
                        .style("fill","grey")
                        .attr("width",hubRef.internalWidth - (hubRef.padding * 2));

                    var bound = help.selectAll("text").data(d.value.helpText);
                    bound.enter().append("text")
                        .style("text-anchor","middle")
                        .style("fill","black")
                        .text(function(e) { return e; })
                        .attr("transform",function(e,i){
                            return "translate(" + ((hubRef.internalWidth - (hubRef.padding * 2)) * 0.5) + "," + (20 + (i * 20))+ ")";
                        });
                    
                }
                
            })
            .on("mouseout",function(d){
                //on mouseout, return the button to orig colour
                d3.select(("#button_" + d.id)).select("rect").transition()
                    .style("fill",function(e){
                        if(e.selected) return  hubRef.colours.green;
                        return hubRef.colours.lightBlue;
                    });

                var help = d3.select("#help");
                if(!help.empty()){
                    help.remove();
                }
                
            });

        //draw the button 
        newGroups.append("rect")
            .attr("width",buttonWidth - 5)
            .attr("height",hubRef.buttonHeight)
            .style("fill",function(e){
                if(e.selected) return hubRef.colours.green;
                return hubRef.colours.lightBlue;
            });
        
        newGroups.append("text")
            .text(function(d){
                return d.name;
            })
            .attr("transform","translate(" + (buttonWidth * 0.5) + ",45)")
            .style("text-anchor","middle")
            .style("fill",this.colours["textBlue"]);
        
    };

    Hub.prototype.getStats = function(){
        //Draw graphs for each of the three sections
        var returnData = {
            "installed" : [{name:"Installed", games: {}},{name:"Not Installed",games:{}}],
            "scraped" : [{name:"Scraped",games:{}},{name:"Not Scraped",games:{}}],
            "played" : [{name:"Played",games:{}},{name:"Not Played",games:{}}]
        };

        _.values(this.data.installed).forEach(function(game){
            if(game.__Installed) { this.installed[0].games[game.appid] = game;}
            else { this.installed[1].games[game.appid] = game; }

            if(game.__scraped){ this.scraped[0].games[game.appid] = game; }
            else { this.scraped[1].games[game.appid] = game; }
        },returnData);
        
        this.data.profile.forEach(function(game){
            if(this.installed[0].games[game.appid] === undefined
              && this.installed[1].games[game.appid] === undefined){
                this.installed[1].games[game.appid] = game;
            }
            if(game.last_played === undefined
               || game.hours_forever < 2.0){
                this.played[1].games[game.appid] = game;
            }else{
                this.played[0].games[game.appid] = game;
            }
        },returnData);

        return returnData;
    };

    Hub.prototype.drawText = function(text,domGroup,height){
        var hubRef = this;
        //preprocess text:
        
        var bound = domGroup.selectAll("text").data(text);
        bound.enter().append("text")
            .text(function(d){ return d; })
            .style("text-anchor","middle")
            .attr("transform",function(d,i){
                return "translate(" + (hubRef.internalWidth * 0.5) + ","
                    + (20 + (i * 20))  + ")"
            })
            .style("fill","white");

    };

    
    return Hub;
});
