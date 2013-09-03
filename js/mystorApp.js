
define([], function () {
    var app = angular.module('mystor', ['firebase','angularFileUpload','ngCookies']);
    app.firebase=new Firebase('https://mystor.firebaseio.com/');



    return app;
});
