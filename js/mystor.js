
define(['js/mystorApp','js/mimetype'], function (app,mimetype) {


    app.controller("IndexCtrl", function ($scope) {

    });

    app.filter('mimeicon',function(){
        return function(fileName){

            return "img/ext/" + mimetype.lookup(fileName,false,"text/plain").replace(/\//g,"_") + ".png";
        }
    });

    function renderApp($scope,$window, angularFireCollection,  user, $http,fbToken) {
        const CHUNK_SIZE=10240;

        $scope.files = angularFireCollection(
            app.firebase.child('files').child(user.id + '@' + user.provider)
        );
        $scope.download = function () {
            //$window.location = "http://localhost:3000/download/" + this.file.id
            var downloadFile = this.file;

            var userName = user.id + '@' + user.provider;
            var storage=downloadFile.storage.chunks;
            var downloadFileFB = app.firebase.child("files/"+userName+"/"+downloadFile.id);

            $window.webkitRequestFileSystem($window.TEMPORARY, 5*1024*1024*1024 /*5MB*/, onInitFs, errorHandler);




            function onInitFs(fs) {
                console.log('Opened file system: ' + fs.name);

                fs.root.getFile(downloadFile.name,{create: true}, function(fileEntry) {
                    downloadFileFB.child("status").set("Downloading");
                    downloadFileFB.child("progress").set(0);
                    fileEntry.createWriter(function(fileWriter) {


                        fileWriter.onerror = function(e) {
                            console.log(e);
                        };

                        var queue=[];

                        function dequeue() {
                            if (fileWriter.readyState == fileWriter.WRITING)
                                return;

                            for (var k in queue) {
                                if (queue.hasOwnProperty(k)) {
                                    console.log("Saving chunk " + k);
                                    fileWriter.write(queue[k]);
                                    delete queue[k];

                                    downloadFileFB.child("progress").set((parseInt(k) * CHUNK_SIZE *100)/downloadFile.size);

                                    dequeue();


                                    return;
                                }

                            }
                        }

                        function str2ab(str) {
                            var buf = new ArrayBuffer(str.length); // 2 bytes for each char
                            var bufView = new Uint8Array(buf);
                            for (var i=0, strLen=str.length; i<strLen; i++) {
                                bufView[i] = str.charCodeAt(i);
                            }
                            return buf;
                        }
                        fileWriter.onwriteend = function(e) {
                            dequeue();
                        };

                        var chunks = app.firebase.child("working-queue/" + storage + "/chunks");

                        chunks.on('child_added', function(snapshot) {
                            var chunk = snapshot.val();
                            // Create a new Blob and write it to log.txt.
                            var blob = new Blob([str2ab(chunk)], {type: 'application/octet-binary'});
                            queue[snapshot.name()] = blob;

                            dequeue();
                        });




                    }, errorHandler);



                }, errorHandler);
            }
            function errorHandler(e) {
                var msg = '';

                switch (e.code) {
                    case FileError.QUOTA_EXCEEDED_ERR:
                        msg = 'QUOTA_EXCEEDED_ERR';
                        break;
                    case FileError.NOT_FOUND_ERR:
                        msg = 'NOT_FOUND_ERR';
                        break;
                    case FileError.SECURITY_ERR:
                        msg = 'SECURITY_ERR';
                        break;
                    case FileError.INVALID_MODIFICATION_ERR:
                        msg = 'INVALID_MODIFICATION_ERR';
                        break;
                    case FileError.INVALID_STATE_ERR:
                        msg = 'INVALID_STATE_ERR';
                        break;
                    default:
                        msg = 'Unknown Error';
                        break;
                };

                console.log('Error: ' + msg);
            }


        };
        $scope.delete = function () {

            $http.delete({
                url: 'http://localhost:3000/delete',
                headers: {/*"X-Token": user.firebaseAuthToken,*/ "X-Id": this.file.id }

            }).then(function (data, status, headers, config) {
                    // file is downloaded successfully
                    console.log(data);
                });
        };

        $scope.onFileSelect = function ($files) {
            $("#file-upload").modal('hide');
            var userName = user.id + '@' + user.provider;
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];

                var newFile = app.firebase.child("files").child(userName).push();
                var uploadingFile = {
                    id: newFile.name(),
                    name: $file.name,
                    size: $file.size,
                    status: "Idle"
                };
                newFile.set(uploadingFile);

                var workingQueueItem = app.firebase.child("working-queue").push();
                workingQueueItem.set(
                    {
                        owner: userName,
                        id: uploadingFile.id,
                        chunks: []
                    }
                );

                newFile.child("storage").set({
                    chunks:workingQueueItem.name(),
                    type:"firebase"
                });
                var chunks = app.firebase.child("working-queue/" + workingQueueItem.name() + "/chunks")


                function uploadFile(file,currentChunk,workingQueueItem){
                    var reader = new FileReader();

                    // If we use onloadend, we need to check the readyState.
                    reader.onloadend = function(evt) {
                        if (evt.target.readyState == FileReader.DONE) { // DONE == 2

                            chunks.child(currentChunk).set(evt.target.result);



                            currentChunk++;

                            newFile.child("progress").set((currentChunk * CHUNK_SIZE *100)/file.size);

                            if (currentChunk * CHUNK_SIZE < file.size) {
                                uploadFile(file,currentChunk,workingQueueItem)
                            }

                        }
                    };

                    var blob = file.slice(currentChunk*CHUNK_SIZE, (currentChunk+1)*CHUNK_SIZE);
                    reader.readAsBinaryString(blob);
                }
                newFile.child("status").set("Uploading");
                uploadFile($file,0,workingQueueItem);



            }
        }
    }

    app.config(function ($routeProvider) {
        var route = {
            controller: "IndexCtrl",
            templateUrl: 'templates/index.html'
        };
        $routeProvider
            .when('/', route)
            .when('/index', route)
            .when('', route)
            .otherwise(route);

    });

    app.filter('hsize',function(){return function (size) {
        size = size || 0;
        var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = 0;
        while(size >= 1024) {
            size /= 1024;
            ++i;
        }
        return size.toFixed(1) + ' ' + units[i];
    }});



    app.controller("AppCtrl", function ($scope,$window,$location,$http,angularFireCollection,$cookies,$cookieStore) {
        function onAuthFromCookie(error, user) {
            onAuth(error, user && user.auth)
        }


        function onAuth(error, user,token) {
            if(error) {
                alert("Login Failed:" + error);
            } else {
                if (user != null) {

                    //$cookieStore.put('mystor',user.firebaseAuthToken);


                    $scope.user=user;
                    renderApp($scope,$window, angularFireCollection, user, $http,token);
                } else {
                    $scope.user=null;
                    //$cookieStore.remove('mystor');
                    $location.path("/login");
                }
            }


        }

        if ($cookies.mystor) {
            var token =            $cookies.mystor;
            token = token.substring(1,token.length-1);
            app.firebase.auth(token,function (error, user) {
                onAuth(error, user && user.auth,token);
            });
        } else {
            new FirebaseSimpleLogin(app.firebase,function (error, user) {
                onAuth(error, user,user.firebaseAuthToken);
            } );

        }




    });


    app.config(function ($routeProvider) {
        var route = {
            controller: "AppCtrl",
            templateUrl: 'templates/app.html'
        };
        $routeProvider
            .when('/app', route);

    });
});