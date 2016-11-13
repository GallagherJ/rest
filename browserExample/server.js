
/*
  Noble-Sockets example
  
  This example uses Sandeep Mistry's noble library for node.js to
  create a central server that reads and connects to BLE peripherals 
  and sends this info to a browser with socket.io
  
  created 15 Jan 2015
  by Maria Paula Saba
*/


var s1= 'e015cf256310440098b0ca3f203bbcc0'
var s2= 'ddb67c0dd8ef4d60a99dd4c55047dc90'
var s3= 'c6e91981c4d14247b34c32c0c64ebf10'
var s4= 'c5da621e82a84ef09d5053eb03c37590'
var s5= '2f3ba1a8ff2547728e2c92b71e8d8103'


//importing node modules (libraries)
var noble = require('noble'),
	express = require('express'),
    http = require('http'),
    async = require('async'),
    open = require('open');
   SensorTag = require('sensortag');


// create a server calling the function onRequest
var app = express();
var server = http.createServer(app); 

// start the server 
server.listen(8080);
console.log('Server is listening to http://localhost on port 8080');
open("http://localhost:8080");

//read index.html page
app.use('/public/js', express.static(__dirname + '/public/js'));
app.use('/public/css', express.static(__dirname + '/public/css'));

app.get('/', function (request, response) {
  response.sendFile(__dirname + '/public/index.html');
});


//array to save all peripherals found
var peripherals = [];

//variable to save UUID for the connected peripheral
var connected = "";

//to save interval on reading RSSI
var RSSIinterval;

//Bluetooth ON or OFF
noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log("start scanning");
    noble.startScanning();
  } else {
    noble.stopScanning();
    console.log("stop scanning, is Bluetooth on?");
  }
});

//when discover new peripheral
noble.on('discover', function(peripheral) {
	var peripheralData = {
		"name": peripheral.advertisement.localName,
		"uuid": peripheral.uuid
	}


    //check if this peripheral has been found previously
    var newPeripheral = true;
    peripherals.forEach(function(element){
    	if(element.uuid === peripheral.uuid){
    		newPeripheral = false;
    	}
    });

    //if it is a new one
    if(newPeripheral){
		//save to array in server
		peripherals.push(peripheral);

		//send peripheral discovered to client
		io.sockets.emit('peripheral', peripheralData);
	}
});

//this function is called in the sockets part
function connectPeripheral(peripheral) {
	noble.stopScanning();

	//connect to peripheral
    peripheral.connect(function(error){
        console.log('connected to peripheral');  
        connected = peripheral.uuid;

		//log some data from it
		logData(peripheral);
		
		//read RSSI every 60 seconds
		RSSIinterval = setInterval(getRSSI, 60);  

		//callback function to once disconnect happens
		peripheral.once('disconnect', function() {
	 		console.log('peripheral disconneted');
	 		connected = "";
	 		clearInterval();
	        io.sockets.emit('disconnectedPeripheral', peripheral.uuid);
       		noble.startScanning();
		});
  	});
}


function logData(peripheral){
    var advertisement = peripheral.advertisement;
    var localName = advertisement.localName;
    var txPowerLevel = advertisement.txPowerLevel;
    var manufacturerData = advertisement.manufacturerData;
    console.log("Peripheral "+localName + " with UUID " + peripheral.uuid  + " connected");
    console.log("TX Power Level "+ txPowerLevel + ", Manufacturer "+ manufacturerData);

    var data = "Peripheral with name "+localName + " and UUID " + peripheral.uuid  + " has signal strenght (RSSI) of <span id='rssi'>"+ peripheral.rssi+".<span>" ;
    //<br/> TX Power Level "+ txPowerLevel + ", Manufacturer "+ manufacturerData;

    io.sockets.emit('dataLogged',data);
}



function getRSSI(peripheral){
	for (var i = 0; i < peripherals.length; i++){
		if(connected == peripherals[i].uuid){
						    var uuid = peripherals[i].uuid

				peripherals[i].updateRssi(function(error, rssi){
			      	//rssi are always negative values
			        if(rssi < 0) io.sockets.emit('rssi', {'rssi': rssi, 'uuid':uuid});
				});
		}
	}
}





// WebSocket Portion
var io = require('socket.io').listen(server);

// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function. This object has an id

	function (socket) {	
		//check if clients are connected
		console.log("We have a new client: " + socket.id);	

		socket.on('scan', function() {
			// Request to rescan
			peripherals = [];
 		    console.log("start scanning client");
			noble.startScanning();
		});
		
		socket.on('explorePeripheral', function(data) {
			//find the right peripheral to connect
			peripherals.forEach(function(element){
				if(element.uuid === connected){
					element.disconnect();
				}

		    	else if(element.uuid === data){
		    		connectPeripheral(element);
		    	}

	    	});


		});

		socket.on('disconnectPeripheral', function(data) {
			//find the right peripheral to disconnect
			peripherals.forEach(function(element){
		    	if(element.uuid === data){
		    		element.disconnect();
    			    console.log('peripheral disconnet requested by client');
		    	}
	    	});


		});


		socket.on('disconnect', function() {
			//check if clients have disconnected
			console.log("Client has disconnected");
			clearInterval(RSSIinterval);
       		noble.startScanning();
		});
	}
);

// listen for tags:

SensorTag.discoverById(s1, onDiscover1);
SensorTag.discoverById(s2, onDiscover2);
SensorTag.discoverById(s3, onDiscover3);
SensorTag.discoverById(s4, onDiscover4);
SensorTag.discoverById(s5, onDiscover5);

function onDiscover1(tag) {
  console.log('discovered: ' + tag.id + ', type = ' + tag.type);
 // when you disconnect from a tag, exit the program:
 tag.on('disconnect', function() {
     console.log('disconnected!');
     process.exit(0);
 });

 function connectAndSetUpMe() {          // attempt to connect to the tag
     console.log('connectAndSetUp');
     tag.connectAndSetUp(enableAccelMe);     // when you connect and device is setup, call enableAccelMe
   }

   function enableAccelMe() {        // attempt to enable the accelerometer
     console.log('enableAccelerometer');
     // when you enable the accelerometer, start accelerometer notifications:
     tag.enableAccelerometer(notifyMe);
   }

 function notifyMe() {
     tag.notifyAccelerometer(listenForAcc);      // start the accelerometer listener
     tag.notifySimpleKey(listenForButton);       // start the button listener
   }

   // When you get an accelermeter change, print it out:
 function listenForAcc() {
     tag.on('accelerometerChange', function(x, y, z) {
      // console.log('\tx = %d G', x.toFixed(1));
      // console.log('\ty = %d G', y.toFixed(1));
      // console.log('\tz = %d G', z.toFixed(1));
    });
 }

 // when you get a button change, print it out:
 function listenForButton() {
     tag.on('simpleKeyChange', function(left, right) {
         if (left) {
             console.log('left1: ' + left);
             io.sockets.emit('left1', 'left1');
         }
         if (right) {
             console.log('right1: ' + right);
             io.sockets.emit('right1', 'right1');
         }
         // if both buttons are pressed, disconnect:
         // if (left && right) {
         //  tag.disconnect();
         // }
    });
 }

 // Now that you've defined all the functions, start the process:
 connectAndSetUpMe();



}

function onDiscover2(tag) {
  console.log('discovered: ' + tag.id + ', type = ' + tag.type);
   console.log('discovered: ' + tag.id + ', type = ' + tag.type);
 // when you disconnect from a tag, exit the program:
 tag.on('disconnect', function() {
     console.log('disconnected!');
     process.exit(0);
 });

 function connectAndSetUpMe() {          // attempt to connect to the tag
     console.log('connectAndSetUp');
     tag.connectAndSetUp(enableAccelMe);     // when you connect and device is setup, call enableAccelMe
   }

   function enableAccelMe() {        // attempt to enable the accelerometer
     console.log('enableAccelerometer');
     // when you enable the accelerometer, start accelerometer notifications:
     tag.enableAccelerometer(notifyMe);
   }

 function notifyMe() {
     tag.notifyAccelerometer(listenForAcc);      // start the accelerometer listener
     tag.notifySimpleKey(listenForButton);       // start the button listener
   }

   // When you get an accelermeter change, print it out:
 function listenForAcc() {
     tag.on('accelerometerChange', function(x, y, z) {
      // console.log('\tx = %d G', x.toFixed(1));
      // console.log('\ty = %d G', y.toFixed(1));
      // console.log('\tz = %d G', z.toFixed(1));
    });
 }

 // when you get a button change, print it out:
 function listenForButton() {
     tag.on('simpleKeyChange', function(left, right) {
         if (left) {
             console.log('left2: ' + left);
             io.sockets.emit('left2', 'left2');
         }
         if (right) {
             console.log('right2: ' + right);
             io.sockets.emit('right2', 'right2');
         }
         // if both buttons are pressed, disconnect:
         // if (left && right) {
         //  tag.disconnect();
         // }
    });
 }

 // Now that you've defined all the functions, start the process:
 connectAndSetUpMe();


}

