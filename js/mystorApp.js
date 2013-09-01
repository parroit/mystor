
define([], function () {
    var app = angular.module('mystor', ['firebase','angularFileUpload']);
    app.firebase=new Firebase('https://mystor.firebaseio.com/');



    return app;
});
