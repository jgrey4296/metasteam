/**
   The hub for metaSteam, giving the general template,
   and access to different visualisations
*/

define(['d3','underscore','ms_circlepack2'],function(d3,_,MSCP){

    /**The Main hub for MetaSteamWeb
       Provides buttons for the visualisations
       and general stats
       @class Hub
       @constructor
     */
    var Hub = function(){
        //internal reference for use in d3 callback functions
        var hubReference = this;

        //Colours:
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
        this.data = null;
        this.margin = 30;
        this.svgHeight = window.innerHeight - this.margin;
        this.svgWidth = window.innerWidth - this.margin;
        //Width of the non-sidebarred screen
        this.sideBarWidth = this.svgWidth * 0.15;
        this.internalWidth = this.svgWidth - (2 *(this.svgWidth * 0.15));
        console.log("Height:",this.svgHeight,"Width:",this.svgWidth);

        //Store for use in circlepack/other vis:
        d3.select("head").append("g")
            .attr("id","globalVars")
            .attr("sideBarWidth",this.sideBarWidth)
            .attr("internalWidth",this.internalWidth);
        
        //Reusable Scale for graph drawing
        this.scale = d3.scale.linear();
        this.scale.range([0, (this.svgHeight * 0.18)]);

        //Scale for colouring
        this.colourScale = d3.scale.category10();

        //Data For buttons:
        this.buttons = [
            {name:"Hub"},
            {name:"circlePack",
             value:new MSCP(this.svgWidth - (this.svgWidth * 0.15) - 100,this.svgHeight,this.colours),
            },
            {name:"timeline"},
            {name:"chord"},
            {name:"compare user"},
        ];

        this.setupSvg();
    };

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
            .text("")
            .style("fill",this.colours["textGrey"])
            .style("text-anchor","middle");
        
        
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
                  + this.sideBarWidth + ",0)")
            .attr("width",this.sideBarWidth);
    };

    //Load data in for visualisations to use
    Hub.prototype.registerData = function(data){
        console.log("Registering Data",data);
        this.data = data;
    };

    //Draw the Hub:
    Hub.prototype.draw = function(){
        //IN RIGHT BAR:
        //Draw Button to clear and draw circlepack:
        //Draw Button to clear and draw timeline mockup
        //Draw button for chord diagram
        this.drawButtons(this.buttons);
        
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
            var playedData = [
                {
                    name:"played",
                    games:{},
                },
                {
                    name:"not played",
                    games: {},
                }
            ];
            //Draw Games Installed
            var scannedData = [
                {
                    name: "Scanned",
                    games: {},
                },
                {
                    name: "Not Scanned",
                    games : {},
                }
            ];

            
            //Create the data:
            var installedData = [
                //Installed Games
                {
                    name: "Installed",
                    games: {},
                },
                //Not Installed Games
                {
                    name: "UnInstalled",
                    games: {},
                }
            ];
            //Get All installed Games
            for (var x in this.data.installed){
                var game = this.data.installed[x];
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
            };
            //Get All Not installed games:
            for(var x in this.data.profile){
                var game = this.data.profile[x];
                if(installedData[0].games[game.appid] === undefined){
                    installedData[1].games[game.appid] = game;
                }
                if(game.last_played === undefined
                   || game.hours_forever < 2.0){
                    playedData[1].games[game.appid] = game;
                }else{
                    playedData[0].games[game.appid] = game;
                }
            };
            //Draw the installed/not installed bar chart
            this.drawGraph("InstalledGames",d3.select("#installed"),installedData);
            this.drawGraph("ScrapedGames",d3.select("#scraped"),scannedData);
            this.drawGraph("PlayedGames",d3.select("#playedGames"),playedData);
        }
    };


    //Draw a graph, using the passed in group as the root, with data passed in
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
    
    //Draw the navigation buttons on the right
    Hub.prototype.drawButtons = function(data){
        var hubRef = this;
        var buttonWidth = (hubRef.internalWidth * 0.8) / data.length;
        //console.log("Drawing Buttons:",data,buttonWidth);
        //select the right bar and bind
        var groups = d3.select("#headerBar").selectAll(".button").data(data,function(d){return d.name;});

        groups.exit().remove();
        var newGroups = groups.enter().append("g").attr("id",function(d){
            return "button_"+ d.name;
        })
            .attr("class","button")
            .attr("transform",function(d,i){
                return "translate(" + ((hubRef.internalWidth * 0.1) + (i * (buttonWidth))) +"," + 10 + ")";
            })
            .on("click",function(d){
                console.log("Clicked on aweg:",d.name);
                if(d.name === "Hub"){
                    hubRef[1].cleanUp();
                    d3.select("#mainVisualisation").selectAll(".node").remove();
                    hubRef.draw();
                }
                if(d.name === "circlePack"){
                    d.value.cleanUp();
                    d.value.registerData(hubRef.data.installed);
                    d.value.draw();
                }
            })
            .on("mouseover",function(d){
                //on mouseover, turn the button green
                //console.log("mouseover button: ",d.name);
                d3.select(("#button_" + d.name)).select("rect").transition()
                    .style("fill",hubRef.colours["green"]);
            })
            .on("mouseout",function(d){
                //on mouseout, return the button to orig colour
                d3.select(("#button_" + d.name)).select("rect").transition()
                    .style("fill",hubRef.colours["lightBlue"]);
            });

        //draw the button 
        newGroups.append("rect")
            .attr("width",buttonWidth - 5)
            .attr("height",60)
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
