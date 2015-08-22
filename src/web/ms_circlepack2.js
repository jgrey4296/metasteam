/**
   Second attempt at circle pack visualisation for metasteam
*/

define(['d3.min','underscore'],function(d3,_){

    var idRegex = /\W/g;
    
    /**The MetaSteam Circlepack class. Takes a list of games,
       and visualises them
       @class CirclePack
    */
    var CP = function(sizeX,sizeY,colours){
	    console.log("Sizes:",sizeX,sizeY,colours);//the tooltip for the visualisation:

        this.colours = colours;
        
        //The data the circle pack will be using:
        this.baseData = null;
        this.categories = {};

        this.currentDataSet = [];

        //Packer:
        this.bubble = d3.layout.pack()
            .sort(function(f,s){
                return f.name < s.name;
            })
            .size([sizeX,sizeY])
            .padding(1.5);

        
        //Add a catchall to the categories
        this.categories['everything'] = {
            name: 'everything',
            games: [],
            value: 0.1
        };
    };

    CP.prototype.registerData = function(data){
        console.log("registering data:",data);
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
                this.categories[tag]['games'].push(game);
                this.categories[tag]['value'] += 1;
                
            }
        }

        this.categories['everything'].value = this.categories['everything']['games'].length;

        this.currentDataSet = _.values(this.categories);
    };



    //--------------------
    /**The Main Draw method for circlepacking
       @method draw
    */
    CP.prototype.draw = function(data){
        console.log("Drawing:",data);
        var cpInstance = this;
        //Add a reset button
        var resetButton = d3.select("#leftBar").append("g")
            .attr("id","resetButton")
            .attr("transform","translate(" + (d3.select("#leftBar").select("rect").attr("width") * 0.1) + ",0)")
            .on("click",function(){
                //On click, redraw from categories
                console.log("Resetting");
                d3.selectAll(".node").remove();
                //Reset the translation and scaling for the new draw:
                d3.select("#mainVisualisation")
                    .attr("transform","translate(0,0)scale(1,1)");
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

        //Finished with reset button, draw the vis
        var main = d3.select("#mainVisualisation");
        //Setup the zoom:
        d3.select("#mainsvg")
            .call(d3.behavior.zoom()
                  .scaleExtent([1,2])
                  .on("zoom",function(){
                      main.attr("transform","translate(" + d3.event.translate +")scale(" + d3.event.scale + ")");            
                  })
                 );;
        
        //Use passed in data, or default
        //to the categories stored in the ctor
	    if(data !== undefined){
            this.currentDataSet = data;
        }else{
            this.currentDataSet = _.values(this.categories);
        }
        
        //The node data structure from packing
        var packed_nodes = this.bubble.nodes({children:this.currentDataSet}).filter(function(d,i){
            if(d['children']) return false;
            return true;
        });

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
                    .text(d.name + " : " + d.value);

                //Colour the circle:
                d3.select(this)
                    .select("circle")
                    .transition()
                    .style("fill",cpInstance.colours["green"]);
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
                    .style("fill",cpInstance.colours["lightBlue"]);
                
            })
            .on("click",function(d){
                console.log(d.name);
                main.selectAll(".node").remove();
                //If there are games stored in the node (ie: its a category)
                if(d.games){
                    //draw the pack of games for that category
                    console.log("Redrawing",d.games);
                    cpInstance.draw(d.games);
                }else{
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

        //Create each node's representation, start it at 0 radius, enlarge it later
        containers.append("circle")
            .attr("r",0)  //function(d){ return d.r; });
            .style("fill",this.colours["lightBlue"]);
        
        //The text for each node
        containers.append("text")
            .text(function(d) {
                //If the node is too small, don't display its text
                return d.name;
            })
            .style("fill","white")
            .style("text-anchor","middle")
            .attr("transform","translate(0,0)")
            .each(function(d,i){
                //For each node in the selection, have it fade its text in and out
                d3.select(this).style("opacity",0);
                return;
            })
                .style("-moz-user-select","-moz-none"); //stop the user selecting the text in firefox
        

        //here transitions all nodes up to their proper size
        node.selectAll("circle").transition().attr('r',function(d){ return d.r;});

        //Draw the tooltip that was passed in as part of the ctor
        //this.tooltip.draw();
        this.drawNames(this.currentDataSet);
    };

    //----------------------------------------
    /**Helper function for draw, to draw all names of categories/ games in margins
       @function drawNames
       @param data : the array of game objects, same as for drawGames
    */
    CP.prototype.drawNames = function(data){
        var selectionAmount = 38;
        var first = data.reverse().slice(0,selectionAmount);
        var second = data.slice(selectionAmount,(selectionAmount * 2));
        this.drawNamesHalf(first,d3.select("#leftBar"));
        this.drawNamesHalf(second,d3.select("#rightBar"));
    };

    //Draw data as names under the dom element specified
    CP.prototype.drawNamesHalf = function(data,rootDom){
        var cpInstance = this;
        console.log("Drawing Names:",data);
        data.sort(function(l,r){
            return l.name > r.name;
        });
        
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
                    .style("fill",cpInstance.colours["textBlue"])
                    .text(function(d){
                        d.shortName = theText.text();
                        return d.name;
                    });

                var idString = "#Node" + d.name.replace(idRegex,'');

                if(d3.select(idString).empty()) return;
                
                d3.select(idString)
                    .select("circle")
                    .transition()
                    .style("fill",cpInstance.colours["green"]);
            })
            .on("mouseout",function(d){
                //fade the line out
                var theText = d3.select(this).select('text');
                theText.transition()
                    .style("fill",cpInstance.colours["textGrey"])
                    .text(function(d){
                        return d.shortName;
                    });

                var idString = "#Node" + d.name.replace(idRegex,'');

                if(d3.select(idString).empty()) return;
                
                d3.select(idString)
                    .select("circle")
                    .transition()
                    .style("fill",cpInstance.colours["lightBlue"]);

            });

        individualNames.append("text")
            .style("text-anchor","left")
            .style("fill",this.colours["textGrey"])
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
    
    return CP;
});
