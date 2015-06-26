var express = require('express');
var mysql = require('mysql');
var PDF = require('pdfkit');
var fs = require('fs');

var app = express();

var maxObjTime = 10;
var maxSubjTime = 10;
var objRange = 5;
var subjRange = 5;

var connection = mysql.createConnection({
	host		:	'localhost',
	user		:	'root',
	password	:	'root',
	database	:	'quesDB'
});


function createArray( quesCount, totalTime, maxQuesTime, relaxation ){
	var array = [];
	for(var i=0; i<maxQuesTime; i++)
		array.push(0);	//initialize array
	
	var sum=0;
	for(var i=0; i<quesCount; i++){
		var ind = Math.floor(Math.random() * maxQuesTime); // index 0 to (maxQuesTime-1)
		array[ind] = array[ind]+1;
		sum = sum + (ind+1);	//sum is total duration of all selected questions
	}
	//minimum question time is 1.
	
	while( Math.abs(sum-totalTime) > relaxation ){
		i = maxQuesTime-1;
		while(array[i]==0)
			i--;
		if(i==0)
			break;
		array[i] = array[i]-1;
		array[0] = array[0]+1;
		
		sum = sum-i;
	}
	return array;
}


function editPDF(){
	var count=0;
	for(var i=0; i<maxSubjTime; i++){
		
		var query_string = "select * from subQues where time = "+ (i+1) +" order by rand() limit "+ subjArray[i];
		
		connection.query(query_string,function(err, rows, fields){
			
			if(err) throw err;
			
			for(var j=0; j<rows.length ; j++){
				var str = rows[j].data + " having duration of " + rows[j].time + " minutes\n";
				doc.text(str.toString());
			}
			
			count++;
			if(count==maxSubjTime)	//query is asynchronus, end connection when last callback executes
			{
				doc.end();
				connection.end();
	
				var html = "<form action='http://127.0.0.1:5000/av_downloads' method='GET'>"+
				"<input type='submit' value='Generate Quesion Paper'>"+
				"</form>";
	
				res.send(html);
				res.end();
			}
		});
	}
}



app.get('/', function (req, res) {
	var path = __dirname + "/" + "front2.html";
	res.sendFile(path);
});


app.get('/av_myaction', function(req,res){
	var response = { objCount : Number(req.query.objCount), objTime : Number(req.query.objTime), subjCount : Number(req.query.subjCount), subjTime : Number(req.query.subjTime) };
	
	//PERFORM SERVER-SIDEVALIDATION
	
	var objArray = createArray( response.objCount, response.objTime, maxObjTime, objRange );
	var subjArray = createArray( response.subjCount, response.subjTime,  maxSubjTime, subjRange);
	
	
	connection.connect();
	doc = new PDF();
	doc.pipe( fs.createWriteStream('QPaper.pdf') );
	
	editPDF();
	editPDF();
});

app.get('/av_downloads',function(req,res){
	var path = __dirname + "/" + "QPaper.pdf";
	res.setHeader('Content_Type','application/pdf');
	//res.sendFile(path);
	res.download(path);
});


var server = app.listen(5000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});

