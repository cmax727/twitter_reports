
// Module classes
// ==============

// TODO: Instead of a frankenstein base view with a toJSON method,
// there should be a model `SR.Model.Module` from where each module is instantiated,
// and which creates it's own view of the correct type on initialization.

// Base class
SR.View.Module = Backbone.View.extend({
    tagName: 'div',
    toJSON: function () {
        switch (this.options.type) {

            case 'chart':
                return {
                    type          : this.options.type
                  , name          : this.options.name
                  , gridWidth     : this.options.gridWidth
                  , range         : [this.options.since, this.options.until]
                  , selectedRange : this.options.selectedRange
                }

            case 'text':
                return {
                    type      : this.options.type
                  , gridWidth : this.options.gridWidth
                  , text      : $.sanitize(this.options.text)
                }

            case 'image':
                return {
                    type      : this.options.type
                  , gridWidth : this.options.gridWidth
                  , src       : this.options.src
                }
        }
    },

    setupElement: function(){
        this.$el.empty()
            .addClass('grid' + this.options.gridWidth)
            .attr({
                draggable: 'true'
              , id: this.cid
              , 'data-width': this.options.gridWidth
            })
    }

})

SR.View.Placeholder = SR.View.Module.extend({
    className: 'grid-placeholder',
    render: function(){
        this.$el.addClass('grid' + this.options.width)
        return this
    }
})

SR.View.Chart = SR.View.Module.extend({
    className: 'module chart-item',
    initialize: function (options) {
        SR.Modules[this.cid] = this
        this.setDateRange(options.since, options.until, options.selectedRange)
        this.source = this.options.name.substring(0,2).toLowerCase() + '_source'
    },

    events: {
        'rangeChange': 'changeDates'
    },

    setDateRange: function(since, until, rangeText) {
        _.extend(this.options, {
            since : since
          , until : until
          , selectedRange : rangeText
        })
    },

    changeDates: function(e, dates){
        SR.log('Date range for', this.options.name, 'changed:', dates.start, dates.end)
        this.setDateRange(dates.start, dates.end, dates.selected)
        this.render()
    },

    render: function(){

        this.setupElement()
        this.$el.data('chart', this.options.name)

        var height = this.$el.height()
          , width  = this.$el.width()

        var chart = SR.Charts[this.options.name]

        SR.log("Render chart", this.options.name, this.options)

        function renderChart (data, selectedRange) {
            if (!data || data.length < 1) {
                data = [] //SR.Charts[this.options.name].testData
            }
            chart.render(data, {
                target : this.el
              , width  : width || this.options.width
              , height : height || this.options.height
              , range  : this.options.selectedRange || [this.options.since, this.options.until]
            })
        }

        if ((window.localStorage && localStorage.testData === 'true')) {
            renderChart.call(this, chart.testData)
        } else {
            var self  = this
              , since = this.options.since || Date.today().add({ days: -6 })
              , until = this.options.until || Date.today()

            self.$el.addClass('loading')

            data_url = _.template(chart.url, { id: this.model.get(this.source) })

            data_url = SR.util.url([SR.settings.baseURL, data_url], {
                since : since.toString('yyyy-MM-dd')
              , until : until.toString('yyyy-MM-dd')
            })

            d3.json(data_url, function(data){
                self.$el.removeClass('loading')
                renderChart.call(self, data)
            })
        }

        return this
    }
})

SR.View.TextModule = SR.View.Module.extend({
    className: 'module text-item',
    initialize: function (options) {
        SR.Modules[this.cid] = this
        this.model = new Backbone.Model // for etch editor

        this.model.on('etch:init', function(){
            this.$el.removeAttr('draggable')
        }, this)

        this.model.on('etch:remove', function(){
            this.$el.attr('draggable', true)
        }, this)

    },

    events: {
        'mousedown .editable': 'editableClick',
        'keyup .editable': 'updateText'
    },

    editableClick: window.etch && etch.editableInit || function(){},

    updateText: _.throttle(function () {
        this.options.text = this.$('.editable').html()
    }, 200),

    render: function(){

        this.setupElement()

        var height = this.$el.height()
          , width  = this.$el.width()

        SR.log("Render text module", this.options.name, this.options)

        $('<div/>')
            .addClass('inner editable')
            .attr('data-button-class', 'text')
            .html($.sanitize(this.options.text) || 'Click to edit')
            .appendTo(this.$el)

        return this
    }
})

SR.View.ImageModule = SR.View.Module.extend({
    template: 'file-upload',
    className: 'module image-item',
    initialize: function (options) {
        SR.Modules[this.cid] = this
    },

    events: {
        'dragenter .drop-area' : 'enter'
      , 'dragover  .drop-area' : 'over'
      , 'dragleave .drop-area' : 'leave'
      , 'drop      .drop-area' : 'drop'
      , 'change    .input-file': 'change'
    },

    kill: function (e) {
        e.stopPropagation()
        e.preventDefault()
    },

    enter: function (e) {
        this.kill(e)
        $(e.target).addClass('drag-over')
    },

    over: function (e) {
        this.kill(e)
        e.originalEvent.dataTransfer.dropEffect = "copy"
    },

    leave: function (e) {
        this.kill(e)
        $(e.target).removeClass("drag-over")
    },

    drop: function (e) {
        this.leave(e)

        var files = e.originalEvent.dataTransfer.files
          , form = this.$('form')
          , self = this

        Array.prototype.forEach.call(files, function(file){
            var maxMB = 1024 * 1000 * 2 // 2mb
            if (/image/.test(file.type) && file.size < maxMB) {
                window.FormData && self.upload(file)
            }
        })
    },

    generateUID: function () {
        return SR.user.get('_id') + '-' + +new Date
    },

    change: function (e) {
        var input = $(e.target)
        this.$('.uid').val(this.generateUID())
        this.$('form').ajaxSubmit({
            success: _.bind(this.uploaded, this)
        })
        this.showLoading()
    },

    upload: function (file) {
        var data = new FormData()
          , uid  = this.generateUID()

        this.showLoading()

        data.append('image[name]', file.name)
        data.append('image[file]', file)
        data.append('image[uid]', uid)

        $.ajax({
            url         : '/upload/image'
          , data        : data
          , cache       : false
          , contentType : false
          , processData : false
          , type        : 'POST'
        }).error(function(){
            // oh no
        }).success(_.bind(this.uploaded, this))
        var path = '/uploads/' + uid
    },

    uploaded: function (data) {
        this.options.src = data.path
        this.renderImage()
        this.stopLoading()
    },

    renderImage: function () {
        this.$el.empty().css('background-image', 'url('+this.options.src+')')
    },

    showLoading: function () {
        this.$el.empty().addClass('uploading')
    },

    stopLoading: function () {
        this.$el.removeClass('uploading')
    },

    render: function(){
        this.setupElement()
        this.$el.removeAttr('draggable')

        SR.log("Render image module", this.options.name, this.options)

        this.renderTemplate()

        if (this.options.src) {
            this.renderImage()
        }

        if (!window.FormData) this.$('.drop-area').hide()

        return this
    }
})
