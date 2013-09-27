
// Twitter Overview
// =========================

SR.Charts.TW_overview = new SR.Chart({
    id: 'TW_overview'
  , url: '/twitter/{{id}}/overview'
  , testData: {
        followers_count: 123
      , friends_count: 456
      , listed_count: 999
    }
  , render: function (data, options) {

        SR.log("Rendering %s", this.id, data, options)

        // data = {}

        this.process(options)

        if (data.length === 0) {
            this.module.addClass('no-data')
            return
        }

        this.module.html(Handlebars.templates['twitter-overview'](data))

        this.addTitle("Twitter")

    }
})
