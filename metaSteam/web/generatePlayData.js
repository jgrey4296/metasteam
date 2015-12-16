define(['underscore'],function(_){

    var randomInRange = function(min,max){
        return Math.random() * (max - min) + min;
    }

    var addHours = function(date,numOfHours){
        return new Date(date.getTime() + (numOfHours * 60 * 60 * 1000));
    }

    var randomDate = function(start,end){
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };


    var startDate = new Date("October 1, 2004");
    var now = new Date();
    
    var genData = function(data){
        data.forEach(function(game){
            game['__playHistory'] = [];
            var numOfHours = game['hours_forever'];
            while(numOfHours > 0){
                var thisPlayDuration = randomInRange(1,6);
                var b = randomDate(startDate,now);
                var c = addHours(b,thisPlayDuration);
                game['__playHistory'].push([b,c]);
                numOfHours -= thisPlayDuration;
            }

            game['__playHistory'].sort(function(d,e){
                return d[0].getTime() - e[0].getTime();
            });
        });
        return data;
    };

    return genData;
});
