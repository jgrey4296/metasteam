/*global   Node 20   select 2 */
require(['d3','jgGraph'],function(d3,jgGraph){
  console.log("Test Graph Visualisation");

  //utility variable object:
  var utilv = {};

  //Graph Creation
  var myGraph = jgGraph.newGraph();
  var rootNode = myGraph.newNode("root");

  //json loading and graph creation shouldnt be difficult


  //Setup the utilv:
  //Tool tip variables:
  utilv.ttWidth = 400;
  utilv.ttHeight = 150;

  //General Globals
  utilv.margin = 10;
  utilv.height = window.innerHeight - utilv.margin;
  utilv.width = window.innerWidth - utilv.margin;
  utilv.centerx = window.innerWidth * 0.5;
  utilv.centery = window.innerHeight * 0.5;
  utilv.headerSize = 50;

  utilv.ttWidth = 400;
  utilv.ttHeight = 150;

  utilv.bubble = d3.layout.pack()
                 .sort(null)
                 .size([500,500])
                 .padding(1.5);


  utilv.mainElement = d3.select('body').append('svg')
	                  .attr('height',utilv.height)
	                  .attr('width',utilv.width);


  //slider setup:

  var half = utilv.width/2;

  var mainE = utilv.mainElement;
  var focus = mainE.append("g").attr("id","focus")
  .attr("transform","translate(" + half + ",0)");



  var parents = mainE.append("g").attr("id","parentNodes")
                .attr("transform","translate("+ (half - (half / 2)) +",0)");

  var children = mainE.append("g").attr("id","childNodes")
  .attr("transform","translate("+(half + (half /2)) + ",0)");


  //Indicators
  var focusLabel = focus.append("g").attr("id","focusLabel")
                   .attr("transform","translate(-50,20)");
  focusLabel.append('rect')
  .attr("width",100)
  .attr("height",50);

  focusLabel.append("text")
  .text("Focus Node").attr("fill","white")
  .attr("transform","translate(50,30)")
  .attr("text-anchor","middle");


  var childLabel = children.append("g")
                   .attr("id","childLabel")
                   .attr("transform","translate(-50,20)");
;
  childLabel.append("rect")
  .attr("width",100).attr("height",50);

 childLabel.append("text")
  .text("Children").attr("fill","white")
  .attr("transform","translate(50,30)")
  .attr("text-anchor","middle");

  var parentLabel = parents.append("g")
                    .attr("id","parentLabel")
  .attr("transform","translate(-50,20)");
  
  parentLabel.append("rect")
  .attr("width",100).attr("height",50);
  parentLabel.append("text")
  .text("Parents").attr("fill","white")
  .attr("transform","translate(50,30)")
  .attr("text-anchor","middle");
  
  //Add Buttons
  var parButton = parents.append("g")
  .attr("id","parentAddButton")
  .attr("transform","translate(50,20)")
                  .on("mousedown",function(){
                    var input = d3.select("#newParName")[0][0];
                    var text = input.value;
                    var node = focus.select("#focusNode")
                               .datum();
                    console.log("creating: ",text,node);
                    //TODO: search for a node with that name
                    var newNode = myGraph.newNode(text);
                    node.addParent(newNode);
                    drawSingle(node);
                    input.value = "";

                   });

  d3.select("#newChildBox").attr('style',function(){
    var s = "top:65px; left:" + (half + (half/2) - 20) + "px";
    return s;
  })
  d3.select("#newParBox").attr('style',function(){
    var s = "top:65px; left:" + (half - (half/2) - 20) + "px";
    return s;
  });


  parButton.append("rect")
  .attr("width",50).attr("height",50);
  parButton.append("text")
  .text("+").attr("fill","white")
  .attr("transform","translate(25,30)")
  .attr("text-anchor","middle")


  var childButton = children.append("g")
  .attr("id","childAddButton")
  .attr("transform","translate(50,20)")
                  .on("mousedown",function(){
                      var input = d3.select("#newChildName")[0][0];
                    var text = input.value;
                    d3.select("#newChildName")[0][0].focus();
                    var node = focus.select("#focusNode")
                               .datum();
                    console.log("creating: ",text,node);
                    var newNode = myGraph.newNode(text);
                    node.addChild(newNode);
                    drawSingle(node);
                      input.value = "";
                   });

  childButton.append("rect")
  .attr("width",50).attr("height",50);
  childButton.append("text")
  .text("+").attr("fill","white")
  .attr("transform","translate(25,30)")
  .attr("text-anchor","middle");



  //Drawing Functions
  //Select and draw the focus node
  var drawSingle = function(node){
    console.log("Drawing Single Node",node);

    var focus = mainE.select("#focus").selectAll("#focusNode").data([node])
                .enter().append("g").attr("id","focusNode")
                .attr("transform","translate(0," + 150 + ")");

    focus = mainE.selectAll("#focusNode");
    focus.append("circle").attr("r",50);
    focus.append("text").text(function(d){return d.name;})
    .attr("fill","white")
    .attr("text-anchor","middle");

    //Draw children:
    drawNodes(mainE.select("#childNodes"),node.children);
    //Draw Parents:
    drawNodes(mainE.select("#parentNodes"),node.parents);
    

  };

  //Draw an array of nodes on the selection passed in
  var drawNodes = function(selection, nodes){
    console.log("Drawing Nodes",nodes);
    var childSelection = selection.selectAll("#nodes")
                         .data(nodes);
    childSelection.enter().append("g")
    .attr("id","nodes")
    .attr("transform",function(d,i){
      var s = "translate(0," + (150 + (i * 70)) + ")";
      return s;
    })
    .on("mousedown",function(d){
      console.log("drawing",d);
      drawSingle(d);
    });

    childSelection.exit().remove();

    childSelection.append("circle")
    .attr("r",30);

    childSelection.append("text")
    .text(function(d){return d.name;})
    .attr("fill","white")
    .attr("text-anchor","middle");

  };

  //Starting Call
  drawSingle(rootNode);

});