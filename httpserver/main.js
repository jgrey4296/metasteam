function sendGET(){
    console.log("Sending Get");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        if (request.readyState === 4){
            var result = request.responseText;
            console.log(result);
        }
    };
    request.open("GET","_startGame",true);
    request.send();
}

function sendPOST(){
    console.log("Sending POST");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        if (request.readyState === 4){
            var result = request.responseText;
            console.log(result);
        }
    };
    request.open("POST","_data",true);
    request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    request.send("testName=blah&somethingElse=Bloo")

    
}
