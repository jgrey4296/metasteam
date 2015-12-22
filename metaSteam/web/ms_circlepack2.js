/**
   Second attempt at circle pack visualisation for metasteam
*/

define(['d3','underscore'],function(d3,_){

    var idRegex = /\W/g;
    
    /**The MetaSteam Circlepack class. Takes a list of games,
       and visualises them
       @class CirclePack
    */
    var CP = function(hub){
        //local reference to the hub:
        this.hub = hub;
        //save the passed in colour dictionary
        this.colours = this.hub.colours;;

        //help text array:
        this.helpText = [
            "Circle pack of tags visualisation"
        ];

        
        //Colours scales:
        //from the domain to the range of 20,
        //for converting to colour
        //todo: see if this is unnecessary
        this.scaleToColours = d3.scale.linear()
            .domain([0,100])
            .rangeRound([0,20]);
        this.colourScale = d3.scale.category20b();

        //Function to get a colour from a value
        this.oneOf20Colours = function(val){
            return this.colourScale(this.scaleToColours(val));
        };
        
        //The data the circle pack will be using:
        this.baseData = null;
        //The categories the data is reorganised into
        this.categories = {};

        //All of the current games/categories
        this.currentDataSet = [];

        //THESE ARE SET IN REGISTER DATA:
        //The dimensions the pack must fit into
        this.packSize = [0,0];
                //The specific packer
        this.bubble = d3.layout.pack()
            .sort(function(f,s){ //sort by names
                return f.name < s.name;
            })
            .padding(1.5);

    };

    /**
       @class Circlepack
       @method registerData
       @purpose register and modify passed in data to use for this visualisation
     */
    CP.prototype.registerData = function(data){
        console.log("CP registering data:",data.installed);
        //Reset the internally stored data
        this.baseData = _.values(data.installed);

        //Setup the sizes of the bubble pack:
        this.packSize = [this.hub.internalWidth,this.hub.internalHeight];
        this.bubble.size(this.packSize);
        
        //Clear the categories
        this.categories = {};
        
        //Add a catchall to the categories
        this.categories['everything'] = {
            name: 'everything',
            games: [],
            value: 0.1
        };
        
        //for every game
        this.baseData.forEach(function(game){
	        if(game === null || game['__tags'] === undefined) {
		        //console.log("Game Null:",game.name);
                return;
	        }
            //copy the hours_forever as the value
            if(game['hours_forever']) {
                game['value'] = game['hours_forever'];
            }else{
                game['value'] = 1;
            }
            //Add the game to 'everything'
            this.categories['everything']['games'].push(game);

            //for every tag for every game
            game['__tags'].forEach(function(tag){
                //setup a category to store all related games
                //together
                if(this.categories[tag] === undefined){
                    this.categories[tag] = {
                        name: tag,
                        games: [],
                        value : 0.1
                    };
                }
                //Guard to make sure duplicates arent added
                if(this.categories[tag]['games'].indexOf(game) === -1){
                    //add the game into the category
                    this.categories[tag]['games'].push(game);
                    //increase its count
                    //todo: this could be better
                    this.categories[tag]['value'] += 1;
                }
            },this);
        },this);

        //update the everything category to have
        //the right value
        this.categories['everything'].value = this.categories['everything']['games'].length;

        //set the current dataset to be all categories
        //as an array of the objects, so: [c1,c2..cN]
        this.currentDataSet = _.values(this.categories);
    };

    //--------------------------------------------------
    
    /**
       @class Circlepack
       @method draw
       @purpose draw this visualisation
    */
    CP.prototype.draw = function(data){
        //console.log("Drawing:",data);
        var cpInstance = this;
        //Add a reset button
        this.drawResetButton();
        this.drawDataSwitch();
        
        //the main visualisation to be draw:
        var main = d3.select("#mainVisualisation");
        
        //Use passed in data, or default
        //to the categories stored in the ctor
	    if(data !== undefined){
            console.log("Using passed in data");
            this.currentDataSet = data;
        }else{
            console.log("Using Categories");
            this.currentDataSet = _.values(this.categories);
        }

        //possibly sort this here?
        var dataToUse = this.currentDataSet;

        //Draw all the names from the dataset
        this.drawNames(dataToUse);

        //pack the data appropriately
        var packed_nodes = this.bubble.nodes({children:dataToUse});

        packed_nodes = packed_nodes.filter(function(d,i){
            if(d['children']) return false;
            return true;
        });

        //Get the max of the values of the nodes:
        var maxVal = d3.max(packed_nodes,function(d){
            return d.value;
        });
        
        //scale the colours appropriately
        this.scaleToColours.domain([0,maxVal]);
        
        //Bind the data to nodes,with an adaptive key function
        var node = main.selectAll(".node")
            .data(packed_nodes,
                  function(d){
                      if(d['appid']) return d['appid'];
                      if(d['name']) return d['name'];
                      console.log("A Node has neither appid or a name",d);
                      return "unknown";
                  });
        
        //Create a container for each element,
        //binding mouse functions for them
        var containers = node.enter().append("g").classed("node",true)
            .attr("id",function(d){
                return "Node" + d.name.replace(idRegex,'');
            })
            .attr("transform",function(d){
                return "translate(" + d.x  +","+ d.y + ")";
            })
            .on("mouseover",function(d){
                cpInstance.highlightName(d);
            })
            .on("mouseout",function(d){
                cpInstance.unhighlightName(d);
            })
            .on("click",function(d){
                console.log("Clicked: ",d.name);
                //If there are games stored in the node (ie: its a category)
                if(d.games && d.games.length > 0){
                    //draw the pack of games for that category
                    cpInstance.cleanUp();
                    cpInstance.draw(d.games);
                }else{
                    //no games in node, is a game.
                    console.log("Draw Details:",d.name);
                    cpInstance.cleanUp();
                    cpInstance.drawGame(d);
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

        //transition all nodes up to their proper size
        node.selectAll("circle").transition()
            .attr('r',function(d){ return d.r;});

    };

    //----------------------------------------
    /**
       @class Circlepack
       @method drawNames
       @purpose Draws the names of groups in the sidebars
       @param data : the array of game objects, same as for drawGames
    */
    CP.prototype.drawNames = function(data){
        //Sort by time played, or no.of games in cat
        if(data[0].appid){
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

        //How many games to draw on either side
        var selectionAmount = 38;
        var first = data.slice(0,selectionAmount);
        var second = data.slice(-selectionAmount);
        //Draw the left and right bars of names
        this.drawNamesHalf(first,d3.select("#leftBar"));
        this.drawNamesHalf(second,d3.select("#rightBar"));
    };

    /**
       @class Circlepack
       @method drawNamesHalf
       @purpose draws a selection of the data to one sidebar
     */
    CP.prototype.drawNamesHalf = function(data,rootDom){
        var cpInstance = this;
        
        //select the names group
        var namesGroup = rootDom.select("#gameNames");
        //if its empty, create it
        if(namesGroup.empty()){
            namesGroup = rootDom.append("g").attr('id','gameNames')
                .attr("transform",function(){
                    return "translate(10," +
                        (Number(d3.select("#resetButton").select("rect").attr("height")) + 20)  + ")";
                });
        }

        //Bind the data
        var boundGroups = namesGroup.selectAll('g').data(data,function(d){
            if(d['appid']) return d['appid'];
            return d['name'];
        });

        //Remove old names
        boundGroups.exit().remove();

        //Draw new names
        var individualNames = boundGroups.enter().append("g")
            .attr("id",function(d){
                return "name_" + d.name.replace(idRegex,"");
            })
            .attr("transform",function(d,i){
                return "translate(0," + (i * 20) + ")";
            })
            .on("mouseover",function(d){
                //Mouseover and highlight
                cpInstance.highlightName(d);
            })
            .on("mouseout",function(d){
                //mouseout and unhighlight
                cpInstance.unhighlightName(d);
            })
            .on("click",function(d){
                console.log("TODO: draw what was clicked on");
            });

        //For each, create a text of the name
        individualNames.append("text")
            .style("text-anchor","left")
            .style("fill",function(d){
                return cpInstance.oneOf20Colours(d.value)
            })
            .text(function(d){
                return d.name;
            })
            .each(function(d){
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
            });
    };

    //--------------------
    /**
       @class Circlepack
       @method drawGame
       @purpose draws a single game as a rectangle.
       @STUB
       @TODO
     */
    CP.prototype.drawGame = function(game){
        var cpRef = this;
        var singleGame = d3.select("#singleGame");
        if(!singleGame.empty()){
            singleGame.remove();
        }
        singleGame = d3.select("#mainVisualisation")
            .append("g")
            .attr("id","singleGame");

        singleGame.append("rect")
            .attr("width",100)
            .attr("height",100)
            .style("fill","red")
            .attr("transform",
                  "translate(" + (this.packSize[0] * 0.5)
                  + "," + (this.packSize[1] * 0.5) +")")
            .on("click",function(d){
                console.log(game);
                cpRef.hub.sendStartMessageToServer(game.appid);
            });
    };

    //--------------------
    /**
       @class Circlepack
       @method cleanUp
       @purpose calls utility methods to clean up elements of the visualisation
     */
    CP.prototype.cleanUp = function(){
        console.log("Cleaning up");
        this.cleanUpNames();
        this.cleanUpNodes();
        this.cleanUpGame();
        this.cleanUpResetButton();
        d3.select("#gameTitle").selectAll("text").text("");
    };
    
    CP.prototype.cleanUpNames = function(){
        d3.selectAll("#gameNames").remove();
    }
    
    CP.prototype.cleanUpNodes = function(){
        d3.selectAll(".node").remove();
    };

    CP.prototype.cleanUpGame = function(){
        console.log("cleaning up single game");
        d3.select("#singleGame").remove();
    };

    CP.prototype.cleanUpResetButton = function(){
        d3.select("#resetButton").remove();
    };

    /**
       @class Circlepack
       @method drawResetButton
       @purpose draws a button that can reset the visualisation to its starting state
     */
    CP.prototype.drawResetButton = function(){
        var cpInstance = this;
        var resetButton = d3.select("#resetButton");
        if(!resetButton.empty()){
            return;
        }
        
        resetButton = d3.select("#leftBar").append("g")
            .attr("id","resetButton")
            .attr("transform","translate("
                  + (d3.select("#leftBar").select("rect").attr("width") * 0.1) + ",0)")
            .on("click",function(){
                //On click, redraw from categories
                console.log("Resetting");
                cpInstance.cleanUp();
                cpInstance.draw();
            });

        resetButton.append("rect")
            .style("fill",this.colours['green'])
            .attr("width",100)
            .attr("height",50);

        resetButton.append("text")
            .style("text-anchor","middle")
            .text("reset")
            .attr("transform","translate(50,25)");
    };

    /**
       @TODO
       @STUB
       @class CirclePack
       @method drawDataSwitch
       @purpose a method to allow the user to switch between focus on time played and...other?
     */
    CP.prototype.drawDataSwitch = function(){
        if(! d3.select("#dataSwitch").empty()){
            return;
        }
        console.log("TODO: dataSwitch");
        
    };

    /**
       @class CirclePack
       @method highlightName
       @purpose modifies a name in a sidebar, and highlights the corresponding circle.
       @callback
     */
    CP.prototype.highlightName = function(d){

        //Highlight the equivalent name:
        d3.selectAll("#name_"
                  + d.name.replace(idRegex,""))
            .select("text")
            .transition()
            .style("fill","red")
            .text(d.name);

        //Draw the title:
        d3.select("#gameTitle")
            .select("#gameTitleMainText")
            .text(function(){
                var scaleVal = "";
                if(d.games) scaleVal = " Games";
                if(d.hours_forever) scaleVal = " Hours Played"
                return d.name + " : " + Math.round(d.value) + scaleVal;
            });

        //Colour the circle:
        var nodeId = "#Node" + d.name.replace(idRegex,"");
        d3.select(nodeId)
            .select("circle")
            .transition()
            .style("fill","red");
        //cpInstance.colours["green"]);

        //select all other nodes
        //and reduce opacity
        d3.selectAll(".nodes").filter(function(a){
            if (d.name === a.name) return false;
            return true;
        }).transition()
            .style("opacity",0.3);
        
    };

    /**
       @class Circlepack
       @method unhighlightName
       @purpose removes a highlighted name and its effects
     */
    CP.prototype.unhighlightName = function(d){
        //recolour the text
        //ternary
        d3.selectAll("#name_"+d.name.replace(idRegex,""))
            .select("text")
            .transition()
            .text(d.shortName ? d.shortName : d.name)
            .style("fill",this.oneOf20Colours(d.value));
        //Remove the text:
        d3.select("#gameTitle")
            .select("#gameTitleMainText")
            .text("");
        
        //Return the colour:
        var nodeId = "#Node" + d.name.replace(idRegex,"");
        d3.select(nodeId)
            .select("circle")
            .transition()
            .style("fill",
                   this.oneOf20Colours(d.value));

        //return the opacity
        d3.selectAll(".nodes")
            .transition()
            .style("opacity",1);
    };
    
    return CP;
});
