/**
   Second attempt at circle pack visualisation for metasteam
*/

define(['d3.min','underscore'],function(d3,_){

    var CP = function(sizeX,sizeY,listOfGames){
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
            value: 0
        };

        //for every game
        for(var i in this.baseData){
            var game = this.baseData[i];
            game['value'] = game['hours_forever'];
            this.categories['everything']['games'].push(game);
            var tags = game['__tags'];
            //for every tag for every game
            for(var i in tags){
                var tag = tags[i];
                if(this.categories[tag] === undefined){
                    this.categories[tag] = {
                        name: tag,
                        games: [],
                        value : 0
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

        //The node data structure from packing
        var packed_nodes = bubble.nodes({children:this.currentDataSet}).filter(function(d,i){
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

        //the existing g's
        var containers = node.enter().append("g").classed("node",true)
            .on("mouseover",function(d){

            })
            .on("mouseout",function(d){

            })
            .on("mousemove",function(d){

            })
            .on("click",function(d){

            });
        
        containers.append("circle")
            .attr("r",function(d){ return d.r; })
            .attr("transform",function(d){
                return "translate(" + d.x +","+ d.y + ")";
            })
        //TODO: add colours
        
        
        containers.exit().transition().attr('r',0).remove();
    };


});
