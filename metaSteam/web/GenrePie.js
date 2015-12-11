/**
   @class GenrePie
   @purpose Creates a pie chart of each tag in the dataset
   @requiredMethod registerData
   @requiredMethod draw
   @requiredMethod cleanUp
*/

define(['d3','underscore'],function(d3,_){

    /**The main class
       @class Timeline
       @constructor
     */
    var Visualisation = function(hub){
        this.hub = hub;
        //set these in register data
        this.width = this.hub.internalWidth;
        this.height = this.hub.internalHeight;
        this.radius = Math.min(this.width,this.height)/2;
        
        this.colours = this.hub.colours;

        //Colours scaling
        this.scaleToColours = d3.scale.linear()
            .domain([0,100])
            .rangeRound([0,20]);
        this.colourScale = d3.scale.category20b();

        //Function to get a colour from a value
        this.oneOf20Colours = function(val){
            return this.colourScale(this.scaleToColours(val));
        };

        //Border
        this.border = 10;
        
        //Radius:
        this.radius = Math.min(this.width,this.height) / 2;

        console.log("radius and border:",this.radius,this.border,this.width,this.height);
        //Arc:
        this.arc = d3.svg.arc()
            .outerRadius(this.radius - this.border)
            .innerRadius(0);

        
        this.pie = d3.layout.pie()
            .value(function(d) { return d.value; });

        
    };

    /**
       @method registerdata
    */
    Visualisation.prototype.registerData = function(data){
        console.log("Template: Registering Data");
        this.data = data;
        
        var genresData = {};

        _.values(this.data.installed).forEach(function(game){
            if(game.__tags){
                game.__tags.forEach(function(tag){
                    if(genresData[tag] === undefined){
                        genresData[tag] = {
                            "name" : tag,
                            "value" : 0
                        };
                    }
                    genresData[tag].value += 1;
                });
            }
        });

        this.data = _.values(genresData).filter(function(d){
            return d.value > 0;
        });
        console.log("Genres Data:",this.data);
        
        this.pieData = this.pie(this.data);
        console.log("Pie Data: ",this.pieData);
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(){
        var pieRef = this;
        console.log("Template: Drawing");

        var pieChart = d3.select("#mainVisualisation").append("g")
            .attr("id","pieChart")
            .attr("transform","translate(" + (this.width / 2) + "," + (this.height/2) + ")");


        var arcs = pieChart.selectAll(".arc").data(this.pieData).enter().append("g")
            .classed("arc",true);

        arcs.append("path")
            .attr("d",this.arc)
            .style("fill",function(d){
                return pieRef.oneOf20Colours(d.value);
            });
        
    };



    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("Template: cleanUp");
        d3.select("#pieChart").remove();
    };

    return Visualisation;
    
});