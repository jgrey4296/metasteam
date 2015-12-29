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
            "Tags are grouped alphabetically",
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
                return d.hours_forever | _.values(d.games).length;
                //if(d. === undefined) return 1;
                //return _.values(d.games).length;
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

        //group alphabetically:
        this.alphaGroup = _.values(categories).reduce(function(m,v){
            if(m[v.name[0]] === undefined){
                m[v.name[0]] = { "name" : v.name[0], children: []};
            }
            m[v.name[0]].children.push(v);
            return m;
        },{});

        console.log("Alphagroup:",this.alphaGroup);
        
        this.packed = this.pack({"name" : "everything","children":_.values(this.alphaGroup)}).filter(function(d){
            if(d.name !== 'everything') return true;
            return false;
        });
        console.log("Packed:",this.packed);
        
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(data){

        var vRef = this;
        var dataToUse;
        if(data !== undefined && data instanceof Array){
            //alphabetise
            var alphaGroup = data.reduce(function(m,v){
                if(m[v.name[0]] === undefined){
                    m[v.name[0]] = { "name" : v.name[0], children:[]};
                }
                m[v.name[0]].children.push(v);
                return m;
            },{})

            dataToUse = this.pack({"name" : "everything","children":_.values(alphaGroup)}).filter(function(d){
                if(d.name !== "everything") return true;
                return false;
            });
        }else{
            dataToUse = this.packed;
        }
        console.log("Circle Pack: Drawing:",dataToUse);
        this.drawBarOfNames(d3.select("#leftBar"),dataToUse.slice(0,40));
        this.drawBarOfNames(d3.select("#rightBar"),dataToUse.slice(-40));

        var main = d3.select("#mainVisualisation");
        main.selectAll(".alphaGroup").remove();
        var bound = main.selectAll(".node,.alphaGroup").data(dataToUse,function(d,i){
            return d.name;
        });

        bound.exit().remove();

        //create the groups and register functions on them
        var enter = bound.enter().append("g")
            .attr("class",function(d){
                return d.children ? "alphaGroup" : "node";
            });

        main.selectAll(".node")
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

        main.selectAll(".node,.alphaGroup")
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
        d3.select("#mainVisualisation").selectAll(".alphaGroup").remove();
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
                    return d.name + " : " + d.hours_forever + " hours played";
                }
                
            });

        var greyCircle = function(selection){
            selection
                .selectAll("circle")
                .transition()
                .style("fill",function(e){
                    if(e.name === d.name) return vRef.oneOf20Colours(e.value);
                    return "grey";
                })
                .attr("r",function(e){
                    if(e.name === d.name) return e.r + 5;
                    return e.r - 5;
                });
        };

        d3.selectAll(".node,.alphaGroup").call(greyCircle);
        //d3.selectAll(".alphaGroup").call(greyCircle);
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

        if(!this.currentCategory){
            d3.select("#gameTitle")
                .select("#gameTitleMainText")
                .text("");
        }else{
            d3.select("#gameTitle")
                .select("#gameTitleMainText")
                .text(this.currentCategory);
        }

        var ungreyCircle = function(selection){
            selection
                .selectAll("circle")
                .transition()
                .style("fill",function(e){
                    return vRef.oneOf20Colours(e.value);
                })
                .attr("r",function(e){
                    return e.r;
                });
        };


        d3.selectAll(".node,.alphaGroup").call(ungreyCircle);
        //d3.selectAll(".alphaGroup").call(ungreyCircle);
    };

    //click
    Visualisation.prototype.clickFunction = function(d,i){
        //if a category of games:
        if(d.games !== undefined){
            this.currentCategory = d.name;
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
        d3.select("gameTitleMainText")
            .text(game.name);
        
        //description
        var desc = main.append("g").classed("description",true)
            .attr("transform","translate(" + this.hub.padding + "," + (this.hub.mainVisualisationOffset * 2) + ")");

        desc.append("rect")
            .attr("width",this.hub.internalWidth - (this.hub.padding * 2))
            .attr("height",100)
            .style("fill",this.hub.colours.lightBlue);

        desc.append("text").text(game.__description)
            .style("fill","white")
            .attr("y","1.4em")
            .attr("dy","1.4em")
            .call(wrapText,(this.hub.internalWidth - (this.hub.padding * 5)));
        
        //review status
        var reviewStatus = main.append("g").classed("review",true)
            .attr("transform","translate("+ (this.hub.internalWidth * 0.5) + "," + (this.hub.mainVisualisationOffset * 2 + 150) + ")");

        reviewStatus.append("rect")
            .attr("width",200)
            .attr("height",50)
            .attr("transform","translate(-100,0)")
            .style("fill",this.hub.colours.lightBlue);

        reviewStatus.append("text").text(game.__review)
            .style("fill","white")
            .attr("y","1.4em")
            .style("text-anchor","middle");
        
        //publisher

        //developer

        //last played

        //last updated

        //tags
        
    };

    
    //Utility trim text function:
    var trimText = function(d){
        if(d.name === undefined){
            console.error("No name:",d);
        }
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

    //from bl.ocks.org/mbostock/7555321
    var wrapText = function(textSelection,width){
        textSelection.each(function(){
            var text = d3.select(this),
                words = text.text().split(/\s+/),
                word,//current word
                line = [],//current line
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan")
                .attr("x",20)
                .attr("y",y)
                .attr("dy",dy);
            while(word = words.shift()){
                line.push(word);
                tspan.text(line.join(" "));
                if(tspan.node().getComputedTextLength() > width){
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x",20)
                        .attr("dy",dy +"em").text(word);
                }
            }
        });
    };    
    
    return Visualisation;
    
});
