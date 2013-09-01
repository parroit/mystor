

app.controller("MyKlanCtrl", ['$http','$scope', '$dialog', 'AuthService', 'angularFireCollection',
    function ($http,scope, $dialog, AuthService,angularFireCollection) {
        function editCliente(clienteId){
            var opts = {
                dialogClass:  'modal edit-cliente',
                controller: "EditClienteCtrl",
                templateUrl: "/html/edit-cliente.html",
                resolve:{
                    clienteId:function(){return clienteId;}
                }

            };


            var d = $dialog.dialog(opts);
            d.open();
        }

        scope.edit=function(cliente){
            editCliente(cliente.$id);
        };
        scope.remove =function(cliente){
            scope.clienti.remove(cliente);



        };
        scope.add =function(){
            var newCliente={};
            var path=scope.clienti.add(newCliente).path.m;
            editCliente(path[path.length-1]);


        };

        AuthService.whenAuthenticated(function () {


           
            function showPage(page){
                var clienti = app.firebase.child('clienti');
                var rows = clienti;

                scope.clienti = angularFireCollection(rows);
            }
            showPage(0);
            scope.clientiResource = {
                get: function (order, page, filter, continuation) {
                    showPage(page);

                    continuation(page, 10, scope.clienti.length, scope.clienti);

                }
            };



        });


    }
]);

app.config(function ($routeProvider) {
    var route = {
        controller: "MyKlanCtrl",
        templateUrl: 'html/my-klan.html'
    };
    $routeProvider

        .when('/my', route);

});



