app.filter('fillCheckBoxCell', function () {
    return function (value) {
        return '<input type="checkbox" disabled="disabled" ' + (value ? 'checked="checked"' : '') + '/>';
    };
});


app.controller("ClientiCtrl", ['$http','$scope', '$dialog', 'AuthService', 'angularFireCollection',
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


            /*var fatture = app.firebase.child('fatture');
            scope.fatture = angularFireCollection(fatture);

            var clientiMap={};
            $http.get("/data/all.json").success(function (files, status, headers, config) {

                for (var i= 0,l=files.length; i<l; i++ ) {
                    $http.get("/data/"+files[i]).success(function (fattura, status, headers, config) {
                        var cliente = fattura.cliente;
                        if (!clientiMap.hasOwnProperty(cliente.description)){
                            clientiMap[cliente.description] = cliente;
                            var path=scope.clienti.add(cliente).path.m;
                            fattura.cliente =path[path.length-1];
                            fattura.clienteDescription = cliente.description;
                            cliente.$id = fattura.cliente;
                        }  else {
                            var clienteEsistente = clientiMap[cliente.description];
                            fattura.cliente =clienteEsistente.$id;
                            fattura.clienteDescription = clienteEsistente.description;
                        }
                        scope.fatture.add(fattura);
                    });
                }
            }).error(function(err){
                    alert(err);
                });*/
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
        controller: "ClientiCtrl",
        templateUrl: 'html/clienti.html'
    };
    $routeProvider

        .when('/clienti', route);

});



