(function() {
  window.App = {
    Models : {},
    Collections : {},
    Views : {}
  };

  window.template = function(id) {
    return _.template($('#' + id).html());
  };

  window.vent = _.extend({}, Backbone.Events);

  window.$.fn._show = function() {
    this.show();
  }

  window.$.fn._hide = function() {
    this.hide();
  }

  /***************************************************
   *
   * Models 
   */
  App.Models.Browser = Backbone.Model.extend({
    defaults : {
      'hackTypes' : []
    }
  });


  /***************************************************
   *
   * Collections 
   */
  App.Collections.Browser = Backbone.Collection.extend({
    model : App.Models.Browser
  });


  /***************************************************
   *
   * Views 
   */

  /* 
   * All browser 
   */
  App.Views.Master = Backbone.View.extend({
    initialize : function() {
      // Create all browser views
      this.collection.each(function(browser) {
        new App.Views.Browser({model: browser});
      }, this);
    }
  });

  /* 
   * A single browser 
   */
  App.Views.Browser = Backbone.View.extend({
    hackChilds : null,

    initialize : function() {
      // The browser 
      this.$el = $('#' + this.model.get('browser'));

      /*
       * @TODO [TimPietrusky] - This code is SHIT. Please prettify it.
       */
      var type = '',
          hackParents,
          hackTypes = [];

      // Type of hacks (e.g. selector, javascript)
      hackParents = this.$el.find('[data-type*="-parent"]');

      // Create an array of hack types
      _.each(hackParents, function(item, index) {
        hackTypes.push($(item).attr('data-type').split('-')[0]);
      }, this);

      // Save the hack types into the model
      this.model.set('hackTypes', hackTypes);

      // The specific hacks
      this.hackChilds = this.$el.find('pre');

      // Listen to events
      vent.bind("search", this.handleSearch, this);
      vent.bind("searchCancelled", this.searchCancelled, this);
    },

    /*
     * Show or hide the browser after the search was triggered
     */
    handleSearch : function(data) {
      var names = this.model.get('names');
      
      /*
       * @TODO [TimPietrusky] - Add each
       */
       // Match
      if (names[0].indexOf(data.browser) == 0 || names[1].indexOf(data.browser) == 0) {
        this.show(data);
      } else {
        this.hide(data);
      }
    },

    /*
     * Show browser + filter versions.
     */
    show : function(data) {
      this.$el.show();
      this.$el.addClass('active');

      // Filter version
      if (data.version != null) {
        // Hide all childs
        this.hackChilds.hide();

        // Show only matched childs
        this.$el.find('pre[data-version*="'+data.version+'"]').show();

        // Change the style of filtered elements
        this.$el.addClass('filtered');

        // Hide empty hack types
        _.each(this.model.get('hackTypes'), function(type) {
          // Get the amount of visible hacks
          count = this.$el.find('[data-type="'+type+'-childs"] pre:visible').length;
          
          // Hide title if no hacks are visible
          if (count == 0) {
            this.$el.find('[data-type="'+type+'-parent"] h3').hide();
          }
        }, this);

      // Show all versions
      } else {
        this.hackChilds.show();
        this.$el.removeClass('filtered');
        this.$el.find('[data-type*="-parent"] h3').show();
      }
    },

    /*
     * Hide browser
     */
    hide : function(data) {
      this.$el.hide();
      this.$el.removeClass('active');
    },

    /*
     * Show browser + childs because the search was canceled.
     */
    searchCancelled : function() {
      this.$el.show();
      this.$el.removeClass('filtered');
      this.$el.removeClass('active');
      this.hackChilds.show();
      this.$el.find('[data-type*="-parent"] h3').show();
    }
  });

  /* 
   *  
   */
  App.Views.HackType = Backbone.View.extend({

  });

  /* 
   * Search 
   */
  App.Views.Search = Backbone.View.extend({
    el : 'input#search',

    events : {
      'keyup' : 'keyup',
      'focus' : 'focus',
      'blur' : 'blur'
    },

    regex_split : null,
    value : null,
    split : null,
    browser : null,
    version : null,

    initialize : function() {
      this.regex_split = new RegExp("(\\D+)", "gm");
    },

    /*
     * There was some interaction with the search field. 
     */
    keyup : function(e) {
      this.value = this.$el.val().toLowerCase().trim();

      // Something was entered
      if (this.value != '') {
        // Split Browser from version
        this.split = this.value.split(this.regex_split);

        // Get the browser
        this.browser = this.split[1].trim();

        // Get the version
        if (this.split[2] != "") {
          this.version = this.split[2].trim();
        } else {
          this.version = null;
        }

        vent.trigger("search", {'browser' : this.browser, 'version' : this.version});

        // Hide description
        $('article[data-type="description"]').hide();

      // Field is empty
      } else {
        // Show all browser
        vent.trigger("searchCancelled");

        // Show description
        $('article[data-type="description"]').show();
      }
    },

    /*
     * Handle focus obtained.
     */
    focus : function(e) {
      // Hide buttons
      $('div[data-type="top-buttons"]').hide();

      // Search active
      $('div[data-type="search"]').addClass('active');
    },

    /*
     * Handle focus lost.
     */
    blur : function(e) {
      // Search inactive
      $('div[data-type="search"]').removeClass('active');

      /**
       * @TODO [TimPietrusky] - Handle this otherwise. Why? When you hit the label the buttons are shown
       */
      // Show buttons
      setTimeout(function() {
        $('div[data-type="top-buttons"]').show();
      }, 175);
    }
  });


  /*--------------------------------------------------
   *
   * Start the app
   */

  // A collection of browsers
  var collection_browser = new App.Collections.Browser([
    {'browser' : 'ch', 'names' : ['chrome', 'ch']}, 
    {'browser' : 'fx', 'names' : ['firefox', 'mozilla firefox']},
    {'browser' : 'ie', 'names' : ['internet explorer', 'ie']},
    {'browser' : 'sa', 'names' : ['safari', 'apple safari']},
    {'browser' : 'op', 'names' : ['opera', 'op']}
  ]);

  // Holds all browser
  var view_master = new App.Views.Master({collection : collection_browser});

  // Handles the search
  var view_search = new App.Views.Search();


  // @TODO: [TimPietrusky] - Find a better place for this
  var tips = ["_","-", "£", "¬", "¦", "!", "$", "&", "*", "(", ")", "=", "%", "+", "@", ",", ".", "/", "`", "[", "]", "#", "~", "?", ":", "<", ">", "|"];

  setInterval(function() {
    var i = Math.round((Math.random()) * tips.length);
    if (i == tips.length) --i;
    $(".catch-phrase__anim").html(tips[i]);
  }, 400);
})();