/**
   Meta Steam Web visualisation tooltip
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['libs/d3.min'],function(d3){

    var ToolTip = function(){
        this.setup();
    };

    ToolTip.prototype.setup = function(){
        if(d3.select("#tooltip").empty()){
            this.tooltip = d3.select("#mainsvg")
                .append("g")
                .attr("id","tooltip");
        }else{
            this.tooltip = d3.select("#tooltip");
        }
    };
    
    ToolTip.prototype.draw = function(){
        this.tooltip.remove();
        this.setup();
        this.tooltip.append("rect")
            .attr("width","300")
            .attr("height","50")
            .attr("rx",10)
            .attr("ry",10);
        var text = this.tooltip.append("text")
            .text("blah")
            .style("fill","white")
            .attr("transform","translate(25,25)");

    };

    ToolTip.prototype.hide = function(){
        this.tooltip.transition()
            .duration(500)
            .style("opacity",0);
    };
    
    ToolTip.prototype.show = function(string){
        this.tooltip.transition()
            .duration(500)
            .style("opacity",1);

        this.tooltip.select("text")
            .text(string);
    };

    ToolTip.prototype.move = function(x,y){
        this.tooltip.attr("transform",
                          "translate(" + x + "," + y + ")");
    };
    
    return ToolTip;
});
