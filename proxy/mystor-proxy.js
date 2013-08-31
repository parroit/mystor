var express = require('express');
var app = express();

app.use(express.bodyParser({
    keepExtensions: true,
    limit: 10000000000, // 10G limit
    defer: true
}));

app.options('/upload', function(req, res){

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With,X-Token,X-Id");
    res.end();
});

app.post('/upload', function(req, res){

    var Firebase = require('firebase');
    var mystorRoot = new Firebase('https://mystor.firebaseio.com/');
    var token = req.headers['x-token'];
    mystorRoot.auth(token, function(error) {
        var auth = JSON.parse(new Buffer(token.split('.')[1], 'base64').toString('binary'));

        var newFile = mystorRoot.child("files").child(auth.d.id+'@'+auth.d.provider).child( req.headers['x-id']);

        res.setHeader("Access-Control-Allow-Origin", "*");
        if(error) {

            res.send("UPLOAD FAILED:" + error);
        } else {
            req.form.on('progress', function(bytesReceived, bytesExpected) {
                var percent = ((bytesReceived / bytesExpected) * 100).toFixed(1);

                var status = "uploading "  + percent + "%";
                newFile.child("status").set(status);
            });
            req.form.on('end', function(bytesReceived, bytesExpected) {


                var fileName = req.files.file.name;
                var fileSize = req.files.file.size;



                var fs = require("fs");
                var source = fs.createReadStream(req.files.file.path);
                var dest = fs.createWriteStream('tmp/'+fileName);

                var totalLength= fileSize;
                source.pipe(dest);
                var received = 0;
                source.on('data', function(chunk){
                    received += chunk.length;
                    var percent = ((100 *received) / fileSize).toFixed(1);

                    var status = "storing " + percent + "%";
                    newFile.child("status").set(status);
                });


                source.on('end', function() {
                    res.send(fileName +" successfully uploaded.");

                    var status = "Successfully";
                    newFile.child("status").set(status);
                    mystorRoot.unauth();
                });
                source.on('error', function(error) {
                    res.send("UPLOAD FAILED:" + error);
                });
            });





        }




    });




});


app.listen(3000);
console.log('Listening on port 3000');