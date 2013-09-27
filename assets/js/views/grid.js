
// Module grid
// ===========

// Shortcut for re-rendering a .module element
$.prototype.redraw = function(){
    return this.each(function(){
        var module = SR.Modules[this.id]
        module && module.render()
    })
}

SR.View.ModuleGrid = Backbone.View.extend({
    className: 'dashboard-grid content',
    template: 'grid',

    initialize: function () {
        var self = this
          , el = this.$el
          , width = window.innerWidth

        $(window).unbind('.grid')
            .on('resize.grid', function(){
                if (window.innerWidth != width) el.addClass('resizing')
            })
            .on('resize.grid', _.debounce(function(){
                if (window.innerWidth == width) return
                el.find('.module').redraw()
                el.removeClass('resizing')
                width = window.innerWidth
            }, 300))

        this.removeButton = $('<div class="delete-module">X</div>')

        SR.on('updateGrid', this.redraw.bind(this))

        SR.provide('gridData', this, this.gridData)
    },

    events: {
        'dragover  .grid-placeholder' : 'highlight'
      , 'dragenter .grid-placeholder' : 'highlight'
      , 'dragleave .grid-placeholder' : 'unhighlight'
      , 'drop      .grid-placeholder' : 'dropChart'
      , 'dragstart .chart-item'       : 'dragChart'
      , 'dragleave .chart-item'       : 'unhighlightChart'
      , 'dragover  .grid-new'         : 'dragOverNew'
      , 'dragleave .grid-new'         : 'unhighlight'
      , 'drop      .grid-new'         : 'dropNew'
      , 'mouseenter .module'          : 'showRemoveButton'
      , 'mouseleave .module'          : 'hideRemoveButton'
      , 'click      .delete-module'   : 'deleteModule'
    },

    highlight: function(e){
        e.preventDefault()
        $(e.target).addClass('dragover')
    },

    unhighlight: function(e){
        $(e.target).removeClass('dragover')
    },

    highlightChart: function(e){
        var module = this.dragging || $()
          , target = $(e.currentTarget).closest('.module')

        if (module[0] != target[0]) {
            target.addClass('highlight')
        }
    },

    unhighlightChart: function(e){
        $(e.target).removeClass('highlight')
    },

    dragChart: function(e){
        var element = $(e.target)
          , type    = element.data('type')
          , name    = element.data('name')
          , width   = element.data('width')

        this.dragging = element

        SR.log('Dragging module:', type, name, width)

        SR.DragData.set(e, {
            action : 'move'
          , type   : type
          , name   : name
          , width  : width
          , id     : e.target.id
        })
    },

    /*dragOverChart: _.throttle(function(e){

    }, 500),*/

    dropChart: function(e){
        e.preventDefault()
        e.stopPropagation()

        var self = $(e.target)
          , data = SR.DragData.get(e)

        self.removeClass('dragover')

        SR.log('Drop ['+data.action+']:', data.chart)

        switch (data.action) {
            case 'move':
                var chart = $('#'+data.id)
                  , temp = $('<div/>')
                  , chart_data = chart.data()
                  , self_data = self.data()

                if (data.width == 1) {
                    // the old elements switch-a-roo
                    temp.replaceWith( self.replaceWith( chart.replaceWith(temp)))
                    // remove empty lines
                    if (self.siblings().is('.grid-placeholder')) {
                        self.parent().remove()
                        return
                    }
                    // recover jQuery data()
                    chart.data(chart_data).redraw()
                    self.data(self_data).redraw()

                } else {
                    var row1 = self.parent(), row2 = chart.parent()

                    if (row1.index() > row2.index())
                        row1.after(row2)
                    else
                        row1.before(row2)
                }
                break;
            case 'new':
                if (data.width > 1) return // TODO: handle inserting wide module in placeholder
                this.createModule(self, {
                    type : data.type
                  , name : data.name
                })
                break;
        }
    },

    dragOverNew: function(e){
        e.preventDefault()
        $(e.target).addClass('dragover')
    },

    dropNew: function(e){
        e.preventDefault()
        this.unhighlight(e)

        var data = SR.DragData.get(e)
        if (data.action === 'new') {
            this.addModule(data)
        }
    },

    addModule: function(data){
        var newRow = $('<div class="row" />')
        if (data.width == 2) {
            newRow.append('<div class="grid-placeholder grid2" data-width="2" />')
        } else {
            newRow.append('<div class="grid-placeholder grid1" data-width="1" />')
            newRow.append('<div class="grid-placeholder grid1" data-width="1" />')
        }

        this.$('.row-new').before(newRow)
        this.createModule(newRow.children().eq(0), {
            type : data.type
          , name : data.name
        })
    },

    createModule: function (target, module) {
        SR.log('Creating module', module)
        if (module.type === 'chart') this.createChart(target, module)
        if (module.type === 'text')  this.createText(target, module)
        if (module.type === 'image') this.createImage(target, module)
    },

    createChart: function (target, chart) {
        target = $(target)

        var range = chart.range || []
        var chart = new SR.View.Chart({
            type   : 'chart'
          , name   : chart.name
          , width  : target.width()
          , height : target.height()
          , gridWidth : target.data('width')
          , model  : this.model
          , since  : range[0]
          , until  : range[1]
        })

        target.replaceWith(chart.el)
        chart.render()
    },

    createText: function (target, module) {
        target = $(target)
        var text = new SR.View.TextModule({
            type      : 'text'
          , gridWidth : target.data('width')
          , text      : module.text
        })
        target.replaceWith(text.el)
        text.render()
    },

    createImage: function (target, module) {
        target = $(target)
        var image = new SR.View.ImageModule({
            type      : 'image'
          , gridWidth : target.data('width')
          , source    : module.source
        })
        target.replaceWith(image.el)
        image.render()
    },

    // Grid data is derived directly from the DOM tree. This is simpler than maintaining
    // a separate representation of the grid; it's easy to modify without re-rendering
    // the whole grid, without keeping track of changes and positions.
    gridData: function () {
        var grid = []
        this.$('.row:not(.row-new)').each(function(i){
            var row = []
            $(this).children().each(function(i){
                var module = SR.Modules[this.id]
                row[i] = module && module.toJSON()
            })
            grid[i] = row
        })
        return grid
    },

    redraw: function () {
        this.$('.module').removeClass('no-data').redraw()
    },

    // Draw existing modules, if any
    drawModules: function (target) {
        var self = this
          , frag = $(document.createDocumentFragment())

        // Create row
        _.each(this.model.get('rows'), function(row){
            var newRow = $('<div class="row" />').appendTo(frag)
            // Create modules
            _.each(row, function(module){
                var w = module && module.gridWidth || 1
                var temp = $('<div class="grid-placeholder grid'+w+'" data-width="'+w+'" />').appendTo(newRow)
                // Defer module drawing
                if (module) {
                    _.defer(function(){ self.createModule(temp, module) })
                }
            })
        })
        $(target).prepend(frag)
    },

    showRemoveButton: function (e) {
        var module = $(e.target).closest('.module')
        this.removeButton.appendTo(module)
    },

    hideRemoveButton: function (e) {
        this.removeButton.detach()
    },

    deleteModule: function (e) {
        var module = $(e.target).closest('.module')
          , id     = module.attr('id')
          , module = SR.Modules[id]
          , w      = module.options.gridWidth

        // Remove entire row
        if (w == 2 || module.$el.siblings('.module').length < 1) {
            module.$el.closest('.row').remove()
        // Replace with placeholder
        } else if (w == 1) {
            module.$el.replaceWith($('<div class="grid-placeholder grid'+w+'" data-width="'+w+'" />'))
        }
        module.remove()
    },

    render: function(){
        this.renderTemplate()
        if (!this.model.isNew()) this.drawModules(this.$('.grid-rows'))
    }
})
