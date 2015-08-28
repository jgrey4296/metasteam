/*global   */
require(['d3','dataProcess'],function(d3,dataProcess){
  console.log("Meta Steam Visualisation Startup");

  //utility variable object:
  var utilv = {};

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

  utilv.data = [1,2,3,4,5];

  var draw = function(data){
    console.log("drawing");
    var main = d3.select("svg");

    main = main.selectAll("g").data(data);
    var groups = main.enter().append("g").attr('transform',function(d,i){
      return "translate(" + 30 + "," + (20 + i * 30) + ")";
    })
    .on("mouseenter",function(d){
                   d3.select(this).append("circle").attr("r",15)
                   .attr("transform","translate(30,0)");

                   
                 });

    groups.append("circle").attr("r",15);
    

  };


  draw(utilv.data);

});