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

function moveFile(res,sourcePath, targetPath, sourceFileSize,metaFile,metaFilesRoot) {
    var fs = require("fs");

    var source = fs.createReadStream(sourcePath);

    var dest = fs.createWriteStream(targetPath);


    source.pipe(dest);
    var received = 0;
    source.on('data', function (chunk) {
        received += chunk.length;
        var percent = ((100 * received) / sourceFileSize).toFixed(1);

        setStatus("Storing",metaFile,percent);
    });


    source.on('end', function () {
        var status = "Idle";
        setStatus(status,metaFile);
        reportResult(status,res,metaFilesRoot);
    });
    source.on('error', function (error) {

        var status = "Error";
        setStatus(status,metaFile);
        reportResult(status,res,metaFilesRoot);
    });
}

function serveFile(res,filePath, fileSize,metaFile,metaFilesRoot) {
    var fs = require("fs");

    var source = fs.createReadStream(filePath);

    var dest = res.outputStream;


    source.pipe(dest);
    var received = 0;
    source.on('data', function (chunk) {
        received += chunk.length;
        var percent = ((100 * received) / sourceFileSize).toFixed(1);

        setStatus("Downloading" ,metaFile,percent);
    });


    source.on('end', function () {
        var status = "Idle";
        setStatus(status,metaFile);
        reportResult(status,res,metaFilesRoot);
    });

    source.on('error', function (error) {
        console.log(error);
        var status = "Error";
        setStatus(status,metaFile);
        reportResult(status,res,metaFilesRoot);
    });
}


function setStatus(status,metaFile,progress) {
    progress = progress || 0;
    metaFile.child("status").set(status);
    metaFile.child("progress").set(progress);

}

function reportResult(result,res,metaFilesRoot) {
    res.send(result);
    metaFilesRoot.unauth();
}
function addFileToStorage(res,sourceFile,metaFile,metaFilesRoot) {
    var sourceFileName = sourceFile.name;
    var sourceFileSize = sourceFile.size;


    var sourcePath = sourceFile.path;
    var targetPath = 'tmp/' + sourceFileName;

    moveFile(res,sourcePath, targetPath, sourceFileSize,metaFile,metaFilesRoot);
}


function loadFromStorage(error,metaUser,metaFilesRoot,res,req) {
    var metaExistentFile = metaFilesRoot.child("files").child(metaUser.d.id + '@' + metaUser.d.provider).child(req.headers['x-id']);
    if (error) {
        reportResult("Load from storage failed:" + error,res,metaFilesRoot)

    } else {
        var fileSize = metaExistentFile.size;
        var filePath = 'tmp/' + metaExistentFile.name;

        serveFile(filePath, fileSize,metaExistentFile,metaFilesRoot);
    }

}
function saveToStorage(error,metaUser,metaFilesRoot,res,req) {
    var metaNewFile = metaFilesRoot.child("files").child(metaUser.d.id + '@' + metaUser.d.provider).child(req.headers['x-id']);


    if (error) {
        reportResult("Save to storage failed:" + error,res,metaFilesRoot)

    } else {
        req.form.on('progress', function (bytesReceived, bytesExpected) {
            var percent = ((bytesReceived / bytesExpected) * 100).toFixed(1);

            setStatus("Uploading",metaNewFile,percent)
        });

        req.form.on('end', function () {


            var sourceFile = req.files.file;
            addFileToStorage(res,sourceFile,metaNewFile,metaFilesRoot);

        });


    }


}

function runAuthorizedAction(metaFilesRoot,authorizedAction,res,req) {

    var token = req.headers['x-token'];
    res.setHeader("Access-Control-Allow-Origin", "*");
    metaFilesRoot.auth(token, function (error) {
        var auth = JSON.parse(new Buffer(token.split('.')[1], 'base64').toString('binary'));

        authorizedAction(error, auth,metaFilesRoot,res, req);
    });
}

app.get('/download',function(req,res){
    var Firebase = require('firebase');
    var metaFilesRoot = new Firebase('https://mystor.firebaseio.com/');
    runAuthorizedAction(metaFilesRoot,loadFromStorage,res,req);
});

app.post('/upload', function(req, res){
    var Firebase = require('firebase');
    var metaFilesRoot = new Firebase('https://mystor.firebaseio.com/');

    runAuthorizedAction(metaFilesRoot, saveToStorage,res,req);
});


app.listen(3000);
console.log('Listening on port 3000');