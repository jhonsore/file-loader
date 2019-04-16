(function () {
    "use strict";

    var counter;
    var JS_EXT = 'js';
    var CSS_EXT = 'css';
    var HEAD = document.getElementsByTagName("head")[0];
    var RESPONSE = {
      timeout: { code: '101', 'message': 'Timeout reached'},
      maxAttempt: { code: '102', 'message': 'Maximum file upload reached'},
      noItems: { code: '103', 'message': 'Add at least one item to load'}
    }

    var FileLoader = function () {
      //this.load = this.load.bind(this);
    };

    FileLoader.prototype.constructor = FileLoader;

    FileLoader.prototype.load = function(args)
    {
      counter = 0;

      if(!args.files){
        throw new Error("("+RESPONSE.noItems.code+") "+RESPONSE.noItems.message);
        return;
      }

      this.settings = args;
      this.files = args.files;
      this.maxFiles = this.files.length -1;

      this.timeout = args.timeout ? args.timeout : 10000;
      this.maxAttemptLoad = args.maxAttemptLoad ? args.maxAttemptLoad : 5;
      this.attemptLoad = 0;
      this.timerCount = 0;

      this.ignoreErrorLoading = args.ignoreErrorLoading ? args.ignoreErrorLoading : false;

      if(this.settings.debug){
        this.debug = true;
      }

      this.initTimer();
      this.loadItem();
    };

    //--------------------------------------
    FileLoader.prototype.initTimer = function(){
      var self = this;
      this.timer = setInterval(function(){
        self.timerCount++;
        self.log('(Fileload) timer running : '+self.timerCount);
        if(self.timerCount >= self.timeout){
          self.settings.onError({code: RESPONSE.timeout, response: {}});
          self.stopTimer();
          return false;
        }
      },1000);
    }

    FileLoader.prototype.stopTimer = function(){
      clearInterval(this.timer);
      this.timerCount = 0;
      this.timer = null;
    }

    FileLoader.prototype.loadItem = function(){
      var itemLoad = this.files[counter];
      var fileLoad = itemLoad.file;
      var extension = fileLoad.split('.').pop();
      var self = this;

      switch(extension){
        case JS_EXT:
          self.checkScript(itemLoad);
        break;
        case CSS_EXT:
          self.loadCss(itemLoad);
          break;
        default:
          self.log('Item cannot be loaded: '+fileLoad);
          self.loadNextFile();
          break;
      }
    }

    FileLoader.prototype.loadCss = function(__args__){
      var uid = getUid();
      var file = __args__.file;
      var link = document.createElement("link");
      var self = this;
      link.rel = "stylesheet";
      link.type = "text/css";
      link.id = uid;
      link.href = file;

      self.log('Loading style: ' + file);

      link.onload = function ()
      {
          self.log('Loaded style "' + file + '".');

          if(self.settings.onLoaded){
            self.settings.onLoaded({id: uid, item: __args__, index: counter});
          }

          self.loadNextFile();
      };

      link.onerror = function ()
      {
          self.log('Error loading style "' + file + '".');

          //remove node added dinamically
          document.getElementById(uid).remove();

          if(self.attemptLoad < this.maxAttemptLoad){
            self.attemptLoad++;
            //if some error occur we try to load file again
            self.loadCss(__args__);
          }else{
            self.attemptLoad = 0;

            if(self.settings.onError){
              if(self.ignoreErrorLoading){
                self.loadNextFile();
              }else{
                self.stopTimer();
                self.settings.onError({code: RESPONSE.maxAttempt, response: __args__});
              }
            }
          }
      };

      HEAD.appendChild(link);
    }

    FileLoader.prototype.checkScript = function(__args__){
      var module = __args__.module;
      var self = this;

      if(module && window[module]) {
        //module already exists
        self.log(module+' already exists!');
        self.loadNextFile();
      }else{
        //load script
        self.loadScript(__args__);
      }
    }

    FileLoader.prototype.loadScript = function(__args__){
      var self = this;

      if(!self.timer)//timeout reached
        return false;

      var file = __args__.file;
      var script = document.createElement('script');
      var uid = getUid();
      script.type = 'text/javascript';
      script.src = file;
      script.id = uid;

      script.onload = function()
      {
          self.log('Loaded script "' + file + '".');

          if(self.settings.onLoaded){
            self.settings.onLoaded({id: uid, item: __args__, index: counter});
          }

          self.loadNextFile();
      };

      script.onerror = function()
      {
          self.log('Error loading script "' + file + '".');

          //remove node added dinamically
          document.getElementById(uid).remove();

          if(self.attemptLoad < self.maxAttemptLoad){
            self.attemptLoad++;
            //if some error occur we try to load file again
            self.loadScript(__args__);
          }else{
            self.attemptLoad = 0;

            if(self.settings.onError){
              if(self.ignoreErrorLoading){
                self.loadNextFile();
              }else{
                self.stopTimer();
                self.settings.onError({code: RESPONSE.maxAttempt, response: __args__});
              }
            }
          }
      };

      self.log('Loading script "' + file + '".');
      HEAD.appendChild(script);
    }

    FileLoader.prototype.loadNextFile = function(){
      var self = this;
      if(counter < this.maxFiles){
        counter++;
        self.loadItem();
      }else{
        self.stopTimer();
        self.settings.onComplete();
      }
    }

    FileLoader.prototype.log = function(__msg__){
      if(this.debug){
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

    window.FileLoader = FileLoader;

})();
