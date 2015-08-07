/**
   Second attempt at circle pack visualisation for metasteam
*/

define(['d3.min','underscore'],function(d3,_){

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

        cpInstance = this;
        //Add a reset button
        var resetButton = d3.select("#leftBar").append("g")
            .attr("id","resetButton")
            .on("click",function(){
                //On click, redraw from categories
                d3.selectAll(".node").remove();
                cpInstance.draw(_.values(cpInstance.categories));
            });

        resetButton.append("rect")
            .style("fill","red")
            .attr("width",100)
            .attr("height",100);

        resetButton.append("text")
            .style("text-anchor","middle")
            .text("reset")
            .attr("transform","translate(50,50)");
        
    };

    //--------------------
    /**The Main Draw method for circlepacking
       @method draw
    */
    CP.prototype.draw = function(data){

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
            .attr("transform",function(d){
                return "translate(" + (d.x + 40)  +","+ d.y + ")";
            })
            .on("mouseover",function(d){
                //Mouseover enlarges the node, and shows the nodes text
                d3.select(this).select("circle").transition()
                    .attr("r",d.r + 50);

                if(d.r < 20){
                    d3.select(this).select("text").text(d.name);
                }
                
                d3.select(this).select("text").transition()
                    .style("opacity",1);
            })
            .on("mouseout",function(d){
                //mouseout reduces the node size to normal, and hides the text
                d3.select(this).select("circle").transition()
                    .attr("r",d.r);
                d3.select(this).select("text").transition()
                    .style("opacity",0);

                if(d.r < 20){
                    d3.select(this).select("text").transtion()
                        .style("opacity",0);
                }
                
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
                if(d.r < 20) return "";
                return d.name;
            })
            .style("fill","white")
            .attr("transform","translate(-20,0)")
            .each(function(d,i){
                //For each node in the selection, have it fade its text in and out
                if(d.r < 20) return;
                var that = this;
                var delay = 2000 * Math.random();
                setInterval(function(){
                    d3.select(that).transition().delay(function(d){
                        return Math.random() * 2000;
                    })
                        .duration(1000).attr("opacity",1)
                        .transition()
                        .duration(1000).attr("opacity",0)
                }, 3000);
            })
                .style("-moz-user-select","-moz-none"); //stop the user selecting the text in firefox
        

        //here transitions all nodes up to their proper size
        node.selectAll("circle").transition().attr('r',function(d){ return d.r;});

        //Draw the tooltip that was passed in as part of the ctor
        this.tooltip.draw();
        
    };

    return CP;
});
