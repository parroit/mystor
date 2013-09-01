

define(['js/mystorApp'], function (app) {

    app.directive('btHorizontal', [function() {
        return {
            //templateUrl: '/src/html/bt-horizontal.html',
            restrict: 'A',
            compile: function compile(tElement, tAttrs, transclude) {
              return {
                pre: function preLink(scope, iElement, iAttrs, controller) {
                    var controls = angular.element("<div/>");
                    controls.addClass("col-lg-9");

                    var controlGroup = angular.element("<div/>");
                    controlGroup.addClass("form-group");
                    controlGroup.append(controls);
                    iElement.addClass("form-control");
                    iElement.wrap(controlGroup);

                    if (iAttrs.hasOwnProperty("btLabel")) {
                        var label = angular.element("<label>");
                        label.addClass("col-lg-2 control-label");
                        label.html(iAttrs["btLabel"]);
                        iElement.parents(".form-group").prepend(label);
                    }

                    var parentForm = iElement.parents("form");
                    if (! parentForm.hasClass("form-horizontal"))
                        parentForm.addClass("form-horizontal");

                },
                post: function postLink(scope, iElement, iAttrs, controller) {



                }
              }
            }
        };
  
    }]);
});
