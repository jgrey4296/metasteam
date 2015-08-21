/**
   Second attempt at circle pack visualisation for metasteam
*/

define(['d3.min','underscore'],function(d3,_){

    var idRegex = /\W/g;
    
    /**The MetaSteam Circlepack class. Takes a list of games,
       and visualises them
       @class CirclePack
    */
    var CP = function(sizeX,sizeY,listOfGames,tooltip){
	    console.log("Sizes:",sizeX,sizeY);//the tooltip for the visualisation:

        this.tooltip = tooltip;
        
        //The data the circle pack will be using:
        this.baseData = listOfGames;
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
        cpInstance = this;
        //Add a reset button
        var resetButton = d3.select("#leftBar").append("g")
            .attr("id","resetButton")
            .on("click",function(){
                //On click, redraw from categories
                console.log("Resetting");
                d3.selectAll(".node").remove();
                cpInstance.draw();//_.values(cpInstance.categories));
            });

        resetButton.append("rect")
            .style("fill","red")
            .attr("width",100)
            .attr("height",50);

        resetButton.append("text")
            .style("text-anchor","middle")
            .text("reset")
            .attr("transform","translate(50,25)");
        
        
        var main = d3.select("#circlePack");

        //Use passed in data, or default to the categories stored in the ctor
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
                return "translate(" + (d.x + 40)  +","+ d.y + ")";
            })
            .on("mouseover",function(d){
                //Mouseover enlarges the node, and shows the nodes text
                d3.select(this).select("circle").transition()
                    .attr("r",d.r + 50);

                d3.select(this).select("text").transition()
                    .style("opacity",1);
            })
            .on("mouseout",function(d){
                //mouseout reduces the node size to normal, and hides the text
                d3.select(this).select("circle").transition()
                    .attr("r",d.r);

                d3.select(this).select("text").transition()
                    .style("opacity",0);
                
            })
            .on("mousemove",function(d){
		        //currently unneeded
            })
            .on("click",function(d){
                //click on a node to
                console.log(d.name);
                main.selectAll(".node").remove();
                //If there are games stored in the node (ie: its a category)
                if(d.games){
                    //draw the pack of games for that category
                    console.log("Redrawing",d.games);
                    cpInstance.draw(d.games);
                }else{
                    //Send a start message:
                    //TODO: check this
                    var commandString = "";
                    commandString += "&command=startGame";
                    commandString += "&appid=";
                    commandString += d.appid;
                    var request = new XMLHttpRequest();
                    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    request.setRequestHeader('Content-Length', urlEncodedData.length);
                    request.open("POST","",true);
                    request.send(commandString);
                    // //or go back to drawing all categories
                    // console.log("other");
                    // cpInstance.draw(_.values(cpInstance.categories));
                }
            });

        //Create each node's representation, start it at 0 radius, enlarge it later
        containers.append("circle")
            .attr("r",0);//function(d){ return d.r; });

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
                //
                // var that = this;
                // var delay = 2000 * Math.random();
                // setInterval(function(){
                //     d3.select(that).transition().delay(function(d){
                //         return Math.random() * 2000;
                //     })
                //         .duration(1000).attr("opacity",1)
                //         .transition()
                //         .duration(1000).attr("opacity",0)
                // }, 3000);
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
        //split data in half?
        console.log("Drawing Names:",data);
        data.sort(function(l,r){
            return l.name > r.name;
        });
        
        //select the names group
        var namesGroupLeft = d3.select("#gameNames");
        if(namesGroupLeft.empty()){
            namesGroupLeft = d3.select("#mainsvg").append("g").attr('id','gameNames')
                .attr("transform",function(){
                    return "translate(5," +
                        (Number(d3.select("#resetButton").select("rect").attr("height")) + 20)  + ")";
                });
        }
        
        var boundGroups = namesGroupLeft.selectAll('g').data(data,function(d){
            if(d['appid']) return d['appid'];
            return d['name'];
        });

        boundGroups.exit().remove();

        var individualNames = boundGroups.enter().append("g")
            .attr("transform",function(d,i){
                return "translate(0," + (i * 20) + ")";
            })
            .on("mouseover",function(d){
                //Draw a line to the corresponding circle
                var theText = d3.select(this).select('text');
                theText.transition()
                    .style("fill","red")
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
            })
            .on("mouseout",function(d){
                //fade the line out
                var theText = d3.select(this).select('text');
                theText.transition()
                    .style("fill",'white')
                    .text(function(d){
                        return d.shortName;
                    });

                var idString = "#Node" + d.name.replace(idRegex,'');

                if(d3.select(idString).empty()) return;
                
                d3.select(idString)
                    .select("circle")
                    .transition()
                    .style("fill","black");

            });

        individualNames.append("text")
            .style("text-anchor","left")
            .style("fill","white")
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
