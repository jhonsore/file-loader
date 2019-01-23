(function () {
    "use strict";

    var _self;

    var File2 = function () {
      console.log('File 2 loaded');
    };

    File2.prototype.constructor = File2;

    window.File2 = new File2();

})();
