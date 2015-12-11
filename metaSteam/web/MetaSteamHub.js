/**
   The hub for metaSteam, giving the general template,
   and access to different visualisations
*/

define(['d3','underscore','msCirclePack','msTimeline'],function(d3,_,MetaSteamCirclePack,MetaSteamTimeline){

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

        //Storage For buttons:
        this.buttons = {};
        /**
           ADD ADDITIONAL MODES HERE:
         */
        this.registerButton("Hub",this);
        this.registerButton("Circle Pack",new MetaSteamCirclePack(this));
        this.registerButton("timeline",new MetaSteamTimeline(this));
        //            {name:"timeline"},
        //          {name:"chord"},
        //        {name:"compare user"},

        //An additional offset to the main visualisation for clarity purposes
        this.mainVisualisationOffset = 20;
        
        //Internal Width
        this.internalWidth = this.svgWidth - (2 * this.sideBarWidth);
        
        //Button header details:
        this.buttonHeight = 60;
        this.buttonWidth = (this.internalWidth * 0.8) / _.values(this.buttons).length;
        this.button_X_Offset = this.internalWidth * 0.1;
        this.button_Y_Offset = 10;

        //Internal Height:
        this.internalHeight = this.svgHeight - (this.mainVisualisationOffset + this.button_Y_Offset + this.buttonHeight);
        
        //Store for use in circlepack/other vis:
        d3.select("head").append("g")
            .attr("id","globalVars")
            .attr("sideBarWidth",this.sideBarWidth)
            .attr("internalWidth",this.internalWidth);
        
        //Reusable Scale for graph drawing
        this.scale = d3.scale.linear();
        this.scale.range([0, (this.internalHeight * 0.18)]);

        //Scale for colouring
        this.colourScale = d3.scale.category10();

        this.setupSvg();
    };


    /**
       @class Hub
       @method registerButton
       @purpose ensure a class has the required methods before adding it to the buttons object
       @note the buttons object is automatically turned into buttons in method:draw.
     */
    Hub.prototype.registerButton = function(name,instance){
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
        this.buttons[name] = {"name":name,"value":instance};
    };
    
    /**
       @class Hub
       @method cleanUp
       @purpose cleanup the things drawn by this class. 
       @note mainly the general stats, and any buttons
     */
    Hub.prototype.cleanUp = function(){
        d3.select("#generalStats").remove();
        _.keys(this.buttons).forEach(function(d){
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
        var body = d3.select('body').append('svg')
            .attr('id','mainsvg')
            .attr('height',this.svgHeight)
            .attr('width',this.svgWidth);


        body.append("rect")
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

        //Draw the Header bar:
        var header = d3.select("#mainsvg").append("g")
            .attr("id","headerBar")
            .attr("transform",
                  "translate(" +
                  (this.sideBarWidth + 20) + ",0)");

        var gameTitle = header.append("g")
            .attr("id","gameTitle")
            .attr("transform","translate("
                  + (this.internalWidth * 0.5) + ",100)");

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
        
        header.append("rect")
            .attr("width",this.internalWidth - 40)
            .attr("height",80)
            .attr("rx",5)
            .attr("ry",5);

        d3.select("#mainsvg")
	        .append("g")
	        .attr("id","mainVisualisation")
            .attr("transform",
                  "translate("
                  + this.sideBarWidth + "," + (this.button_Y_Offset + this.buttonHeight + this.mainVisualisationOffset) + ")")
            .attr("width",this.sideBarWidth);
    };

    /**
       @class Hub
       @method registerData
       @purpose take a loaded json file of data and store it for use
     */
    Hub.prototype.registerData = function(data){
        console.log("Registering Data",data);
        this.data = data;
    };

    /**
       @class Hub
       @method draw
       @purpose draw this class.
       @note ie: buttons, sidebars, graphs.
     */
    Hub.prototype.draw = function(){

        //Draw Button to clear and draw circlepack:
        //Draw Button to clear and draw timeline mockup
        //Draw button for chord diagram
        this.drawButtons(_.values(this.buttons));
        
        //If there is data to draw, create
        //the general statistics view
        if(this.data){
            //Create 3 groups, spaced appropriately
            //Create if doesnt exist, otherwise just retrieve
            if(d3.select("svg").select("#generalStats").empty()){
                //domRoot->svg->genStats->[each child stat]
                var genStats = d3.select("svg").append("g").attr("id","generalStats")
                    .attr("transform","translate("+
                          (this.sideBarWidth + 20) + ",0)");

                genStats.append("g").attr("id","playedGames")
                    .attr("transform","translate(0,"
                          + (this.svgHeight * 0.1) + ")");
                genStats.append("g").attr("id","scraped")
                    .attr("transform","translate(0," + (this.svgHeight * 0.4) + ")");
                genStats.append("g").attr("id","installed")
                    .attr("transform","translate(0," + (this.svgHeight * 0.7) + ")");

                //Aim for this width for the stat bars
                var aimWidth = this.internalWidth - 40;
                //Create a rectance to backdrop each stat
                d3.select("#playedGames").append("rect").attr("width",aimWidth).attr("height",this.svgHeight * 0.25)
                    .attr("rx",5)
                    .attr("ry",5);

                d3.select("#scraped").append("rect").attr("width",aimWidth).attr("height",this.svgHeight * 0.25)
                    .attr("rx",5)
                    .attr("ry",5);

                d3.select("#installed").append("rect").attr("width",aimWidth).attr("height",this.svgHeight * 0.25)
                    .attr("rx",5)
                    .attr("ry",5);
            }else{
                var genStats = d3.select("#generalStats");
            }

            //Draw graphs for each of the three sections
            var playedData = [{
                    name:"played",
                    games:{},
                },{
                    name:"not played",
                    games: {},
                }];
            //Draw Games Installed
            var scannedData = [{
                    name: "Scanned",
                    games: {},
                },{
                    name: "Not Scanned",
                    games : {},
                }];

            //Create the data:
            var installedData = [{
                name: "Installed",
                games: {},
            },{
                name: "UnInstalled",
                games: {},
            }];
            
            //Get All installed Games
            _.values(this.data.installed).forEach(function(game){
                if(game.__Installed){
                    installedData[0].games[game.appid] = game;
                }else{
                    installedData[1].games[game.appid] = game;
                }
                if(game.__scraped){
                    scannedData[0].games[game.appid] = game;
                }else{
                    scannedData[1].games[game.appid] = game;
                }
            });
            //Get All Not installed games:
            this.data.profile.forEach(function(game){
                if(installedData[0].games[game.appid] === undefined){
                    installedData[1].games[game.appid] = game;
                }
                if(game.last_played === undefined
                   || game.hours_forever < 2.0){
                    playedData[1].games[game.appid] = game;
                }else{
                    playedData[0].games[game.appid] = game;
                }
            });
            
            //Draw the installed/not installed bar chart
            this.drawGraph("InstalledGames",d3.select("#installed"),installedData);
            this.drawGraph("ScrapedGames",d3.select("#scraped"),scannedData);
            this.drawGraph("PlayedGames",d3.select("#playedGames"),playedData);
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
            })
            .on("mouseout",function(d){
                //on mouseout, return the button to orig colour
                d3.select(("#button_" + d.id)).select("rect").transition()
                    .style("fill",hubRef.colours["lightBlue"]);
            });

        //draw the button 
        newGroups.append("rect")
            .attr("width",buttonWidth - 5)
            .attr("height",hubRef.buttonHeight)
            .style("fill",this.colours["lightBlue"]);
        
        newGroups.append("text")
            .text(function(d){
                return d.name;
            })
            .attr("transform","translate(" + (buttonWidth * 0.5) + ",45)")
            .style("text-anchor","middle")
            .style("fill",this.colours["textBlue"]);
        
    };
    return Hub;
});
