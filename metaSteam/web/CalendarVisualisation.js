/**
   @class CalendarVisualisation
   @purpose displays play history as a calendar
   @requiredMethod registerData
   @requiredMethod draw
   @requiredMethod cleanUp
*/

define(['d3','underscore','./generatePlayData'],function(d3,_,genData){

    /**The main class
       @class CalendarVisualisation
       @constructor
     */
    var Visualisation = function(hub){
        this.hub = hub;
        this.width = this.hub.internalWidth;
        this.height = this.hub.internalHeight;
        this.colours = this.hub.colours;

        this.helpText = [
            "Calendar visualisation",
            "Uses MADE UP DATA (because steam doesnt track it)",
            "Draws a year at a time, showing when each game was played"

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

        //array of lengths for each month
        this.monthLengths = [
            ["jan",31],["feb",28],["mar",31],["apr",30],["may",31],["jun",30],
            ["jul",31],["aug",31],["sep",30],["oct",31],["nov",30],["dec",31]
        ];

        this.priorDrawn = 0;
        
    };

    /**
       @method registerdata
    */
    Visualisation.prototype.registerData = function(data){
        console.log("Template: Registering Data");
        this.data = data;

        //if the data doesnt contain play data, generate it:
        var gameKeys = data.profile.reduce(function(m,game){
            _.keys(game).forEach(function(k){
                if(!m.has(k)) m.add(k);
            });
            return m;
        },new Set());

        //If theres no play history data, make it up for the moment:
        if(!gameKeys.has('__playHistory')){
            alert("Generating play data because none exists");
            this.data.profile = genData(this.data.profile);
        }
        
        //group all games in your profile by the dates played
        this.groupedByDate = this.groupByDate(this.data.profile);
        console.log("Grouped By Date: ",this.groupedByDate);

        //sort the date keys
        var sortedDates = _.keys(this.groupedByDate).sort(function(a,b){
            return new Date(a) - new Date(b);
        });
        console.log("Sorted Dates:",sortedDates);
        
        //get the bounds
        this.earliest = new Date(sortedDates[0]);
        this.latest = new Date(sortedDates[sortedDates.length-1]);
        console.log("Bounds:",this.earliest,this.latest);
        
        //Create a list of arrays representing each year
        //create the empty years
        var noOfYears = this.latest.getYear()-this.earliest.getYear() + 1;
        var yearList = this.generateYearArray(noOfYears);

        //put each entry from groupedByDate into the simpleDateList
        sortedDates.forEach(function(d){
            var dateGroup = this.groupedByDate[d];
            var posTriple = this.dateToIndex(d);
            yearList[posTriple[0]][posTriple[1]][posTriple[2]] = dateGroup;
        },this);

        this.dateArray = yearList;
        console.log("Final Date Array:",this.dateArray);

        this.monthWidth = this.width - 20;
        this.dayWidth = this.monthWidth / 32;

        this.drawAvailableYears();
        
    };

    /**
       @method draw
     */
    Visualisation.prototype.draw = function(yearNum){
        this.cleanupDrawn();
        if(yearNum === undefined) yearNum = this.dateArray.length-1;
        this.priorDrawn = yearNum;
        var vRef = this;
        
        console.log("Template: Drawing");
        //create the main element:
        var calendar = d3.select("#mainVisualisation").append("g")
            .attr("id","calendar");
        //bind the month data for specified year:
        //console.log("Binding:",this.dateArray[yearNum]);
        var months = calendar.selectAll('.month').data(this.dateArray[yearNum],function(d,i){ return i;});
        //add each month
        months.enter().append("g")
            .classed("month",true)
            .attr("transform",function(d,i){
                return "translate(" + 10 + "," + (i * 30) + ")";
            });

        //bind day data to groups
        var days = months.selectAll(".days").data(function(d,i){
            return d; });
        //add each day
        days.enter().append("g")
            .classed("days",true)
            .attr("transform",function(d,i){
                return "translate(" + (i * vRef.dayWidth) + ",0)";
            })
            .on("mouseover",function(d,i){
                console.log("Moused over:",d);
            });


        
        //draw each day
        days.append("rect")
            .attr("width",(vRef.dayWidth - 5))
            .attr("height",25)
            .style("fill",function(d,i){
                var colour = vRef.colours.darkBlue;
                if((i+1)%7 === 0 || (i+1)%7 === 1){
                    colour = vRef.colours.lightBlue;
                }                
                if(d.length > 0){
                    colour = vRef.colours.green;
                }
                return colour;
            });

    };

    /**
       @method cleanupDrawn
    */
    Visualisation.prototype.cleanupDrawn = function(){
        d3.select("#calendar").remove();
    };
    
    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("Template: cleanUp");
        d3.select("#calendar").remove();
        d3.select("#availableYears").remove();
    };

    /**
       @method groupByDate
     */
    Visualisation.prototype.groupByDate = function(array){
        //fold all games into an object where:
        //keys=dates and values=[games]
        var grouped = array.reduce(function(m,v){
            var playRecord = v.__playHistory;
            if(playRecord === undefined) return m;
            playRecord.forEach(function(d){
                var date = new Date(d[0]).toDateString();
                if(m[date] === undefined) m[date] = [];
                m[date].push(v);
            });
            return m;
        },{});
        return grouped;
    };

    /**
       @method dateToIndex
       @returns [yearIndex,monthIndex,dayIndex]
     */
    Visualisation.prototype.dateToIndex = function(dateString){
        if(!dateString) return [0,0,0];
        var date = new Date(dateString);
        var yearIndex = (date.getYear() - this.earliest.getYear());
        var monthIndex = date.getMonth();
        return [yearIndex,monthIndex,date.getDate()];
    };

    /**
       @method generateYearArray
     */
    Visualisation.prototype.generateYearArray = function(noOfYears){
        var yearList = [];
        //generate each year
        console.log("Generating years:",noOfYears);
        for(var i=0; i<noOfYears; i++){
            yearList.push([]);
        };
        yearList.forEach(function(d){
            //generate the month
            for(var j=0; j<12; j++){
                d.push([]);
                //generate the days:
                for(var k=0; k<this.monthLengths[j][1]; k++){
                    d[j].push([]);
                }
            }
        },this)
        return yearList;
    };

    /**
       @method drawAvailableYears
       @purpose draw buttons for each potential year that can be viewed
     */
    Visualisation.prototype.drawAvailableYears = function(){
        var vRef = this;
        var availableYearGroup = d3.select("#leftBar").append("g")
            .attr("id","availableYears")
            .attr("transform","translate(" + (this.hub.sideBarWidth * 0.25)
                  + "," + 50 + ")");

        var years = availableYearGroup.selectAll(".year").data(this.dateArray);
        //add years:
        years.enter().append("g")
            .classed("year",true)
            .attr("transform",function(d,i){
                return "translate(20,"+ (i * 40) + ")";
            });

        years.append("rect")
            .attr("width",this.hub.sideBarWidth * 0.5)
            .attr("height",35);

        years.append("text")
            .style("text-anchor","middle")
            .attr("transform","translate("+(this.hub.sideBarWidth*0.25)
                  +"," + (35 * 0.5) + ")")
            .text(function(d,i){
                return vRef.earliest.getFullYear() + i;
            })
            .style("fill","white");

        years.on("click",function(d,i){
            vRef.draw(i);
        })
            .on("mouseover",function(d,i){
                var temp = vRef.priorDrawn;
                vRef.draw(i);
                vRef.priorDrawn = temp;
            })
            .on("mouseout",function(d,i){
                vRef.draw(vRef.priorDrawn);
            });
        
        
    };
    
    
    return Visualisation;
    
});
