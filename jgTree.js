function generateTimeline(){
    //Main Globals
    var margin = 50;
    var height = window.innerHeight - margin;
    var width = window.innerWidth - margin;
    var centerx = window.innerWidth * 0.5;
    var centery = window.innerHeight * 0.5;
    var headerSize = 50;

    //Scaling and Axes
    var scaleX = d3.scale.linear()
	.domain([0,11])
	.range([0,width]);

    var scaleY = d3.scale.linear()
	.domain([0,10])
	.range([0,height]);

    var xAxis = d3.svg.axis().scale(scaleX).ticks(10).tickSize(-height).orient("top");
    var yAxis = d3.svg.axis().tickSize(width).orient("left").scale(scaleY);
    //-------

    //The core element to work upon:    
    var mainElement = d3.select('body').append('svg')
	.attr('height',height)
	.attr('width',width)
	.attr("transform","translate("+margin+","+ margin + ")");


    //scrubbing header
    // mainElement.append("rect")
    // 	.attr("width",width)
    // 	.attr("height",headerSize)


    //Position line: All timeline elements relative to this
    var lineGroup = mainElement.append("g").data([0])
	.attr("transform",function(d){
	    console.log("data: " + d);
	    return "translate(" + centerx + "," + headerSize + ")";
	});
	//i can use the scale.inverse method to get where i am in the data,
    //then filter out things too far away


    lineGroup.append("line")
	.attr("x1",0)
	.attr("x2",0)
	.attr("y1",0)
	.attr("y2",height)
	.attr("style","stroke:black");

//----------------------------------------
    //Load the JSON data
    d3.json("timeline.json",function(d){
	//pack it appropriately
	var data = d;
//	data.sort(function(a,b){
//	    return a[1] < b[1];
//	});
	console.log(d);
	var domain = [d3.min(data,function(d){return d[1] - 1;}),
		      d3.max(data,function(d){return d[2] + 2;})];

	scaleX.domain(domain);
	scaleY.domain([0,d.length]);

	yAxis.ticks(d.length);

//remember array.filter

	console.log("Boundaries:",domain);

	//visualise it

	//X axis
	mainElement.append("g")
	.attr("class", "xaxis")
	.attr("transform","translate(0," + 0 + ")")
	    .call(xAxis);
	//y axis
	mainElement.append("g")
	.attr("class","yaxis")
	.call(yAxis);

	//tooltip
	var tooltip = mainElement.append("g").classed("tooltip", true)
	    .attr("display","none"); //only display when hovering, see later.

	tooltip.append("rect")
	.attr("width",100)
	.attr("height",100)
	.style("opacity",1);

	tooltip.append("text")
	    .text(d[0])
	    .attr("transform","translate(20,15)")
	    .style("fill","white");

	//Create a place to put the visualised data
	var eventContainer = mainElement.append("g").classed("eventContainer",true);

	//join loaded json data to containers.
	var events = mainElement.select(".eventContainer")
	    .selectAll(".events").data(data)
	    .enter().append("g").classed("events",true)
	    .attr("transform",function(d,i){
		return "translate(" + scaleX(d[1]) + "," + 50 + ")";
	    });

	//Draw a rectangle for each
	events.append("rect")
	.attr("width",function(d){
	    return scaleX(d[2] - d[1]);//Width being start -> end
	})
	.attr("height",30)
	.attr("transform",function(d,i){
	    return "translate(0," + (i * 30) + ")"; 
	})
	.attr("style","fill:green;opacity:0.5")
	//Adding interaction:
	.on("mouseover",function(d){
	    var tooltip = mainElement.select(".tooltip");
		tooltip.attr("display","show");
	    
	    tooltip.select("text")
	    .text(d);
	    

	})
	.on("mouseout",function(d){
	    mainElement.selectAll(".tooltip")
	    .attr("display","none");
	})
	.on("mousemove",function(d){
	    mainElement.select(".tooltip")
	    .attr("transform",function(d){
		var s = d3.select("svg");
		return "translate(" + (d3.mouse(s.node())[0] + 20) 
		  + "," + d3.mouse(s.node())[1] + ")";
		  });
	});

	console.log(events);

    });
}
