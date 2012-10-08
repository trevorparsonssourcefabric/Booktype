({
    appDir: "/",
    baseUrl: "site_static/js/",
    dir: "/site_static/js/",
    //Comment out the optimize line if you want
    //the code minified by UglifyJS
    optimize: "none",

    paths: {
        "jquery": "empty:"
    },

    modules: [
        //Optimize the application files. jQuery is not
        //included since it is already in require-jquery.js
        {
            name: "main"
        }
    ]
})
