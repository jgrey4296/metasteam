/**
   Second attempt at circle pack visualisation for metasteam
*/

define(['d3.min','underscore','ms_tooltip'],function(d3,_,Tooltip){

    var CP = function(sizeX,sizeY,listOfGames){
        //the tooltip for the visualisation:
        //this.tooltip = Tooltip();
        //this.tooltip.draw();
        
        //The data the circle pack will be using:
        this.baseData = listOfGames;
        this.categories = {};

        this.currentDataSet = [];

        //Packer:
        this.bubble = d3.layout.pack()
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
    CP.prototype.draw = function(data){

        var main = d3.select("#mainsvg");

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

        //The drawn nodes
        var node = main.selectAll(".node")
            .data(packed_nodes,
                  function(d){
                      if(d['appid']) return d['appid'];
                      if(d['name']) return d['name'];
                      console.log("A Node has neither appid or a name",d);
                      return "unknown";
                  });

        var cpInstance = this;
        //the existing g's
        var containers = node.enter().append("g").classed("node",true)
            .on("mouseover",function(d){
                //cpInstance.tooltip.show(d.name);
            })
            .on("mouseout",function(d){
                //cpInstance.tooltip.hide();
            })
            .on("mousemove",function(d){
            })
            .on("click",function(d){
                console.log(d.name);
                main.selectAll(".node").remove();
                if(d.games){
                    console.log("Redrawing",d.games);
                    cpInstance.draw(d.games);
                }else{
                    console.log("other");
                    cpInstance.draw(_.values(cpInstance.categories));
                }
            })
            .attr("transform",function(d){
                return "translate(" + d.x +","+ d.y + ")";
            });

        containers.append("circle")
            .attr("r",0);//function(d){ return d.r; });


        containers.append("text")
            .text(function(d) {
                if(d.r < 20) return "";
                return d.name;
            })
            .style("fill","white")
            .attr("transform","translate(-20,0)")
            .each(function(d,i){
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
                .style("-moz-user-select","-moz-none");
        

        node.selectAll("circle").transition().attr('r',function(d){ return d.r;});
    
    };

    return CP;
});
