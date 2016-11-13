//connect to server
var socket = io.connect('http://localhost:8080/');

//array of peripheral objects
var peripheralsList = [];





//when connect
socket.on('connect', function() {
	console.log("Connected");

});

// when receive a message
socket.on('peripheral', function(data) {

	if (typeof data.name ===  undefined ||
		typeof data.name ===  'undefined') {
		return;
	}




    
	document.getElementById('found').innerHTML ="Your Word is here!!";

    var newPeripheral = true;

    peripheralsList.forEach(function(element){
    	if(element.uuid === data.uuid){
    		newPeripheral = false;
    	}
    });





    // Taking only Sensor Tag
    if(newPeripheral && data.name == "SensorTag"){
	//display in HTML
	var Pdiv= document.createElement('div');
	Pdiv.className= 'peripheralDiv btn';
	Pdiv.setAttribute('id', data.uuid);
	var Pname = document.createElement('p');
	// Pname.innerHTML = word//data.name+'<br/><span> UUID: '+data.uuid+'</span>'+ word;
    console.log(data);


 





	//attach event listener to the peripheral divs
	// Pdiv.addEventListener("click", explore);
	// Pdiv.appendChild(Pname);
	// document.getElementById('peripherals').appendChild(Pdiv);
	
    data["connected"] = false;

	//save to the peripherals array
	peripheralsList.push(data);
    }
});






socket.on('disconnectedPeripheral', function(data){
    document.getElementById('explore').innerHTML = "";

	peripheralsList.forEach(function(element){
    	if(element.uuid === data){
    		document.getElementById(data).style.backgroundColor = "#FFF";
    		element.connected = false;
    	}




    });
 });

socket.on('dataLogged', function(data){
	document.getElementById('explore').innerHTML = word;
        console.log(word);
 });











var words = ["A", "B", "C", "D", "E"];

function getRandomWord() {
    i =words.splice(Math.random()*words.length,1)[0];
    return i;
    
};

var words2 = ["S", "T", "U", "V", "W"];

function getRandomWord2() {
    i =words2.splice(Math.random()*words.length,1)[0];
    return i;

};



var a = 'true';
var b = 'true';
var c = 'true';
var d = 'true';
var e = 'true';
var f = 'true';
var g = 'true';
var h = 'true';

var j = 'true';
var k = 'true';



socket.on('left1', function(data){
    if(a == 'true'){
    document.getElementById('left').innerHTML = 
    document.getElementById('left').innerHTML + "<div id=newWord>" + getRandomWord() + "</div>";
    console.log(data);

    a = 'false';
} 
});

socket.on('left2', function(data){
    if(b == 'true'){
    document.getElementById('left').innerHTML = 
    document.getElementById('left').innerHTML + "<div id=newWord>" + getRandomWord() + "</div>";        
    console.log(data);

    b = 'false';
}
 });

socket.on('left3', function(data){
    if(c == 'true'){
    document.getElementById('left').innerHTML = 
    document.getElementById('left').innerHTML + "<div id=newWord>" + getRandomWord() + "</div>";
    console.log(data);
    c = 'false';
}
 });

socket.on('left4', function(data){
    if(d == 'true'){
    document.getElementById('left').innerHTML = 
    document.getElementById('left').innerHTML + "<div id=newWord>" + getRandomWord() + "</div>";        
    console.log(data);
    d = 'false';
}
 });

socket.on('left5', function(data){
    if(e == 'true'){
    document.getElementById('left').innerHTML = 
    document.getElementById('left').innerHTML + "<div id=newWord>" + getRandomWord() + "</div>";        
    console.log(data);
    e = 'false';
}
 });

socket.on('right1', function(data){
    if(f == 'true'){
    document.getElementById('right').innerHTML = 
    document.getElementById('right').innerHTML + "<div id=newWord2>" + getRandomWord2() + "</div>";
    console.log(data);
    f = 'false';
}
 });

socket.on('right2', function(data){
    if(g == 'true'){
    document.getElementById('right').innerHTML = 
    document.getElementById('right').innerHTML + "<div id=newWord2>" + getRandomWord2() + "</div>";        
    console.log(data);
    g = 'false';
}
 });

socket.on('right3', function(data){
    if(h == 'true'){
    document.getElementById('right').innerHTML = 
    document.getElementById('right').innerHTML + "<div id=newWord2>" + getRandomWord2() + "</div>";        
    console.log(data);
    h = 'false';
} 
});

socket.on('right4', function(data){
    if(k == 'true'){
    document.getElementById('right').innerHTML = 
    document.getElementById('right').innerHTML + "<div id=newWord2>" + getRandomWord2() + "</div>";        
    console.log(data);
    k = 'false';
}  

});

socket.on('right5', function(data){
    if(j == 'true'){
    document.getElementById('right').innerHTML = 
    document.getElementById('right').innerHTML + "<div id=newWord2>" + getRandomWord2() + "</div>";        
    console.log(data);
    j = 'false';
} 
});



function explore(){
	var Pdiv = this;
	var peripheral;

    peripheralsList.forEach(function(element){
    	if(element.uuid === Pdiv.id){
    		peripheral = element;
    		peripheral.connected = !peripheral.connected;		
    	}
    });

    if(peripheral.connected === true){
		this.style.backgroundColor = "#9ed1f0";
		socket.emit('explorePeripheral', peripheral.uuid);

		 document.getElementById('explore').innerHTML = "<p>Trying to connect to "+peripheral.name+"</p>";
        


    }
    else{
		this.style.backgroundColor = "#999";
		socket.emit('disconnectPeripheral', peripheral.uuid);
		document.getElementById('explore').innerHTML = "<p>Trying to disconnect from "+peripheral.name+"</p>";

    }
}











function requestScan(){
	//empty peripherals list
	peripheralsList = [];
    document.getElementById('found').innerHTML ="";

	var Plist = document.getElementById('peripherals');
	while (Plist.hasChildNodes()) {   
    	Plist.removeChild(Plist.firstChild);
	}

	//ask for scanning
	socket.emit('scan');
}

var init = function(){	
	document.getElementById('scan').addEventListener("click", requestScan);
	//connectAndSetUpMe();
}






