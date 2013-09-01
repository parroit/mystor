


app.controller("EditClienteCtrl", ['$scope', '$dialog', 'AuthService', 'angularFire','clienteId',
    function (scope, $dialog, AuthService,angularFire,clienteId) {
        var child = app.firebase.child('clienti').child(clienteId);
        angularFire(child, scope, 'editCliente', {});



    }
]);


