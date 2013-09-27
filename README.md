SwitchReports
=============

Switch reports is a module driven facebook reporting web app.

[Dev server](http://switch-reports-dev.herokuapp.com)

Overview
---------

This is based off [express3_boilerplate](https://github.com/jwietelmann/express3_boilerplate/)

* All the settings and config vars are in [./config](https://github.com/hcwiley/switch-reports/tree/master/config)
* The app gets setup and all the things pointed at the right package in [app.js](https://github.com/hcwiley/switch-reports/tree/master/app.js)
* All the routes get pointed to their handlers in [routes.js](https://github.com/hcwiley/switch-reports/tree/master/routes.js)
* All the ui routes handlers are in [./routes/ui](https://github.com/hcwiley/switch-reports/tree/master/routes/ui)
* All the api routes handlers are in [./routes/ui](https://github.com/hcwiley/switch-reports/tree/master/routes/api)
* All the models (database models) are in [./models](https://github.com/hcwiley/switch-reports/tree/master/models)
* All the views (jade) are in [./views](https://github.com/hcwiley/switch-reports/tree/master/views)
* All the client side stuff (css, js) are in [./assets](https://github.com/hcwiley/switch-reports/tree/master/assets)
* All the media (imgs) are in [./public](https://github.com/hcwiley/switch-reports/tree/master/public)


Client debugging
----------------

To enable debug messages, open the browser developer console and type

    localStorage.debug = true
    
and reload the page. Set it to `false` to disable.

Windows
-------

### installing

    windows_setup.bat

### running

    windows_server.bat

Mac & Linux
-----------

### running

    ./server

### bootstrap

    ./setup.sh
