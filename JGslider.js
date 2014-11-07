
//Constructor for the main slider datastructure
var JGSlider = function (name, w, m) {
        this.name = name;
        this.x = 0;
        this.y = 0;
        //Value is the scaled x amount
        this.value = 0;

        this.margin = m;

        //width or size including margin
        if (w === 'undefined') {
            this.width = 200;
        } else {
            this.width = w;
        }


        this.scale = d3.scale.linear().domain([0, this.width - (this.margin * 2)]);


        this.showText = function () {
            return (this.name + ": " + this.value);
        };

    };


//Creates and adds a slider to the global list of sliders
function createSlider(name, location, width, margin) {

    globals.sliders.push(new JGSlider(name, width, margin));
    
    var group = location.selectAll("g")
        .data(globals.sliders).enter()
        .append("g").classed("slider",true)
        .attr("transform",
              function (d, i) { return "translate(" + d.margin + "," + (40 + (i * margin)) + ")"; });

    group.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", 5)
        .attr("width", function (d) {return (d.width - (d.margin * 2)); })
        .attr("fill", "green");

    group.append("circle")
        .attr("r", 20)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", "red")
        .call(globals.drag);

    group.append("text")
        .attr("x", function (d) {return d.margin * 3; })
        .attr("y", function (d) {return d.margin * 0.75; })
        .text(function (d) { return d.name; });
}

//Drag functions:
function dragMove() {
    d3.select(this)
        .attr("opacity", 0.6)
        .attr("cx", function (d,i) {
            d.x = Math.max(0, Math.min((d.width - (d.margin * 2)), d3.event.x));
            d.value = globals.scale(d.x);
	    JG.value[i] = d.value;
            return d.x;
        });

    d3.select(this.parentNode).select("text")
        .text(function (d) {
            return d.showText();
        });
}

function dragEnd(d) {
    d3.select(this)
        .attr("opacity", 1);

}

