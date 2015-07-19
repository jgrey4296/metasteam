define(['d3'],function(d3){
  var margin = 10;
  var height = window.innerHeight - margin;
  var width = window.innerWidth - margin;
  var centerx = window.innerWidth * 0.5;
  var centery = window.innerHeight * 0.5;
  var headerSize = 50;
  
  var bubble = d3.layout.pack()
               .sort(null)
               .size([500,500])
               .padding(1.5);
    
    var color = d3.scale.category20c();

  
//--------------------
//    Container Creation
//--------------------
  function containerCreation(){
    //The core element to work upon:    
    var mainElement = d3.select('body').append('svg')
	                  .attr('height',height)
	                  .attr('width',width)
	                  .attr("transform","translate("+margin+","+ margin + ")");

  }

//--------------------
//          Interface
//--------------------
  var interface = {};
  interface['containers'] = containerCreation;

  return interface
});