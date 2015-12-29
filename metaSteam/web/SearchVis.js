/**
   @class TemplateVisualisation
   @purpose Demonstrates the basic structure of a visualisation
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
        this.width = this.hub.internalWidth;
        this.height = this.hub.internalHeight;
        this.colours = this.hub.colours;

        this.helpText =[
            "Template visualisation"

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
        console.log("Template: Registering Data");
        this.data = data;
        

        
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(){
        console.log("Template: Drawing");

        //add a text bar, display names that match the typed regex
        
    };



    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("Template: cleanUp");
        d3.select("#mainVisualisation").selectAll().remove();
    };

    return Visualisation;
    
});
