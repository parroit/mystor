var app = angular.module('mystor', ['firebase','angularFileUpload']);
app.firebase=new Firebase('https://mystor.firebaseio.com/');

app.controller("IndexCtrl", function ($scope) {

});



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
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = 0;
    while(size >= 1024) {
        size /= 1024;
        ++i;
    }
    return size.toFixed(1) + ' ' + units[i];
}});



app.controller("AppCtrl", function ($scope,$http,angularFireCollection) {


    var auth = new FirebaseSimpleLogin(app.firebase, function (error, user) {
        if (user != null) {
            $scope.files = angularFireCollection(
                app.firebase.child('files').child(user.id + '@' + user.provider)
            );

            $scope.onFileSelect = function($files) {

                //$files: an array of files selected, each file has name, size, and type.
                for (var i = 0; i < $files.length; i++) {
                    var $file = $files[i];
                    var newFile = app.firebase.child("files").child(user.id+'@'+user.provider).push();
                    var uploadingFile = {
                        name: $file.name,
                        size: $file.size,
                        status: "0%"
                    };
                    newFile.set(uploadingFile);
                    $http.uploadFile({
                        url: 'http://localhost:3000/upload',
                        headers: {"X-Token": user.firebaseAuthToken,"X-Id":newFile.name() },
                        file: $file
                    }).then(function(data, status, headers, config) {
                            // file is uploaded successfully
                            console.log(data);
                        });
                }
            }
        }

    });



    auth.login('facebook');
});


app.config(function ($routeProvider) {
    var route = {
        controller: "AppCtrl",
        templateUrl: 'templates/app.html'
    };
    $routeProvider
        .when('/app', route);

});