
// Twitter TopTenRetweets
// =========================

SR.Charts.TW_topTenRetweets = new SR.Chart({
    id : 'TW_topTenRetweets'
    , url: '/twitter/{{id}}/topTenRetweets'
    , testData: [
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        },
        {
            "id" : "259320959964680192",
            "created_at": "Fri Oct 19 15:51:49 +0000 2012",
            "retweet_count": 1
        }
    ]
    , render: function (data, options) {

        SR.log("Rendering %s", this.id, data, options)

        // data = {}
        console.log(data)
        this.process(options)

        if (data.length === 0) {
            this.module.addClass('no-data')
            return
        }

        this.module.html(Handlebars.templates['twitter-top-retweets']({data:data}))

        this.addTitle("Top 10 Retweeted Tweets")

    }
})
