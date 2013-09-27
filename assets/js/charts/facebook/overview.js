
// Overview / FB at a glance
// =========================

SR.Charts.FB_overview = new SR.Chart({
    id: 'FB_overview'
  , url: '/facebook/{{id}}/overview'
  , testData: {
        fofs: 1231234
      , likes: 517
      , engaged: 1024
    }
  , render: function (data, options) {
    
        SR.log("Rendering %s", this.id, data, options)

        // Last data point = most recent day
        data = {
            likes   : SR.util.format(SR.util.toNumber(data.likes, 0))
          , engaged : SR.util.format(SR.util.toNumber(data.engaged, 0))
          , fofs    : SR.util.format(SR.util.toNumber(data.fofs, 0))
        }

        this.process(options)
        this.addRangeSelector(options.range)

        if (data.length === 0) {
            this.module.addClass('no-data')
            return
        }

        this.module.html(Handlebars.templates['overview'](data))
        
    }
})
