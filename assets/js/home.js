//= require vendor/manifest
//= require init
//= require util
//= require models/user

// bootstrap hack to stop dropdowns from disappearing on mobile
$('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });

(function(App) {

  _.extend(App, {

    init: function() {
      var _this = this;

      SR.settings.baseURL = '/api'

      $(function() {
        _this.docReady();
      });
    },

    docReady: function() {
      var _this = this;

      this.getStatus();

      $('#signOutButton').on('click', function(e) {
        e.preventDefault();
        _this.signOut();
      });
      $("[rel=tooltip]").tooltip();
    },

    setSignedIn: function() {
      $('#currentUser').text(this.user.get('name'));
      $('body').removeClass('noUser').addClass('hasUser');
    },

    setSignedOut: function() {
      $('body').removeClass('hasUser').addClass('noUser');
    },

    getStatus: function() {
      var _this = this;

      $.getJSON('/auth/status', function(user){
          _this[user.logged ? 'setSignedIn' : 'setSignedOut']();
          $('body').removeClass('userNotFetched');
          this.user = user
      })
    },

    signInComplete: function() {
      this.getStatus()
      $('#signInModal').modal('hide');
      window.location = '/dashboard';
    },

    signOut: function() {
      var _this = this;

      $.ajax({
        url: '/auth/signOut',
        success: function() {
          _this.setSignedOut();
          window.location = '/';
        }
      });
    }

  });

  App.init();

})(window.SR);
