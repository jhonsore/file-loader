(function () {
    "use strict";

    var self;
    var counter;
    var JS_EXT = 'js';
    var CSS_EXT = 'css';
    var HEAD = document.getElementsByTagName("head")[0];
    var RESPONSE = {
      timeout: { code: '101', 'message': 'Timeout reached'},
      maxAttempt: { code: '102', 'message': 'Maximum file upload reached'}
    }

    var FileLoader = function () {
      self = this;
    };

    FileLoader.prototype.constructor = FileLoader;

    FileLoader.prototype.load = function(args)
    {
      counter = 0;

      self.settings = args;
      self.files = args.files;
      self.maxFiles = self.files.length -1;

      self.timeout = args.timeout ? args.timeout : 10000;
      self.maxAttemptLoad = args.maxAttemptLoad ? args.maxAttemptLoad : 5;
      self.attemptLoad = 0;
      self.timerCount = 0;

      self.ignoreErrorLoading = args.ignoreErrorLoading ? args.ignoreErrorLoading : false;

      if(self.settings.debug){
        self.debug = true;
      }

      initTimer();
      loadItem();
    };

    //--------------------------------------
    function initTimer(){
      self.timer = setInterval(function(){
        self.timerCount++;
        log('(Fileload) timer running : '+self.timerCount);
        if(self.timerCount >= self.timeout){
          self.settings.onError({code: RESPONSE.timeout, response: {}});
          stopTimer();
          return false;
        }
      },1000);
    }

    function stopTimer(){
      clearInterval(self.timer);
      self.timerCount = 0;
      self.timer = null;
    }

    function loadItem(){
      var itemLoad = self.files[counter];
      var fileLoad = itemLoad.file;
      var extension = fileLoad.split('.').pop();

      switch(extension){
        case JS_EXT:
          checkScript(itemLoad);
        break;
        case CSS_EXT:
          loadCss(itemLoad);
          break;
        default:
          log('Item cannot be loaded: '+fileLoad);
          loadNextFile();
          break;
      }
    }

    function loadCss(__args__){
      var uid = getUid();
      var file = __args__.file;
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.id = uid;
      link.href = file;

      log('Loading style: ' + file);

      link.onload = function ()
      {
          log('Loaded style "' + file + '".');

          if(self.settings.onLoaded){
            self.settings.onLoaded({id: uid, item: __args__, index: counter});
          }

          loadNextFile();
      };

      link.onerror = function ()
      {
          log('Error loading style "' + file + '".');

          //remove node added dinamically
          document.getElementById(uid).remove();

          if(self.attemptLoad < self.maxAttemptLoad){
            self.attemptLoad++;
            //if some error occur we try to load file again
            loadCss(__args__);
          }else{
            self.attemptLoad = 0;

            if(self.settings.onError){
              if(self.ignoreErrorLoading){
                loadNextFile();
              }else{
                stopTimer();
                self.settings.onError({code: RESPONSE.maxAttempt, response: __args__});
              }
            }
          }
      };

      HEAD.appendChild(link);
    }


    function checkScript(__args__){
      var module = __args__.module;

      if(module && window[module]) {
        //module already exists
        log(module+' already exists!');
        loadNextFile();
      }else{
        //load script
        loadScript(__args__);
      }
    }

    function loadScript(__args__){

      if(!self.timer)//timeout reached
        return false;

      var file = __args__.file;
      var script = document.createElement('script');
      var uid = getUid();
      script.type = 'text/javascript';
      script.src = file;
      script.id = uid;

      script.onload = () =>
      {
          log('Loaded script "' + file + '".');

          if(self.settings.onLoaded){
            self.settings.onLoaded({id: uid, item: __args__, index: counter});
          }

          loadNextFile();
      };

      script.onerror = () =>
      {
          log('Error loading script "' + file + '".');

          //remove node added dinamically
          document.getElementById(uid).remove();

          if(self.attemptLoad < self.maxAttemptLoad){
            self.attemptLoad++;
            //if some error occur we try to load file again
            loadScript(__args__);
          }else{
            self.attemptLoad = 0;

            if(self.settings.onError){
              if(self.ignoreErrorLoading){
                loadNextFile();
              }else{
                stopTimer();
                self.settings.onError({code: RESPONSE.maxAttempt, response: __args__});
              }
            }
          }
      };

      log('Loading script "' + file + '".');
      HEAD.appendChild(script);
    }

    function loadNextFile(){
      if(counter < self.maxFiles){
        counter++;
        loadItem();
      }else{
        stopTimer();
        self.settings.onComplete();
      }
    }

    function log(__msg__){
      if(self.debug){
        console.log(__msg__);
      }
    }

    function getUid ()
    {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    };

    window.FileLoader = new FileLoader();

})();
