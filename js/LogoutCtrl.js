define(['js/mystorApp'], function (mystor) {

    mystor.controller("LogoutCtrl",
        function($scope,$location) {
            $scope.user=null;
            var auth = new FirebaseSimpleLogin(mystor.firebase, function (error, user) {
                if (user != null) {
                    mystor.firebase.unauth();
                }

                $location.path("/login");
            });
            auth.logout();


        }
    );

    mystor.config( function($routeProvider) {
        var route = {
          controller: "LogoutCtrl",
            templateUrl: 'templates/login.html'
        };

        $routeProvider
            .when('/logout/*sourceUrl',route )
            .when('/logout', route);

    });
});




