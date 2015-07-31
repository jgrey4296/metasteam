function bubbleGames(){
  //Initial Setup
  var diameter = 960,
      format = d3.format(",d"),
      color = d3.scale.category20c();

  //Setup the packing
  var bubble = d3.layout.pack()
               .sort(null)
               .size([diameter, diameter])
               .padding(1.5)
               .value(function(d){//specify a value accessor
                 return d['SizeOnDisk'];
               });

  //setup the drawing.
  var svg = d3.select("body").append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", "bubble");

  //load the json
  d3.json("exportedGames.json", function(error, root) {
    //convert it to an object with children
    var data = {children:root};
    //Select, bind, 
    var node = svg.selectAll(".node")
               .data(bubble.nodes(data)
                     //filter the parent
                     .filter(function(d) { return !d.children; }))
               .enter().append("g")
               .attr("class", "node")
               .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
	//Adding interaction:
	           .on("mouseover",function(d){
	             var tooltip = svg.select(".tooltip");
	             tooltip.attr("display","show");
	             tooltip.select("text").text(d['name']);
	           })
	           .on("mouseout",function(d){
	             svg.selectAll(".tooltip")
	             .attr("display","none");
	           })
	           .on("mousemove",function(d){
	             svg.select(".tooltip")
	             .attr("transform",function(d){
		           var s = d3.select("svg");
		           return "translate(" + (d3.mouse(s.node())[0] + 20) 
		                + "," + d3.mouse(s.node())[1] + ")";
		         });
	           });
    
    
    
    node.append("circle")
    .attr("r", function(d) { return d.r; })
    .style("fill", function(d) { return color(d.packageName); });
    
	//tooltip
	var tooltip = svg.append("g").classed("tooltip", true)
	    .attr("display","none"); //only display when hovering, see later.

	tooltip.append("rect")
	.attr("width",300)
	.attr("height",50)
	.style("opacity",1);

	tooltip.append("text")
	    .text("")
	    .attr("transform","translate(20,15)")
 	    .style("fill","white");
  });

};

// 	//Create a place to put the visualised data
// 	var eventContainer = mainElement.append("g").classed("eventContainer",true);

// 	//join loaded json data to containers.
// 	var events = mainElement.select(".eventContainer")
// 	    .selectAll(".events").data(data)
// 	    .enter().append("g").classed("events",true)
// 	    .attr("transform",function(d,i){
//             return "translate(" + d.x + "," + d.y + ")";
//             //return "translate(" + scaleX(d[1]) + "," + 50 + ")";
// 	    });

// 	//Draw a rectangle for each
// 	events.append("rect")
// 	.attr("width",function(d){
// 	    return 50;//scaleX(d[2] - d[1]);//Width being start -> end
// 	})
// 	.attr("height",30)
// 	.attr("transform",function(d,i){
// 	    return "translate(0," + (i * 30) + ")"; 
// 	})
// 	.attr("style","fill:green;opacity:0.5")

// 	console.log(events);

//     });
// }
