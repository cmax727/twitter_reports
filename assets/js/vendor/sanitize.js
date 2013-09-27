// Sanitize an HTML string
;(function(){

    function sanitize (input) {

        if (!input) return ''

        var root = document.createElement('div')
        root.innerHTML = input

        var tags = Array.prototype.slice.call(root.getElementsByTagName('*'), 0)

        // loop backwards 'cause we are deleting elements from the list
        for (var i = 0; i < tags.length; i++) {

            var element    = tags[i]
              , attributes = element.attributes
              , tagName    = element.tagName.toLowerCase()

            // remove all non-whitelisted tags or empty tags
            if (sanitize.whitelist.indexOf(tagName) < 0 ||
                tagName !== 'br' && element.childNodes.length === 0
            ){
                element.parentNode.removeChild(element)
            }

            for (var j=0; j < attributes.length; j++) {
                var attr  = attr.nodeName.toLowerCase()
                  , value = attr.nodeValue.toLowerCase()

                // remove all non-whitelisted attributes
                if (~sanitize.attributes.indexOf(attr.nodeName)) {
                    element.removeAttribute(attr.nodeName)
                }

                // remove javascript: links
                if (attr === 'href' && val.indexOf('javascript') === 0) {
                    element.removeAttribute('href')
                }

            }
        }

        return root.innerHTML
    }

    sanitize.whitelist = 'div p a span b i u strong em blockquote q cite ul ol li br'
    sanitize.attributes = 'style href'

    ;(window.$ || window).sanitize = sanitize

})();