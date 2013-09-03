
define(['js/mystorApp','js/mimetype'], function (app,mimetype) {
    app.controller("IndexCtrl", function ($scope) {

    });

    app.filter('mimeicon',function(){
        return function(fileName){
            return "img/ext/" + mimetype.lookup(fileName,false,"text/plain").replace(/\//g,"_") + ".png";
        }
    });

    function renderApp($scope,$window, angularFireCollection,  user, $http,fbToken) {
        $scope.files = angularFireCollection(
            app.firebase.child('files').child(user.id + '@' + user.provider)
        );
        $scope.download = function () {
            //var downloadingFile = app.firebase.child("files").child(user.id+'@'+user.provider).child(this.file.id);
            $window.location = "http://localhost:3000/download/" + this.file.id
            /*$http.get({
                url: 'http://localhost:3000/download',
                headers: {*//*"X-Token": user.firebaseAuthToken,*//* "X-Id": this.file.id }

            }).then(function (data, status, headers, config) {
                    // file is downloaded successfully
                    console.log(data);
                });*/
        };
        $scope.delete = function () {
            //var downloadingFile = app.firebase.child("files").child(user.id+'@'+user.provider).child(this.file.id);

            $http.delete({
                url: 'http://localhost:3000/delete',
                headers: {/*"X-Token": user.firebaseAuthToken,*/ "X-Id": this.file.id }

            }).then(function (data, status, headers, config) {
                    // file is downloaded successfully
                    console.log(data);
                });
        };

        $scope.onFileSelect = function ($files) {

            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                var newFile = app.firebase.child("files").child(user.id + '@' + user.provider).push();
                var uploadingFile = {
                    id: newFile.name(),
                    name: $file.name,
                    size: $file.size,
                    status: "Idle"
                };
                newFile.set(uploadingFile);



                $http.uploadFile({
                    url: 'http://localhost:3000/upload',
                    headers: {"X-Token": fbToken, "X-Id": newFile.name() },
                    file: $file
                }).then(function (data, status, headers, config) {
                        // file is uploaded successfully
                        console.log(data);
                    });
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
                onAuth(error, user && user.auth,user.firebaseAuthToken);
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