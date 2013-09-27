// Global app utility methods
// --------------------------

SR.util = {
    toNumber: function (n, _default) {
        return isNaN(n) ? _default : +n
    }
  , format: function (n) {
        var n = n.toString().split('')
          , parts = []
        while (n.length){
            parts.unshift(n.splice(-3, 3).join(''))
        }
        return parts.join(',')
    }
  , url: function (path, params) {
        var url = path.map(function(path, i){
            if (!path) { return '' }
            return i === 0
                ? path.replace(/\/+$/g, '') // Preserve initial slash
                : path.replace(/^\/+|\/+$/g, '')
        }).join('/')
        if (params) url += '?' + $.param(params)
        return url
    }
  , ellipsis: function (text, n) {
        if (text.length > n) return text.slice(0, n) + '...'
        return text
    }
  , plural: function (n, zero, one, more) {
        // plural(2, 'egg') => '2 eggs'
        if (typeof one !== 'string') {
            one = zero
            return n + ' ' + (n == 1 ? one : (one + 's'))
        }
        // plural(5, singular, plural)
        // plural(5, none, singular, plural)
        if (typeof more !== 'string') one = zero, more = zero = one
        return (n > 1 ? more : n === 1 ? one : zero).replace(/%[sd]/g, n)
    }
}