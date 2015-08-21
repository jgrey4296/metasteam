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

        //Stored Data
        this.data = null;
        this.margin = 30;
        this.svgHeight = window.innerHeight - this.margin;
        this.svgWidth = window.innerWidth - this.margin;
        console.log("Height:",this.svgHeight,"Width:",this.svgWidth);

        //Reusable Scale for graph drawing
        this.scale = d3.scale.linear();
        this.scale.range([0, (this.svgHeight * 0.25)]);

        //Scale for colouring
        this.colourScale = d3.scale.category10();

        //Data For buttons:
        this.buttons = [
            {name:"reset"},
            {name:"circlePack",
             value:new MSCP(this.svgWidth-200,this.svgHeight),
            },
            {name:"timeline"},
            {name:"chord"},
        ];

        this.setupSvg();
    };

    //Setup the sides of the svg, which are the same
    //for all parts of MetaSteamWeb
    Hub.prototype.setupSvg = function(){
        //Reference for use in d3 callbacks
        var hubReference = this;
        //Setup the svg
        d3.select('body').append('svg')
            .attr('id','mainsvg')
            .attr('height',this.svgHeight)
            .attr('width',this.svgWidth);
        //SideBar:
        var leftBar = d3.select('#mainsvg').append("g")
            .attr("id","leftBar");
        leftBar.append('rect')
            .attr('width',(window.innerWidth * 0.15) )
            .attr('height',this.svgHeight);

        console.log("Translating:",this.svgWidth - 100);
        var rightBar = d3.select("#mainsvg").append("g")
            .attr("id","rightBar")
            .attr('transform',function(){
                return 'translate(' + (hubReference.svgWidth - 100) + ',0)';
            });
        rightBar.append('rect')
            .attr('width',100)
            .attr('height',this.svgHeight);
        
        d3.select("#mainsvg")
	        .append("g")
	        .attr("id","circlePack");
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
                    .attr("transform","translate("+ d3.select("#leftBar").select("rect").attr("width") + ",0)");

                genStats.append("g").attr("id","playedGames")
                    .attr("transform","translate(0,"
                          + (this.svgHeight * 0.1) + ")");
                genStats.append("g").attr("id","scraped")
                    .attr("transform","translate(0," + (this.svgHeight * 0.4) + ")");
                genStats.append("g").attr("id","installed")
                    .attr("transform","translate(0," + (this.svgHeight * 0.7) + ")");

                //Aim for this width for the stat bars
                var aimWidth = this.svgWidth - 102 - (this.svgWidth * 0.15);
                //Create a rectance to backdrop each stat
                d3.select("#playedGames").append("rect").attr("width",aimWidth).attr("height",this.svgHeight * 0.25);
                d3.select("#scraped").append("rect").attr("width",aimWidth).attr("height",this.svgHeight * 0.25);
                d3.select("#installed").append("rect").attr("width",aimWidth).attr("height",this.svgHeight * 0.25);
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
        console.log(this.scale.domain(),this.scale.range());

        //Bind the data
        var root = domElement.selectAll("g").data(data,function(d){
            return d.name;
        });

        //remove unneeded data
        root.exit().remove();
        //draw the data
        var graphGroup = root.enter().append("g")
            .attr("id",function(d){
                return d.name;
            })
            .attr("transform",function(d,i){
                console.log(d,i);
                return "translate(" + ((hubRef.svgWidth * 0.15) + (i * hubRef.svgWidth * 0.25)) + "," + (0) +")";
            });

        //rectangle, size of the value of the datum, scaled
        graphGroup.append("rect")
            .attr("width",hubRef.svgWidth * 0.25)
            .attr("transform",function(d){
                return "translate(0," +
                    (hubRef.scale.range()[1] - hubRef.scale(_.keys(d.games).length)) + ")";
            })
            .attr("height",function(d){
                var val = hubRef.scale((_.keys(d.games)).length);
                console.log("Height for ", d.name,val);
                return val;
            })
            .style("fill",function(d,i){
                return hubRef.colourScale(i);
            });        

        //Draw a label:
        graphGroup.append("text")
            .text(function(d){
                return d.name + ": " + (_.keys(d.games)).length
                    + "/" + hubRef.scale.domain()[1];
            })
            .attr("transform",
                  "translate(0," +
                  (hubRef.scale.range()[1] + 25) + ")");
        
    };
    
    //Draw the navigation buttons on the right
    Hub.prototype.drawButtons = function(data){
        var hubRef = this;
        console.log("Drawing Buttons:",data);
        //select the right bar and bind
        var groups = d3.select("#rightBar").selectAll("g").data(data,function(d){return d.name;});

        groups.enter().append("g").attr("id",function(d){
            return "button_"+ d.name;
        })
            .attr("transform",function(d,i){
                return "translate(" + 14 +"," + (25 + (i * 80)) + ")";
            })
            .on("click",function(d){
                console.log("Clicked on:",d.name);
                if(d.name === "reset"){
                    hubRef.draw();
                }
            });

        groups.append("rect")
            .attr("width",75)
            .attr("height",50)
            .style("fill","red");
        
        groups.append("text")
            .text(function(d){
                return d.name;
            })
            .attr("transform","translate(0,45)")
            .style("text-anchor","right");
        
        //add on click
        //each on click cleans up the window,
        //and then calls draw on the datum

    };
    
    
    return Hub;

});
