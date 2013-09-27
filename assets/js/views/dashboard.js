
// Dashboard editor
// ================

SR.Layout.DashboardEdit = Backbone.Layout.extend({
    initialize: function (options) {

        this.model = new SR.Model.Dashboard({
            _id: options.id || null
        })

        this.addViews({
            sidebar      : new SR.View.Sidebar
          , actionsPanel : new SR.View.ActionsPanel
          , header       : new SR.View.DashboardHeader
          , grid         : new SR.View.ModuleGrid({ width: 2 })
        })

        var dashboard = this.model

        function saved () {
            SR.trigger('dashboardSaved')
            SR.Router.navigate('/edit/' + dashboard.id)
        }

        var saveFailed = function () {
            alert('Save failed :(')
            this.views.actionsPanel.resetSaveButton()
        }.bind(this)

        // Listen for 'save' action
        this.listenTo(SR, 'saveDashboard', function(){
            SR.log('Saving preferences...')
            SR.request('dashboardSettings', function(data){
                SR.request('gridData', function(rows){
                    dashboard.save({
                        title        : data.title
                      , description  : data.description
                      , fb_source    : data.fb_source
                      , tw_source    : data.tw_source
                      , rows         : rows
                      , frequency    : data.frequency
                      , recipients   : data.recipients
                      , lastModified : +new Date
                    }, {
                        success : saved
                      , error   : saveFailed
                    })
                })
            })
        })

        this.listenTo(SR, 'deleteDashboard', function(){
            dashboard.destroy({
                wait: true
              , success: function () {
                    $('#modal-delete-dashboard').modal('hide')
                    SR.Router.navigate('/all', true)
                }
              , error: function () {
                    SR.trigger('deleteDashboardError')
                    // TODO: handle server errors
              }
            })
        })

        // Not a *new* Dashboard, fetch data then call `render`. `this.loading`
        // will tell the AppController not to render this view in the meantime.
        if (options.id) {
            this.loading = true
            this.model.fetch({
                success: this.render.bind(this)
            })
        // New dashboard
        } else {
            this.loading = false
            // Set model source to first user page
            this.on('render', function(){
                SR.request('dashboardSettings', function(data){
                    dashboard.set('fb_source', data.fb_source)
                    dashboard.set('tw_source', data.tw_source)
                })
            })
        }

    }
})


// Editor views
// -------------

SR.View.ActionsPanel = Backbone.View.extend({
    className: 'actions-panel',
    template: 'actions-panel',

    events: {
        'click #save-dashboard': "saveDashboard"
      , 'click #view-dashboard': "viewDashboard"
      , 'click .dashboard-url' : "selectURL"
    },

    saveDashboard: function (e) {
        if (this.state == 'saving') return
        this.saveButton.addClass('disabled')
        this.state = 'saving'
        SR.trigger('saveDashboard')
        this.model.once('sync', this.resetSaveButton.bind(this))
    },

    viewDashboard: function (e) {
        if ($(e.target).is('disabled')) return
        window.open('/dashboard/view/' + this.model.id)
    },

    resetSaveButton: function (e) {
        var self = this
          , btn = this.saveButton
          , view = this.viewButton
          , previousText = this.saveText

        btn.width(+btn.width() + 1).text('Saved!')
        _.delay(function(){
            btn.text(previousText).removeClass('disabled')
            view.removeClass('disabled')
            self.state = null
        }, 2000)
    },

    selectURL: function (e) {
        $(e.target).focus().trigger('select')
    },

    render: function(){
        this.renderTemplate({
            url: SR.util.url([location.href.split(location.pathname)[0], '/dashboard/view/', this.model.id])
        })
        this.saveButton = this.$('#save-dashboard')
        this.saveText = this.saveButton.text()
        this.viewButton = this.$('#view-dashboard')
        this.url = this.$('.dashboard-url')

        // only enable view link after dashboard has been saved
        if (this.model.isNew()) {
            this.viewButton.addClass('disabled')
        }
    }
})

