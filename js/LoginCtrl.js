define(['js/mystorApp'], function (mystor) {

    mystor.controller("LoginCtrl",function($scope,$location,$routeParams) {
            $scope.username = '';
            $scope.password = '';

            $scope.rememberMe=false;


            function createAuth() {
                var auth = new FirebaseSimpleLogin(mystor.firebase, function (error, user) {
                    if (user != null) {
                        $scope.user = user;
                        $location.path("/app");
                    } else {
                        $scope.user = null;
                        $location.path("/login");
                    }

                });
                return auth;
            }

            $scope.login = function(){
                var auth = createAuth();

                auth.login('password', {
                    rememberMe: true,
                    email: $scope.username,
                    password: $scope.password
                });

            };

            $scope.loginFacebook = function(){
                var auth = createAuth();

                auth.login('facebook', {
                    rememberMe: true,
                    scope: 'email'
                });

            };

            $scope.loginTwitter = function(){
                var auth = createAuth();

                auth.login('twitter', {
                    rememberMe: true ,
                    scope: 'email'
                });

            };


        }
    );

    mystor.config( function($routeProvider) {
        var route = {
          controller: "LoginCtrl",
          templateUrl: 'templates/login.html'
        };

        $routeProvider
            .when('/login/*sourceUrl',route )
            .when('/login', route);

    });


});


