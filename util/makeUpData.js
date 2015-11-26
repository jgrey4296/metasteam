#!/usr/bin/env node
//Using: http://weblog.west-wind.com/posts/2014/Jan/06/JavaScript-JSON-Date-Parsing-and-real-Dates
//and: http://stackoverflow.com/questions/9035627/elegant-method-to-generate-array-of-random-dates-within-two-dates
//and: http://stackoverflow.com/questions/1050720/adding-hours-to-javascript-date-object

var fs = require('fs');
var _ = require('underscore');

var randomInRange = function(min,max){
    return Math.random() * (max - min) + min;
}

var addHours = function(date,numOfHours){
    return new Date(date.getTime() + (numOfHours * 60 * 60 * 1000));
}

var randomDate = function(start,end){
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

//load the data
var data = require('../src/data/gameData.json');

console.log("Loaded file, keys are:",_.keys(data));

_.keys(data).forEach(function(key){
    console.log("In Key:",key," there are: ",_.keys(data[key]).length," games");
});

console.log("Making up data for play times");

//Generate duration pairs to fullfill the hours played, between a start date and now
var startDate = new Date("October 1, 2004");
var now = new Date();

console.log("Dates:",startDate,now);


data["profile"].forEach(function(game){
    game["__playHistory"] = [];

    //if the game has been played
    var numOfHours = game['hours_forever'];
    while(numOfHours > 0){
                var thisPlayDuration = randomInRange(1,6);
        //get a random time
        var b = randomDate(startDate,now);        
        //make a duration out of it
        var c = addHours(b,thisPlayDuration);
        game['__playHistory'].push([b,c]);

        numOfHours -= thisPlayDuration;
    }
    //sort by start point:
    game["__playHistory"].sort(function(d,e){
        return d[0].getTime() - e[0].getTime();
    });

    
});


//save the data:
fs.writeFile('./madeUpGameData.json',JSON.stringify(data,null,4));
