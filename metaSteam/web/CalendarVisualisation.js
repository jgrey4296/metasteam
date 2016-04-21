/**
   @class CalendarVisualisation
   @purpose displays play history as a calendar
   @requiredMethod registerData
   @requiredMethod draw
   @requiredMethod cleanUp
*/

define(['d3','lodash','./generatePlayData'],function(d3,_,genData){

    /**
       @class CalendarVisualisation
       @constructor
       @purpose The main class
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
       @purpose groups games by dates for visualisation
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


        
    };

    /**
       @method draw
       @purpose Draws available years in the left bar, draws a month/day matrix of a year, showing when games were played
     */
    Visualisation.prototype.draw = function(yearNum){
        this.cleanupDrawn();
        

        if(yearNum === undefined) {
            yearNum = this.dateArray.length-1;
            this.drawAvailableYears();
        }
        this.priorDrawn = yearNum;
        var vRef = this;

        //calculate height:
        var monthHeight = ((this.hub.internalHeight - 40) * 0.5) / 12,
            monthPad = 5,
            xPad = 10,
            infoY = (this.hub.internalHeight * 0.5) + (12 * monthPad),
            infoWidth = (this.hub.internalWidth - (xPad * 4)),
            infoHeight = ((this.hub.internalHeight - (monthPad * 12)) - 400);
        
        
        console.log("Template: Drawing");
        //create the main element:
        var calendar = d3.select("#mainVisualisation").append("g")
            .attr("id","calendar").attr("transform","translate(10,20)");
        //bind the month data for specified year:
        //console.log("Binding:",this.dateArray[yearNum]);
        var months = calendar.selectAll('.month').data(this.dateArray[yearNum],function(d,i){ return i;});
        //add each month
        months.enter().append("g")
            .classed("month",true)
            .attr("transform",function(d,i){
                return "translate(" + xPad + "," + (i * (monthHeight + monthPad) ) + ")";
            }).each(function(d,i){
                var curMonth = d3.select(this);
                var days = curMonth.selectAll(".days").data(function(e,j){
                    return e;
                });

                //add each day
                days.enter().append("g")
                    .classed("days",true)
                    .attr("transform",function(e,j){
                        return "translate(" + (j * vRef.dayWidth) + ",0)";
                    })
                    .on("mouseover",function(e,j){
                        var curDate = new Date(vRef.earliest.getFullYear() + yearNum,i,j+1);
                        console.log("Making date:",vRef.earliest.getFullYear() +yearNum,i,j+1);
                        //todo: draw game information, with details of how long played
                        if(e.length > 0){
                            drawDayInfo(vRef,curDate,e);
                        }
                    })
                    .on("mouseout",function(e,j){
                        //d3.select("#dayInfo").remove();
                        d3.select("#dayInfo").attr("visibility","hidden");
                    });
                                
                //draw each day
                days.append("rect")
                    .attr("width",(vRef.dayWidth - 5))
                    .attr("height",monthHeight)
                    .style("fill",function(e,j){
                        var colour = vRef.colours.darkBlue;
                        var curDate = new Date(yearNum,i,j);
                        if(curDate.getDay() === 6 || curDate.getDay() === 0){
                            colour = vRef.colours.lightBlue;
                        }                        
                        if(e && e.length > 0){
                            colour = vRef.colours.green;
                        }
                        return colour;
                    });
                
            });

    };

    /**
       @method cleanupDrawn
    */
    Visualisation.prototype.cleanupDrawn = function(){
        d3.select("#calendar").remove();
        d3.select("#dayInfo").remove();
    };
    
    /**
       @method cleanUp
     */
    Visualisation.prototype.cleanUp = function(){
        console.log("Calendar: cleanUp");
        d3.select("#calendar").remove();
        d3.select("#availableYears").remove();
        d3.select("#dayInfo").remove();
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
        return [yearIndex,monthIndex,date.getDate() - 1];
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
                for(var k=1; k<=this.monthLengths[j][1]; k++){
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
            availableYearGroup.selectAll("rect").transition()
                .style("fill",function(e,i){
                    if(d === e) return "green";
                    return "black";
                });
            vRef.draw(i);
        })
            .on("mouseover",function(d,i){
                console.log("Mouseover:",i);
                availableYearGroup.selectAll("rect").transition()
                    .style("fill",function(e,i){
                        if(d === e) return "green";
                        return "black";
                    })
                var temp = vRef.priorDrawn;
                vRef.draw(i);
                vRef.priorDrawn = temp;
            })
            .on("mouseout",function(d,i){
                availableYearGroup.selectAll("rect").transition()
                    .style("fill",function(e,i){
                        if(i === vRef.priorDrawn) return "green";
                        return "black";
                    });
                vRef.draw(vRef.priorDrawn);
            });
        
        
    };

    var drawDayInfo = function(vRef,date,gameArray){
        //calculations
        var monthPad = 5,
            xPad = 10,
            infoY = (vRef.hub.internalHeight * 0.5) + (12 * monthPad),
            infoWidth = (vRef.hub.internalWidth - (xPad * 4)),
            infoHeight = ((vRef.hub.internalHeight - (monthPad * 12)) - 400),
            midPoint = infoWidth * 0.5,
            nodeHeight = (infoHeight - 40) / gameArray.length;
        

        console.log("Date:",date);
        console.log("Games:",gameArray);
        //setup the info group
        var dayInfo = d3.select("#dayInfo");
        if(dayInfo.empty()){
            dayInfo = d3.select("#mainVisualisation").append("g")
                .attr("id","dayInfo")
                .attr("transform","translate(" + (xPad * 2) + "," + infoY + ")");
            
            dayInfo.append("rect")
                .attr("height",infoHeight)
                .attr("width",infoWidth)
                .style("fill",vRef.colours.lightBlue);

            dayInfo.append("text").attr("id","dayInfoDateText")
                .attr("transform","translate(" + midPoint + ",30)")
                .text("default")
                .style("text-anchor","middle");

            dayInfo.append("g").attr("id","gamesPlayed")
                .attr("transform","translate(" + xPad + ",40)");
        }

        dayInfo.attr("visibility","visible");
        //update the info group
        
        //update the date text
        d3.select("#dayInfoDateText").text(date.toDateString());
        //draw the games
        var gamesPlayed = d3.select("#gamesPlayed");
        var bound = gamesPlayed.selectAll("g").data(gameArray,function(d){ return d.appid; });
        bound.exit().remove();
        
        var enter = bound.enter().append("g");
        enter.append("rect")
            .attr("width",infoWidth * 0.5)
            .attr("height",nodeHeight * 0.9);
        enter.append("text")
            .style("fill","white")
            .attr("transform","translate(" + (xPad * 2) + "," + (nodeHeight * 0.5) + ")");

        gamesPlayed.selectAll("g")
            .attr("transform",function(d,i){
                return "translate(" + xPad +"," + (i * nodeHeight) + ")";
            });

        gamesPlayed.selectAll("text")
            .text(function(d){
                return d.name;
            });

    };

    var calculateLengthOfPlay = function(date,game){
        //get the play pair
        var playPair,dateOne,dateTwo,
            matchYears = game.__playHistory.filter(function(d){
                return d[0].getYear() === date.getYear();
            }),
            matchMonth = matchYears.filter(function(d){
                return d[0].getMonth() === date.getMonth();
            }),
            matchDay = matchMonth = filter(function(d){
                return d[0].getDay() === date.getDay();
            });

        if(matchDay.length === 0) return -1;

        playPair = matchDay[0];
        dateOne = new Date(playPair[0]);
        dateTwo = new Date(playPair[1]);
                
        //subtract larger from smaller
        var milliseconds = dateOne - dateTwo,
            seconds = milliseconds / 1000,
            minutes = seconds /60,
            hours = minutes / 60;
        
        return hours;
    };

    
    return Visualisation;
    
});
