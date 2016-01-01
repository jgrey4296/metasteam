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
            }else if(game.__publisher.length === 0){
                game.__publisher = "default";
            }
            if(game.__developer === undefined){
                game.__developer = String(i%30);
            }else if(game.__developer.length === 0){
                game.__developer = "default";
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

        this.useData = {
            "name" : "everything",
            "children" : [
                {
                    "name" : "publishers",
                    "children" : _.pairs(this.groupedData.publishers).map(function(pubPair){
                            return {
                                "name" : pubPair[0],
                                "children" : pubPair[1]
                            };
                    })
                },
                {
                    "name" : "developers",
                    "children" : _.pairs(this.groupedData.developers).map(function(devPair){
                        return {
                            "name" : devPair[0],
                            "children" : devPair[1]
                        }
                    })
                }
            ]
        };

        console.log("Use Data:",this.useData);

        this.packedData = this.pack(this.useData).filter(function(d){
            if(d.name !== "everything") return true;
            return false;
        });

        console.log("Packed Data:",this.packedData);
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(){
        var vRef = this;
        console.log("Pub/Dev: Drawing");

        //draw bubble pack of pubs/devs
        var bound = d3.select("#mainVisualisation").selectAll(".node")
            .data(this.packedData);
        bound.exit().remove();
        var enter = bound.enter().append("g")
            .attr("class",function(d){ return d.children ? "node" : "leaf";});

        enter
            .on("click",function(d){
                console.log("Clicked:",d);
            })
            .on("mouseover",function(d){
                d3.select("#gameTitle")
                    .select("#gameTitleMainText")
                    .text(d.name);
            })
            .on("mouseout",function(d){
                d3.select("#gameTitle")
                    .select("#gameTitleMainText")
                    .text("");
            });

        
        enter.append("circle").attr("r",function(d){ return d.r; })
            .style("fill",function(d,i){
                return vRef.oneOf20Colours(i);
            });
        
        var nodes = d3.selectAll(".node")
            .attr("transform",function(d){
                return "translate("+d.x + "," + d.y + ")";
            });

        var leaves = d3.selectAll(".leaf")
            .attr("transform",function(d){
                return "translate("+d.x + "," + d.y +")";
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
