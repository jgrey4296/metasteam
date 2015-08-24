/**visualises release dates of games across time
   EITHER: release dates [x] vs time played [y]
   OR: last played [x] across time played [y]
   OR: relase data [x] across category [y]x
   @module metasteamtimeline
*/

define(['d3','underscore'],function(d3,_){

    /**The main class
       @class Timeline
       @constructor
     */
    var Timeline = function(width,height,colours){
        this.width = width;
        this.height = height;
        this.colours = colours;
    };

    /**
       @method registerdata
    */
    Timeline.prototype.registerData = function(data){
        this.data = data;
    };

    /**
       @method draw
     */
    Timeline.prototype.draw = function(){


    };

    /**
       @method cleanUp
     */
    Timeline.prototype.cleanUp = function(){


    };

    return Timeline;
    
});
