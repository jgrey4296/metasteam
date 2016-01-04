/**
   @class TemplateVisualisation
   @purpose Demonstrates the basic structure of a visualisation
   @requiredMethod registerData
   @requiredMethod draw
   @requiredMethod cleanUp
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

        this.helpText =[
            "Publisher/Developer visualisation"

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

        this.pack = d3.layout.pack()
            .size([this.width - 20, this.height - 40])
            .padding(1.5)
            .value(function(d){
                if(d.children) return d.children.length;
                return 1;
            });

        this.treepack = d3.layout.treemap()
            .size([this.width - 10, this.height - 40])
            .padding(1.5)
            .value(function(d){
                if(d.children) return d.children.length;
                return 1;
            });
        
    };

    /**
       @method registerdata
    */
    Visualisation.prototype.registerData = function(data){
        console.log("Pub/Dev: Registering Data");
        this.data = data;
        
        //if there isnt a '__developer' or '__publisher' value, add it in:
        _.values(this.data.installed).forEach(function(game,i){
            if(game.__publisher === undefined){
                game.__publisher = String(i%30);
            }
            if(game.__developer === undefined){
                game.__developer = String(i%30);
            }
        });

        //group by publisher and developer
        this.groupedData = _.values(this.data.installed).reduce(function(m,game){
            if(m.publishers[game.__publisher] === undefined){
                m.publishers[game.__publisher] = [];
            }
            m.publishers[game.__publisher].push(game);
            
            if(m.developers[game.__developer] === undefined){
                m.developers[game.__developer] = [];
            }
            m.developers[game.__developer].push(game);
            return m;
        },{"publishers" : {}, "developers" : {}});

        console.log("Extracted pub/devs:",this.groupedData);

        var id = 0;
        //create the 'tree' of data
        this.useData = {
            "id"   : id++,
            "name" : "everything",
            "children" : [
                {
                    "id"   : id++,
                    "name" : "publishers",
                    "children" : _.pairs(this.groupedData.publishers).map(function(pubPair){
                        return {
                            "id" : id++,
                            "name" : pubPair[0],
                            "children" : pubPair[1]
                        };
                    })
                },
                {
                    "id"   : id++,
                    "name" : "developers",
                    "children" : _.pairs(this.groupedData.developers).map(function(devPair){
                        return {
                            "id"   : id++,
                            "name" : devPair[0],
                            "children" : devPair[1]
                        }
                    })
                }
            ]
        };

        console.log("Use Data:",this.useData);

        console.log("Packed Data:",this.packedData);
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(data){
        var vRef = this;
        var currentData;
        if(data){
            console.log("Pub/Dev: Drawing:",data);
            currentData = this.treepack(data);
        }else{
            console.log("Pub/Dev: Drawing:",this.useData);
            currentData = this.treepack(this.useData).filter(function(d){
                if(d.name === "everything") return false;
                if(d.children === undefined) return false;
                return true;
            });
        }

        console.log("Drawing:",currentData);
        //draw bubble pack of pubs/devs
        var bound = d3.select("#mainVisualisation").selectAll(".node")
            .data(currentData,function(d){ return d.id || d.appid; });
        bound.exit().remove();
        
        var enter = bound.enter().append("g")
            .attr("class","node");

        enter.on("click",function(d){
            console.log("Clicked:",d);
            //todo: transition the view to display the pub/dev clicked on
            if(d.children){
                vRef.draw(d);
            }else{
                vRef.hub.drawGame(d);
            }            
        })
            .on("mouseover",function(d){
                d3.select("#gameTitle")
                    .select("#gameTitleMainText")
                    .text(d.name);
                console.log(d);
            })
            .on("mouseout",function(d){
                d3.select("#gameTitle")
                    .select("#gameTitleMainText")
                    .text("");
            });
        enter.append("rect");

        //update
                //.attr("r",function(d){ return d.r; })
        d3.select("#mainVisualisation").selectAll("rect")
            .attr("width",function(d){ return d.dx;})
            .attr("height",function(d){ return d.dy; })
            .style("fill",function(d,i){
                    return vRef.oneOf20Colours(i);
            });
        
        d3.selectAll(".node")
            .attr("transform",function(d){
                return "translate("+d.x + "," + (30 + d.y) + ")";
            });
        
    };



    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("Pub/Dev: cleanUp");
        d3.select("#mainVisualisation").selectAll(".node").remove();
        d3.select("#mainVisualisation").selectAll(".leaf").remove();
    };

    return Visualisation;
});
