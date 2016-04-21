/**
   @class CoOccurenceMatrix
   @purpose Draws a matrix of tag cooccurences
   @requiredMethod registerData
   @requiredMethod draw
   @requiredMethod cleanUp
*/

define(['d3','lodash'],function(d3,_){

    /**The main class
       @class CoOccurenceMatrix
       @constructor
     */
    var Visualisation = function(hub){
        this.hub = hub;
        this.width = this.hub.internalWidth;
        this.height = this.hub.internalHeight;
        this.colours = this.hub.colours;

        this.helpText = [
            "Cooccurrence matrix of tags",
            "WILL LAG THE WEB PAGE",
            "Displays a co-occurrence matrix of ALL tags for INSTALLED games",
            "This gets big"

        ];
        
        //Colours scaling
        this.scaleToColours = d3.scale.linear()
            .domain([0,100])
            .rangeRound([0,20]);
        this.colourScale = d3.scale.category20b();

        //Function to get a colour from a value
        this.oneOf20Colours = function(val){
            return this.colourScale(this.scaleToColours(val));
        };
        
    };

    /**
       @method registerdata
    */
    Visualisation.prototype.registerData = function(data){
        console.log("Matrix: Registering Data");
        this.data = data;

        //get all the tags
        var allTags = Array.from(_.values(this.data.installed).reduce(function(m,v){
            if(v.__tags === undefined) return m;
            v.__tags.forEach(function(d){
                if(!m.has(d)) m.add(d);
            });
            return m;
        },new Set()));

        //populate the adjacency list:
        this.adjacencyMatrix = allTags.reduce(function(m,v){
            m[v] = {};
            allTags.forEach(function(d){
                m[v][d] = 0;
            });
            return m;
        },{});

        //increase counts by game:
        //foreach game
        _.values(this.data.installed).forEach(function(d){
            if(d.__tags === undefined) return;
            //foreach tag
            d.__tags.forEach(function(v){
                var current = this.adjacencyMatrix[v];
                //fold increment tags
                this.adjacencyMatrix[v] = d.__tags.reduce(function(m,v1){
                    m[v1] += 1;
                    return m;
                },current);
            },this);
        },this);

        //filter the matrix down here:

        
        console.log("All Tags length:",allTags.length);
        console.log(this.adjacencyMatrix);

        this.cellWidth = (this.width - 20) / allTags.length;
        this.cellHeight = (this.height - 20) / allTags.length;

        console.log("cell dimensions:",this.cellWidth,this.cellHeight);
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(){
        var vRef = this;
        console.log("Adjacency Matrix Drawing");
        var coMatrix = d3.select("#mainVisualisation").append("g")
            .attr("id","coMatrix");

        var columns = coMatrix.selectAll(".column").data(_.values(this.adjacencyMatrix));
        columns.enter().append("g")
            .classed("column",true)
            .attr("transform",function(d,i){
                return "translate(10," + ((i * vRef.cellHeight) + 2) + ")";
            })
            .on("mouseover",function(d,i){
                console.log("MouseOver:",d);
            });

        // columns.append("rect")
        //     .attr("width",200)
        //     .attr("height",this.cellHeight)
        //     .style("fill",function(d,i){
        //         return vRef.oneOf20Colours(i);
        //     });

        var cells = columns.selectAll(".cell").data(function(d){
            return _.values(d);
        });

        cells.enter().append("g")
            .classed("cell",true)
            .attr("transform",function(d,i){
                return "translate(" + (i * vRef.cellWidth) + ",0)";
            });
        
        cells.append("rect")
            .attr("width",vRef.cellWidth)
            .attr("height",vRef.cellHeight)
            .style("fill",function(d,i){
                if(d === 0) return "black";
                return vRef.oneOf20Colours(d);
            });
                
    };



    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("Matrix: cleanUp");
        d3.select("#coMatrix").remove();
    };

    return Visualisation;
    
});
