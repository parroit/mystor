var express = require('express');
var app = express();

app.use(express.bodyParser({
    keepExtensions: true,
    limit: 10000000000, // 10G limit
    defer: true
}));

app.use(express.bodyParser({
    keepExtensions: true,
    limit: 10000000000, // 10G limit
    defer: true
}));

app.use(express.cookieParser());

app.options('/:any', function(req, res){

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
    var fs = require("graceful-fs");

    var source = fs.createReadStream(filePath);




    var received = 0;

    source.pipe(res);

    console.log(fileSize);
    source.on('data', function (chunk) {
        received += chunk.length;
        //console.log(received);
        var percent = ((100 * received) / fileSize).toFixed(1);

        setStatus("Downloading" ,metaFile,percent);
    });


    source.on('end', function () {
        setStatus("Idle",metaFile);
        res.end();
    });

    source.on('error', function (error) {
        console.log(error);
        var status = "Error";
        setStatus(status,metaFile);
        //metaFilesRoot.unauth();
        //res.end();
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


function loadFromStorage(error,metaUser,metaFilesRoot,res,req,fileId) {
    var metaExistentFile = metaFilesRoot.child("files").child(metaUser.d.id + '@' + metaUser.d.provider).child(fileId);
    if (error) {
        reportResult("Load from storage failed:" + error,res,metaFilesRoot)

    } else {
        metaExistentFile.child("size").on('value', function(size) {
            metaExistentFile.child("name").on('value', function(name) {
            var fileSize = size.val();
            var filePath = 'tmp/' + name.val();

            serveFile(res,filePath, fileSize,metaExistentFile,metaFilesRoot);
            });
        });
    }

}
function saveToStorage(error,metaUser,metaFilesRoot,res,req,fileId) {
    var metaNewFile = metaFilesRoot.child("files").child(metaUser.d.id + '@' + metaUser.d.provider).child(fileId);


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
function authorize(error,metaUser,metaFilesRoot,res,req) {
    //res.cookie('mystor', req.headers['x-token'], {domain: 'localhost', maxAge: 600000000});

    res.send("ok");
}
function runAuthorizedAction(token,metaFilesRoot,authorizedAction,res,req,fileId) {



    res.setHeader("Access-Control-Allow-Origin", "*");
    metaFilesRoot.auth(token, function (error) {
        var auth = JSON.parse(new Buffer(token.split('.')[1], 'base64').toString('binary'));

        authorizedAction(error, auth,metaFilesRoot,res, req,fileId);
    });
}

app.get('/download/:fileId',function(req,res){

    var token = req.cookies.mystor;
    token = token.substring(1,token.length-1);
    var Firebase = require('firebase');
    var metaFilesRoot = new Firebase('https://mystor.firebaseio.com/');
    runAuthorizedAction(token,metaFilesRoot,loadFromStorage,res,req,req.params.fileId);
});

app.get('/auth',function(req,res){

    var token = req.headers['x-token'];
    console.log("auth required");

    console.log(token);
    var Firebase = require('firebase');
    var metaFilesRoot = new Firebase('https://mystor.firebaseio.com/');
    runAuthorizedAction(token,metaFilesRoot,authorize,res,req);
});
app.post('/upload', function(req, res){

    var token = req.headers['x-token'];
    //token = token.substring(1,token.length-1);
    var Firebase = require('firebase');
    var metaFilesRoot = new Firebase('https://mystor.firebaseio.com/');

    runAuthorizedAction(token,metaFilesRoot, saveToStorage,res,req, req.headers['x-id']);
});


app.listen(3000);
console.log('Listening on port 3000');