function onDiscover3(tag) {
  console.log('discovered: ' + tag.id + ', type = ' + tag.type);
  tag.on('disconnect', function() {
     console.log('disconnected!');
     process.exit(0);
 });

 function connectAndSetUpMe() {          // attempt to connect to the tag
     console.log('connectAndSetUp');
     tag.connectAndSetUp(enableAccelMe);     // when you connect and device is setup, call enableAccelMe
   }

   function enableAccelMe() {        // attempt to enable the accelerometer
     console.log('enableAccelerometer');
     // when you enable the accelerometer, start accelerometer notifications:
     tag.enableAccelerometer(notifyMe);
   }

 function notifyMe() {
     tag.notifyAccelerometer(listenForAcc);      // start the accelerometer listener
     tag.notifySimpleKey(listenForButton);       // start the button listener
   }

   // When you get an accelermeter change, print it out:
 function listenForAcc() {
     tag.on('accelerometerChange', function(x, y, z) {
      // console.log('\tx = %d G', x.toFixed(1));
      // console.log('\ty = %d G', y.toFixed(1));
      // console.log('\tz = %d G', z.toFixed(1));
    });
 }

 // when you get a button change, print it out:
 function listenForButton() {
     tag.on('simpleKeyChange', function(left, right) {
         if (left) {
             console.log('left3: ' + left);
             io.sockets.emit('left3', 'left3');
         }
         if (right) {
             console.log('right3: ' + right);
             io.sockets.emit('right3', 'right3');
         }
         // if both buttons are pressed, disconnect:
         // if (left && right) {
         //  tag.disconnect();
         // }
    });
 }

 // Now that you've defined all the functions, start the process:
 connectAndSetUpMe();

}

function onDiscover4(tag) {
  console.log('discovered: ' + tag.id + ', type = ' + tag.type);
  tag.on('disconnect', function() {
     console.log('disconnected!');
     process.exit(0);
 });

 function connectAndSetUpMe() {          // attempt to connect to the tag
     console.log('connectAndSetUp');
     tag.connectAndSetUp(enableAccelMe);     // when you connect and device is setup, call enableAccelMe
   }

   function enableAccelMe() {        // attempt to enable the accelerometer
     console.log('enableAccelerometer');
     // when you enable the accelerometer, start accelerometer notifications:
     tag.enableAccelerometer(notifyMe);
   }

 function notifyMe() {
     tag.notifyAccelerometer(listenForAcc);      // start the accelerometer listener
     tag.notifySimpleKey(listenForButton);       // start the button listener
   }

   // When you get an accelermeter change, print it out:
 function listenForAcc() {
     tag.on('accelerometerChange', function(x, y, z) {
      // console.log('\tx = %d G', x.toFixed(1));
      // console.log('\ty = %d G', y.toFixed(1));
      // console.log('\tz = %d G', z.toFixed(1));
    });
 }

 // when you get a button change, print it out:
 function listenForButton() {
     tag.on('simpleKeyChange', function(left, right) {
         if (left) {
             console.log('left4: ' + left);
             io.sockets.emit('left4', 'left4');
         };
         if (right) {
             console.log('right4: ' + right);
             io.sockets.emit('right4', 'right4');
         };
         // if both buttons are pressed, disconnect:
         // if (left && right) {
         //  tag.disconnect();
         // }
    });
 }

 // Now that you've defined all the functions, start the process:
 connectAndSetUpMe();

}

function onDiscover5(tag) {
  console.log('discovered: ' + tag.id + ', type = ' + tag.type);
  tag.on('disconnect', function() {
     console.log('disconnected!');
     process.exit(0);
 });

 function connectAndSetUpMe() {          // attempt to connect to the tag
     console.log('connectAndSetUp');
     tag.connectAndSetUp(enableAccelMe);     // when you connect and device is setup, call enableAccelMe
   }

   function enableAccelMe() {        // attempt to enable the accelerometer
     console.log('enableAccelerometer');
     // when you enable the accelerometer, start accelerometer notifications:
     tag.enableAccelerometer(notifyMe);
   }

 function notifyMe() {
     tag.notifyAccelerometer(listenForAcc);      // start the accelerometer listener
     tag.notifySimpleKey(listenForButton);       // start the button listener
   }

   // When you get an accelermeter change, print it out:
 function listenForAcc() {
     tag.on('accelerometerChange', function(x, y, z) {
      // console.log('\tx = %d G', x.toFixed(1));
      // console.log('\ty = %d G', y.toFixed(1));
      // console.log('\tz = %d G', z.toFixed(1));
    });
 }

 // when you get a button change, print it out:
 function listenForButton() {
     tag.on('simpleKeyChange', function(left, right) {
         if (left) {
             console.log('left5: ' + left);
             io.sockets.emit('left5', 'left5');
         }
         if (right) {
             console.log('right5: ' + right);
             io.sockets.emit('right5', 'right5');
         }
         // if both buttons are pressed, disconnect:
         // if (left && right) {
         //  tag.disconnect();
         // }
    });
 }

 // Now that you've defined all the functions, start the process:
 connectAndSetUpMe();

}

