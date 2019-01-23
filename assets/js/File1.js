(function () {
    "use strict";

    var _self;

    var File1 = function () {
      console.log('File 1 loaded');
    };

    File1.prototype.constructor = File1;

    window.File1 = new File1();

})();
