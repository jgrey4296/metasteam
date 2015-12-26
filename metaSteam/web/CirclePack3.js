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
            "Tag Circle Pag Visualisation",
            "Displays a circle pack of all tags (from the steam store) of INSTALLED games",
            "Size of circle is dependent on number of games that utilize that tag",
            "On click: Circle pack games by playtime",
            "When you navigate to a game, you can start it through the metasteam server",
            "Draws largest tag names on the left, smallest on the right"            
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
                if(d.games === undefined) return Math.random();
                return _.values(d.games).length;
            })
            .sort(function(a,b){
                return a.name < b.name;
            });

    };

    /**
       @method registerdata
    */
    Visualisation.prototype.registerData = function(data){
        console.log("Template: Registering Data");
        this.data = data;

        var categories =  _.values(this.data.installed).reduce(function(m,game){
            if(game === null || game.__tags === undefined) return m;
            game.__tags.forEach(function(tag){
                if(m[tag] === undefined){
                    m[tag] = { name: tag, games: {} };
                }
                m[tag].games[game.appid] = game;
            });
            return m;
        },{});

        this.packed = this.pack({"children":_.values(categories)}).filter(function(d){
            if(d.children) return false;
            return true;
        });
        console.log("Packed:",this.packed);
        
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(data){
        console.log("Circle Pack: Drawing");
        var vRef = this;
        var dataToUse;
        if(data !== undefined && data instanceof Array){
            dataToUse = this.pack({"children":data}).filter(function(d){
                if(d.children) return false;
                return true;
            });
        }else{
            dataToUse = this.packed;
        }

        this.drawBarOfNames(d3.select("#leftBar"),dataToUse.slice(0,40));
        this.drawBarOfNames(d3.select("#rightBar"),dataToUse.slice(-40));

        var main = d3.select("#mainVisualisation");
        var bound = main.selectAll(".node").data(dataToUse,function(d,i){
            return d.name;
        });

        bound.exit().remove();

        //create the groups and register functions on them
        var enter = bound.enter().append("g").classed("node",true)
            .on("click",function(d,i){
                vRef.clickFunction(d,i);
            })
            .on("mouseover",function(d,i){
                vRef.highlightNames(d,i);
            })
            .on("mouseout",function(d,i){
                vRef.unhighlightNames(d,i);
            });

        enter.append("circle");

        main.selectAll(".node")
            .attr("transform",function(d,i){
                return "translate(" + d.x +"," + (20 + d.y) + ")";
            });

        main.selectAll("circle")
            .attr("r",function(d,i){
                return d.r;
            })
            .style("fill",function(d){
                return vRef.oneOf20Colours(d.value);
            });
    };



    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("Template: cleanUp");
        d3.select("#mainVisualisation").selectAll(".node").remove();
        d3.select("#leftBar").selectAll(".nameGroup").remove();
        d3.select("#rightBar").selectAll(".nameGroup").remove();
        d3.select("#mainVisualisation").selectAll(".game").remove();
    };

    //Methods to do:

    //draw bar of names
    Visualisation.prototype.drawBarOfNames = function(domRoot,data){
        var vRef = this;
        var bound = domRoot.selectAll(".nameGroup").data(data,function(d){ return d.name;});
        bound.exit().remove();
        var enter = bound.enter().append("g")
            .classed("nameGroup",true)
            .on("click",function(d,i){
                vRef.clickFunction(d,i);
            })
            .on("mouseover",function(d,i){
                vRef.highlightNames(d,i);
            })
            .on("mouseout",function(d,i){
                vRef.unhighlightNames(d,i);
            });

        enter.append("text")
            .style("fill",function(d){
                return vRef.oneOf20Colours(d.value);
            })
            .text(function(d){
                return d.name;
            })
            .each(trimText);


        //Updates:
        domRoot.selectAll(".nameGroup")
            .attr("transform",function(d,i){
                return "translate("+ 10 + "," + (20 + (i * 20)) +")";
            })

    };

    //highlight
    Visualisation.prototype.highlightNames = function(d,i){
        var vRef = this;
        d3.selectAll(".nameGroup")
            .selectAll("text")
            .transition()
            .style("fill",function(e,i){
                if(e.name === d.name) return "red";
                return "grey";
            })
            .text(function(e,i){
                if(e.name === d.name) return e.name;
                return e.shortName ? e.shortName : e.name;
            })
            .style("opacity",function(e,i){
                if(e.name === d.name) return 1;
                return 0.3;
            });

        d3.select("#gameTitle")
            .select("#gameTitleMainText")
            .text(function(){
                if(d.games){
                    return d.name + " : " + _.values(d.games).length + " games";
                }else if(d.appid){
                    return d.name;
                }
                
            });

        d3.selectAll(".node")
            .selectAll("circle")
            .transition()
            .style("fill",function(e){
                if(e.name === d.name) return vRef.oneOf20Colours(e.value);
                return "grey";
            })
            .attr("r",function(e){
                if(e.name === d.name) return e.r + 5;
                return 2;
            });
    };
    
    //unhighlight
    Visualisation.prototype.unhighlightNames = function(d,i){
        var vRef = this;
        d3.selectAll(".nameGroup")
            .selectAll("text")
            .transition()
            .style("fill",function(e,i){
                return vRef.oneOf20Colours(e.value);
            })
            .text(function(e,i){
                return e.shortName ? e.shortName : e.name;
            })
            .style("opacity",1);

        d3.select("#gameTitle")
            .select("#gametitleMainText")
            .text("");

        d3.selectAll(".node").selectAll("circle")
            .transition()
            .style("fill",function(e){
                return vRef.oneOf20Colours(e.value);
            })
            .attr("r",function(e){
                return e.r;
            });
        
    };

    //click
    Visualisation.prototype.clickFunction = function(d,i){
        //if a category of games:
        if(d.games !== undefined){
            this.draw(_.values(d.games));
        }else if(d.appid){
            this.drawGame(d);
        }

    };

    Visualisation.prototype.drawGame = function(game){
        this.cleanUp();
        var main = d3.select("#mainVisualisation").append("g").classed("game",true);

        //display:
        //name

        //description

        //review status

        //publisher

        //developer

        //last played

        //last updated

        //tags
        
    };

    
    //Utility trim text function:
    var trimText = function(d){
        //Detect bounding box and "..." names too long
        var bbox = this.getBBox();
        var maxLength = d.name.length-4;
        while(bbox.width > 10
              && maxLength > 10){//(window.innerWidth * 0.1) - 10){
            d.shortName = d.name.slice(0,maxLength) + "...";
            d3.select(this).text(d.shortName);
            bbox = this.getBBox();
            maxLength -= 2;
        }
    };
    
    
    return Visualisation;
    
});
