(function () {

    function list(){

    }



    var myRootRef = new Firebase('https://mystor.firebaseio.com/files');

    var auth = new FirebaseSimpleLogin(myRootRef, function (error, user) {

        myRootRef.child(user.id + '@' + user.provider).on('child_added', function(snapshot) {
            $("body").html($("body").html()+JSON.stringify(snapshot.val()));
        });

    });

    auth.login('facebook');




})();