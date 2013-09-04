define(['js/mystorApp'], function (mystor) {

    mystor.controller("LoginCtrl",function($scope,$location,$routeParams,$cookies,$cookieStore,$http) {
            $scope.username = '';
            $scope.password = '';

            $scope.rememberMe=false;


            function createAuth() {
                var auth = new FirebaseSimpleLogin(mystor.firebase, function (error, user) {
                    if (user != null && !$scope.user) {
                        $scope.user = user;
                        $location.path("/app");
                       /* $http({method: "GET",
                            url: 'http://localhost:3000/auth',
                            headers: {"X-Token": user.firebaseAuthToken }

                        }).success(function (data, status, headers, config) {
                            $cookieStore.put('mystor',user.firebaseAuthToken);

                            $scope.user = user;
                            $location.path("/app");
                        }).error(function (error) {
                                alert(error);
                            });*/

                    }



                });
                return auth;
            }
            $scope.register = function(){
                var auth = createAuth();

                auth.createUser($scope.registerData.username,$scope.registerData.password, function (error, user) {
                    if (error){
                        alert(error);
                    } else if(user){
                        auth.login('password', {
                            rememberMe: false,
                            email: $scope.registerData.username,
                            password: $scope.registerData.password
                        });
                    }

                });

            };
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


