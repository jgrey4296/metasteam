/**
   Meta Steam Circle Pack Module
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['libs/d3.min','ms_tooltip'],function(d3,ToolTip){

    var colours = d3.scale.category20c();
    var tooltip = null;
    
    var MSCirclePack = function(height,width,startingData){
        this.height = height - 10;
        this.width = width - 10;
        this.bubble = d3.layout.pack()
            .sort(null)
            .size([this.height,this.width])
            .padding(4);
        this.baseData = startingData;

        d3.select("#mainsvg").on("mousemove",function(d){
            tooltip.move(d3.event.clientX,d3.event.clientY);
        });

        var mscpInstance = this;
        var reset = d3.select("#mainsvg").append("g")
            .attr("id","resetButton")
            .on("mousedown",function(d){
                console.log("reseting");
                var newData = mscpInstance.transformData(_.keys(mscpInstance.baseData));
                mscpInstance.draw(newData);
            });

        reset.append("rect")
            .attr("width",50)
            .attr("height",50);

        reset.append("text")
            .style("fill","white")
            .text("reset")
            .attr("transform","translate(20,25)");
        
        this.previousData = [];
    };

    //TODO: need to have scraped profile data for this
    MSCirclePack.prototype.transformToGameData = function(appids){
        var rootNode = { children:[]};
        for(var i in appids){
            var game = this.baseData[appids[i]];
            rootNode.children.push({
                "name":game.name,
                "value":20,
            });
        };
        return rootNode;
    };
    
    //Take an array of appids
    var transformData = function(appids){
        console.log("transforming:",appids);
        //[tag] -> [appid, appid, appid...]
        var masterTagObject = {};
        for(var i in appids){
            var game = this.baseData[appids[i]];
            if(game["__scraped"] !== true) continue;
            var tags = game["__tags"];
            //add the game for each tag
            for(var j in tags){
                var tag = tags[j];
                if(masterTagObject[tag] === undefined){
                    masterTagObject[tag] = [];
                }
                //Add the appid if its not there already
                if(masterTagObject[tag].indexOf(game.appid) < 0){
                    masterTagObject[tag].push(game.appid);
                }
            }
        }


        //Return in circle pack form:
        //object[children] -> {children:[],values:[appid,appid...],size:values.length}
        var rootNode = {children:[]};
        for(var name in masterTagObject){
            rootNode.children.push({
                "children":[],
                "appids"  :masterTagObject[name],
                "value"    :masterTagObject[name].length,
                "name"    :name
            });
        };

        return rootNode;
    };
    MSCirclePack.prototype.transformData = transformData;

    
    MSCirclePack.prototype.draw = function(data){
        var mscpInstance = this;
        console.log("Draw data:",data);
        var main = d3.select("#mainsvg");

        
        d3.selectAll(".node").remove();
        
        var nodes = main.selectAll(".node")
            .data(this.bubble.nodes(data)
                  .filter(function(d){ return !d.children; }));
        
        nodes.enter().append("g")
            .attr("class","node")
            .attr("transform",function(d){
                return "translate(" + d.x + "," + d.y + ")";
            })
            .on("mouseover",function(d){
                tooltip.show(d.name);
            })
            .on("mouseout",function(d){
                tooltip.hide();
            })
            .on("mousedown",function(d){
                console.log("Click on:",d.name);
                console.log("Appids:",d.appids);
                //create new selection and redraw
                if(d.appids.length > 20){
                    var newSelection = mscpInstance.transformData(d.appids);
                    console.log("New Selection:",newSelection);
                    mscpInstance.draw(newSelection);
                }else{
                    var newSelection = mscpInstance.transformToGameData(d.appids);
                    mscpInstance.draw(newSelection);
                }
            });
        
        nodes.append("circle")
            .attr("r",function(d){ return d.r; })
            .style("fill",function(d) { return colours(d.name); });

        nodes.append("text")
            .text(function(d){ return d.name;})
            .attr("transform",function(d){
                return "translate(" + (-(d.r /2)) + ",0)";
            });
            //.style("opacity",0);
        
        if(tooltip === null){
            tooltip = new ToolTip();
        }
        tooltip.draw();
    };
    

    return MSCirclePack;
});
