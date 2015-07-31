//Utility functions for javascript:
define([],function(){

function epochToTime(epoch){

// create a new javascript Date object based on the timestamp
// multiplied by 1000 so that the argument is in milliseconds, not seconds
var date = new Date(unix_timestamp*1000);
// hours part from the timestamp
var hours = date.getHours();
// minutes part from the timestamp
var minutes = "0" + date.getMinutes();
// seconds part from the timestamp
var seconds = "0" + date.getSeconds();

// will display time in 10:30:23 format
    var formattedTime = hours + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);

}

//Function to get the max from an array of objects,
//for a particular field
function maxOfProperty(dataArray,property){
  var propertyArray = [];
  for(var i in dataArray){
    if(dataArray.hasOwnProperty(i) &&
       dataArray[i].hasOwnProperty(property)){
      propertyArray.push(dataArray[i][property]);
    }
  }
  return Math.max.apply(Math,propertyArray);
}


//Take an object with fields
//Convert each field + value into an object
//return as array
function objToArrOfFields(d){
  var outputArray = [];
  for (var i in d){
    if(d.hasOwnProperty(i)){
      var tempObj = {};
      tempObj['name'] = i;
      tempObj['items'] = d[i];
      outputArray.push(tempObj);
    }
  }
  return outputArray;
}
  return {
    "eToTime" : epochToTime,
    "maxOfProperty" : maxOfProperty,
    "objToArrOfFields" : objToArrOfFields,
  };

}