SR.View.Sidebar = Backbone.View.extend({
    className: 'sidebar sidebar-nav',
    template: 'sidebar',

    initialize: function () {
        SR.provide('dashboardSettings', this, this.getSettings)
    },

    events: {
        'dragstart .module'        : "dragStart"
      , 'click     .module'        : "cancel"
      , 'change .ds-fb-source'     : "fbsourceChanged"
      , 'change .ds-tw-source'     : "twsourceChanged"
      , 'change #use-test-data'    : "toggleTestData"
      , 'click .header.accordion'  : "collapse"
      , 'change .ds-frequency-day' : "changeWeekDay"
      , 'click .dashboard-delete'  : 'deleteDashboard'
    },

    fbsourceChanged: function (e) {
        var source = $(e.target).val()
        source && this.model.set('fb_source', source)
        SR.trigger('updateGrid')
    },

    twsourceChanged: function (e) {
        var source = $(e.target).val()
        source && this.model.set('tw_source', source)
        SR.trigger('updateGrid')
    },

    toggleTestData: function (e) {
        if (!window.localStorage) return
        localStorage.testData = !!e.target.checked
        SR.trigger('updateGrid')
    },

    dragStart: function(e){
        var element = $(e.target)
          , type    = element.data('type')
          , name    = element.data('name')
          , width   = element.data('width')

        SR.log('Drag started:', type, name, width)

        SR.DragData.set(e, {
            action : 'new'
          , type   : type
          , name   : name
          , width  : width
        })
    },

    cancel: function (e) {
        e.preventDefault()
        e.stopPropagation()
    },

    getSettings: function(){
        var data = {
            title       : this.$('.ds-title').val()
          , description : this.$('.ds-description').val()
          , fb_source   : this.$('.ds-fb-source').val()
          , tw_source   : this.$('.ds-tw-source').val()
          , frequency   : this.$('[name=ds-frequency]:checked').val()
          , recipients  : this.$('.ds-recipients').val().replace(/[,;]/g, '').split(/[\n\r]+/)
        }

        if (!data.title){
            var d     = new Date
              , day   = d.getDate()
              , month = d.getMonth() + 1
              , year  = d.getFullYear()
            data.title = 'dashboard-' + month + '-' + day + '-' + year
            this.$('.ds-title').val(data.title)
        }

        return data
    },

    collapse: function (e) {
        var self = $(e.target)

        self.next().toggleClass('open')
        self.find('.arrow').toggleClass('open closed')
    },

    changeWeekDay: function (e) {
        var value = $(e.target).val()
          , day = this.getWeekDay(value)

        this.model.set('frequency', value)
        this.$('#frequency-weekday').val(value).prop('checked', true)
        this.$('.frequency-selected').text(day)
    },

    getWeekDay: function (day) {
        var wshort = moment.weekdaysShort.map(function(s){ return s.toLowerCase() })
          , dayIndex = _.indexOf(wshort, day)

        if (dayIndex < 0) dayIndex = 1 // Monday
        return moment.weekdays[dayIndex].toLowerCase()
    },

    deleteDashboard: function(e){
        e.preventDefault()
        var modal = $('#modal-delete-dashboard')
        if (modal.length == 0) {
            $(document.body).append(Handlebars.templates['modal-delete-dashboard']())
            modal = $('#modal-delete-dashboard')
        }
        modal.modal()
        // the modal button will SR.trigger('deleteDashboard')
    },

    render: function(){
        var fb_source = this.model.get('fb_source')
          , tw_source = this.model.get('tw_source')
          , services = SR.user.get('services')

        // mark current page
        services.facebook.pages.forEach(function(p){
            p.selected = (p._id == fb_source)
        })
        services.twitter.profiles.forEach(function(p){
            p.selected = (p._id == tw_source)
        })

        var dashboard = this.model.toJSON()
        dashboard.frequencyText = this.getWeekDay(dashboard.frequency)
        dashboard.frequencyDay = dashboard.frequencyText.substring(0,3)
        dashboard.recipients = (dashboard.recipients || []).join('\n')

        this.renderTemplate({
            dashboard       : dashboard
          , facebookPages   : services.facebook.pages
          , twitterProfiles : services.twitter.profiles
          , testData        : window.localStorage && localStorage.testData === 'true'
        })

        var modules = this.$('.module')
        modules.attr('draggable', 'true')

        this.$('[name=ds-frequency][value='+dashboard.frequency+']').prop('checked', true)
    },
})

SR.View.DashboardHeader = Backbone.View.extend({
    className: 'dashboard-header content',
    template: 'header',

    initialize: function () {
        SR.on('dashboardSaved', this.render.bind(this))
    },

    render: function(){
        this.renderTemplate({
            dashboard: this.model.toJSON()
        })
    }
})
