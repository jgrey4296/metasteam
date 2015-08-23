/**
   Second attempt at circle pack visualisation for metasteam
*/

define(['d3','underscore'],function(d3,_){

    var idRegex = /\W/g;
    
    /**The MetaSteam Circlepack class. Takes a list of games,
       and visualises them
       @class CirclePack
    */
    var CP = function(sizeX,sizeY,colours){
	    console.log("Sizes:",sizeX,sizeY,colours);//the tooltip for the visualisation:

        this.colours = colours;

        //Colours scale:
        this.scaleToColours = d3.scale.linear()
            .domain([0,100])
            .rangeRound([0,20]);
        this.colourScale = d3.scale.category20b();

        this.oneOf20Colours = function(val){
            return this.colourScale(this.scaleToColours(val));
        };
        
        //The data the circle pack will be using:
        this.baseData = null;
        this.categories = {};

        this.currentDataSet = [];
        this.packSize = [sizeX,sizeY];
        
        //Packer:
        this.bubble = d3.layout.pack()
            .sort(function(f,s){
                return f.name < s.name;
            })
            .size([sizeX,sizeY])
            .padding(1.5);

    };

    CP.prototype.registerData = function(data){
        console.log("registering data:",data);
        this.categories = {};
               
        //Add a catchall to the categories
        this.categories['everything'] = {
            name: 'everything',
            games: [],
            value: 0.1
        };
 
        this.baseData = data;
        //for every game
        for(var i in this.baseData){
            var game = this.baseData[i];
	        if(game === null) {
		        console.log("Game Null:",game,i);
		        continue;
	        }
            if(game['hours_forever']) {
                game['value'] = game['hours_forever'];
            }else{
                game['value'] = 1;
            }
            this.categories['everything']['games'].push(game);
            var tags = game['__tags'];
            //for every tag for every game
            for(var i in tags){
                var tag = tags[i];
                if(this.categories[tag] === undefined){
                    this.categories[tag] = {
                        name: tag,
                        games: [],
                        value : 0.1
                    };
                }
                //Guard to make sure duplicates arent used
                if(this.categories[tag]['games'].indexOf(game) === -1){
                    this.categories[tag]['games'].push(game);
                    this.categories[tag]['value'] += 1;
                }
            }
        }

        this.categories['everything'].value = this.categories['everything']['games'].length;

        this.currentDataSet = _.values(this.categories);

        console.log("Co-op auto: ",this.categories['Co-op']);
    };



    //--------------------
    /**The Main Draw method for circlepacking
       @method draw
    */
    CP.prototype.draw = function(data){
        //console.log("Drawing:",data);
        var cpInstance = this;
        //todo: abstract this out:
        //Add a reset button
        var resetButton = d3.select("#resetButton");
        if(resetButton.empty()){
            resetButton = d3.select("#leftBar").append("g")
                .attr("id","resetButton")
                .attr("transform","translate(" + (d3.select("#leftBar").select("rect").attr("width") * 0.1) + ",0)")
                .on("click",function(){
                    //On click, redraw from categories
                    //todo: call cleanup utilities instead
                    console.log("Resetting");
                    d3.selectAll(".node").remove();
                    d3.selectAll("#gameNames").remove();
                    //Reset the translation and scaling for the new draw:
                    // d3.select("#mainVisualisation")
                    //     .attr("transform","translate("
                    //           + (window.innerWidth * 0.25)+ ",0)scale(1,1)");
                    cpInstance.draw();//_.values(cpInstance.categories));
                });

            resetButton.append("rect")
                .style("fill",this.colours['green'])
                .attr("width",100)
                .attr("height",50);

            resetButton.append("text")
                .style("text-anchor","middle")
                .text("reset")
                .attr("transform","translate(50,25)");

        }

        //Draw a button to switch between installed and all profile games
        
        //Finished with reset button, draw the vis
        var main = d3.select("#mainVisualisation");
        //Setup the zoom:
        // d3.select("#mainsvg").on("zoom",null);
        // d3.select("#mainsvg")
        //     .call(d3.behavior.zoom()
        //           .scaleExtent([1,2])
        //           .on("zoom",function(){
        //               main.attr("transform","translate(" + d3.event.translate +")scale(" + d3.event.scale + ")");            
        //           })
        //          );;
        
        //Use passed in data, or default
        //to the categories stored in the ctor
	    if(data !== undefined){
            console.log("Using passed in data");
            this.currentDataSet = data;
        }else{
            console.log("Using Categories");
            this.currentDataSet = _.values(this.categories);
        }
        
        var dataToUse = this.currentDataSet;
        // var dataString = "";
        // for(var x in dataToUse){
        //     dataString += " " + dataToUse[x]['name'];
        // }

        //console.log("Data: ",dataString,dataToUse);
        
        var packed_nodes = this.bubble.nodes({children:dataToUse});
        
        packed_nodes = packed_nodes.filter(function(d,i){
            if(d['children']) return false;
            return true;
        });

        //Get the max of the values:
        var maxVal = d3.max(packed_nodes,function(d){
            return d.value;
        });

        this.scaleToColours.domain([0,maxVal]);
        
        //Bind the data to nodes
        var node = main.selectAll(".node")
            .data(packed_nodes,
                  function(d){
                      if(d['appid']) return d['appid'];
                      if(d['name']) return d['name'];
                      console.log("A Node has neither appid or a name",d);
                      return "unknown";
                  });
        
        //Enable access to the circlepack from inside d3 callbacks:
        var cpInstance = this;
        
        //Create a container for each element, binding mouse functions for them
        var containers = node.enter().append("g").classed("node",true)
            .attr("id",function(d){
                return "Node" + d.name.replace(idRegex,'');
            })
            .attr("transform",function(d){
                return "translate(" + (d.x)  +","+ d.y + ")";
            })
            .on("mouseover",function(d){
                //Mouseover enlarges the node,
                //and shows the nodes text
                //console.log("mscp mx: ", d3.event.pageX, d3.event.pageY);
                var original = d3.select(this);
                var temp = d3.select("#temp");
                //Highlight the equivalent name:
                d3.select("#name_"
                          + d.name.replace(idRegex,""))
                    .select("text")
                    .transition()
                    .style("fill","red");

                //Draw the title:
                d3.select("#gameTitle")
                    .select("text")
                    .text(function(){
                        var scaleVal = "";
                        if(d.games) scaleVal = " Games";
                        if(d.hours_forever) scaleVal = " Hours Played"
                        return d.name + " : " + Math.round(d.value) + scaleVal;
                    });

                //Colour the circle:
                d3.select(this)
                    .select("circle")
                    .transition()
                    .style("fill","red");
                           //cpInstance.colours["green"]);

                //TODO: reduce all other circles opacity
                
            })
            .on("mouseout",function(d){
                //recolour the text
                d3.select("#name_"+d.name.replace(idRegex,""))
                    .select("text")
                    .transition()
                    .style("fill",cpInstance.colours["textGrey"]);
                //Remove the text:
                d3.select("#gameTitle")
                    .select("text")
                    .text("");

                //Return the colour:
                d3.select(this)
                    .select("circle")
                    .transition()
                    .style("fill",
                           cpInstance.oneOf20Colours(d.value));
                           //cpInstance.colours["lightBlue"]);

                //TODO: return opacity
            })
            .on("click",function(d){
                console.log(d.name);
                //If there are games stored in the node (ie: its a category)
                if(d.games && d.games.length > 0){
                    //draw the pack of games for that category
                    //todo: call cleanup utilities
                    console.log("Redrawing",d.games);
                    d3.selectAll("#gameNames").remove();
                    d3.selectAll(".node").remove();
                    cpInstance.draw(d.games);
                }else{
                    console.log("Draw Details:",d.name);
                    //todo: call cleanup utilities
                    d3.selectAll("#gameNames").remove();
                    d3.selectAll(".node").remove();
                    cpInstance.drawGame(d);
                    //If there arent games, it is a game,
                    //So send a start message  to the server?
                    // var commandString = "";
                    // commandString += "&command=startGame";
                    // commandString += "&appid=";
                    // commandString += d.appid;
                    // var request = new XMLHttpRequest();
                    // request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    // request.setRequestHeader('Content-Length', urlEncodedData.length);
                    // request.open("POST","",true);
                    // request.send(commandString);
                    // //or go back to drawing all categories
                    // console.log("other");
                    // cpInstance.draw(_.values(cpInstance.categories));
                }
            });

        //Create each node's representation,
        //start it at 0 radius, enlarge it later
        containers.append("circle")
            .attr("r",0)  //function(d){ return d.r; });
            .style("fill",function(d){
                return cpInstance.oneOf20Colours(d.value);
            });
                   //this.colours["lightBlue"]);
        

        //here transitions all nodes up to their proper size
        node.selectAll("circle").transition()
            .attr('r',function(d){ return d.r;});

        //Draw the tooltip that was passed in as
        //part of the ctor
        //this.tooltip.draw();
        this.drawNames(this.currentDataSet);
    };

    //----------------------------------------
    /**Helper function for draw, to draw all names of categories/ games in margins
       @function drawNames
       @param data : the array of game objects, same as for drawGames
    */
    CP.prototype.drawNames = function(data){
        if(data[0].appid){
            //data is a list of games, sort by amount of time played
            data.sort(function(f,s){
                var f_h_f = f.hours_forever | 1;
                var s_h_f = s.hours_forever | 1;
                return f_h_f - s_h_f;
            });
            data.reverse();
        }else if(data[0].games){
            data.sort(function(f,s){
                var f_gl = f.games.length | 1;
                var s_gl = s.games.length | 1;
                return f_gl - s_gl;
            });
            data.reverse();
        }
        
        console.log("Going to Draw Data:",data);
        var selectionAmount = 38;
        var first = data.slice(0,selectionAmount);
        var second = data.slice(-38);
        this.drawNamesHalf(first,d3.select("#leftBar"));
        this.drawNamesHalf(second,d3.select("#rightBar"));
    };

    //Draw data as names under the dom element specified
    CP.prototype.drawNamesHalf = function(data,rootDom){
        var cpInstance = this;
        //console.log("Drawing Names:",data);
        // data.sort(function(l,r){
        //     return l.name > r.name;
        // });
        
        //select the names group
        var namesGroup = rootDom.select("#gameNames");
        if(namesGroup.empty()){
            namesGroup = rootDom.append("g").attr('id','gameNames')
                .attr("transform",function(){
                    return "translate(10," +
                        (Number(d3.select("#resetButton").select("rect").attr("height")) + 20)  + ")";
                });
        }
        
        var boundGroups = namesGroup.selectAll('g').data(data,function(d){
            if(d['appid']) return d['appid'];
            return d['name'];
        });

        boundGroups.exit().remove();

        var individualNames = boundGroups.enter().append("g")
            .attr("id",function(d){
                return "name_" + d.name.replace(idRegex,"");
            })
            .attr("transform",function(d,i){
                return "translate(0," + (i * 20) + ")";
            })
            .on("mouseover",function(d){
                //Draw a line to the corresponding circle
                var theText = d3.select(this).select('text');
                theText.transition()
                    .style("fill","red")
                           //cpInstance.oneOf20Colours(d.value))
                           //cpInstance.colours["textBlue"])
                    .text(function(d){
                        d.shortName = theText.text();
                        return d.name;
                    });

                var idString = "#Node" + d.name.replace(idRegex,'');

                if(d3.select(idString).empty()) return;
                
                d3.select(idString)
                    .select("circle")
                    .transition()
                    .style("fill","red");
                           //cpInstance.colours["green"]);

                //reduce all other circles opacity
                
            })
            .on("mouseout",function(d){
                //fade the line out
                var theText = d3.select(this).select('text');
                theText.transition()
                    .style("fill",
                           cpInstance.oneOf20Colours(d.value))
                           //cpInstance.colours["textGrey"])
                    .text(function(d){
                        return d.shortName;
                    });

                var idString = "#Node" + d.name.replace(idRegex,'');

                if(d3.select(idString).empty()) return;
                
                d3.select(idString)
                    .select("circle")
                    .transition()
                    .style("fill",
                           cpInstance.oneOf20Colours(d.value));
                           //cpInstance.colours["lightBlue"]);

                //reset opacity
                
            });
        //todo add click?

        
        individualNames.append("text")
            .style("text-anchor","left")
            .style("fill",function(d){
                return cpInstance.oneOf20Colours(d.value)
            })
                   //this.colours["textGrey"])
            .text(function(d){
                return d.name;
            })
            .each(function(d){
                var bbox = this.getBBox();
                var maxLength = d.name.length-4;
                while(bbox.width > 10
                      && maxLength > 10){//(window.innerWidth * 0.1) - 10){
                    d3.select(this).text(d.name.slice(0,maxLength) + "...");
                    bbox = this.getBBox();
                    maxLength -= 2;
                }
            });
        
    };

    //--------------------
    //Draw a Single Game:
    CP.prototype.drawGame = function(game){
        d3.select("#mainVisualisation")
            .append("rect")
            .attr("width",100)
            .attr("height",100)
            .style("fill","red")
            .attr("transform",
                  "translate(" + (this.packSize[0] * 0.5)
                  + "," + (this.packSize[1] * 0.5) +")");


    };

    //--------------------
    //CleanUp Utility Functions:

    CP.prototype.cleanUpNames = function(){

    };

    CP.prototype.cleanUpNodes = function(){

    };

    CP.prototype.cleanUpGame = function(){


    };

    CP.prototype.cleanUpResetButton = function(){


    };

    
    return CP;
});
