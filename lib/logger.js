var winston = require('winston');

winston.loggers.add('default', {
    console: { colorize: true, level: 0 }
})

module.exports = function(name){
    return winston.loggers.get(name || 'default')
}