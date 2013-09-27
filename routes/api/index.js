var TSV = require('tsv')

// API response formats
// ====================

exports.json = function (req, res) {
    res.json(req.apiData)
}

exports.tsv = function(req, res) {
    res.header('Content-Type', 'text/plain')
    res.send(req.apiData && TSV.stringify(req.apiData))
}