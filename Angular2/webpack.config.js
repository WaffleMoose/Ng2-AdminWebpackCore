var isDevBuild = process.argv.indexOf("--env.prod") < 0;
var path = require("path");
var webpack = require("webpack");
var nodeExternals = require("webpack-node-externals");
var merge = require("webpack-merge");
var allFilenamesExceptJavaScript = /\.(?!js(\?|$))([^.]+(\?|$))/;

// Configuration in common to both client-side and server-side bundles
var sharedConfig = {
    resolve: { extensions: [ ".js", ".ts" ] },
    output: {
        filename: "[name].js",
        publicPath: "/dist/" // Webpack dev middleware, if enabled, handles requests for this URL prefix
    },
    module: {
        loaders: [
            { test: /\.ts$/, include: /ClientApp/, loader: "ts", query: { silent: true } },
            { test: /\.html$/, loader: "raw" },
            { test: /\.css$/, loader: "to-string!css" },
            { test: /\.(png|jpg|jpeg|gif|svg)$/, loader: "url", query: { limit: 25000 } }
        ]
    }
};

// Configuration for client-side bundle suitable for running in browsers
var clientBundleConfig = merge(sharedConfig, {
    entry: { 'main-client': "./ClientApp/boot-client.ts" },
    output: { path: path.join(__dirname, "./wwwroot/dist") },
    devtool: isDevBuild ? "inline-source-map" : null,
    plugins: [
        new webpack.DllReferencePlugin({
            context: __dirname,
            manifest: require("./wwwroot/dist/vendor-manifest.json")
        }),
         new webpack.ProvidePlugin({
             $: "jquery",
             jQuery: "jquery",
             "window.jQuery": "jquery",
             Tether: "tether",
             "window.Tether": "tether",
             Tooltip: "exports-loader?Tooltip!bootstrap/js/dist/tooltip",
             Alert: "exports-loader?Alert!bootstrap/js/dist/alert",
             Button: "exports-loader?Button!bootstrap/js/dist/button",
             Carousel: "exports-loader?Carousel!bootstrap/js/dist/carousel",
             Collapse: "exports-loader?Collapse!bootstrap/js/dist/collapse",
             Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown",
             Modal: "exports-loader?Modal!bootstrap/js/dist/modal",
             Popover: "exports-loader?Popover!bootstrap/js/dist/popover",
             Scrollspy: "exports-loader?Scrollspy!bootstrap/js/dist/scrollspy",
             Tab: "exports-loader?Tab!bootstrap/js/dist/tab",
             Util: "exports-loader?Util!bootstrap/js/dist/util"
         }),
    ].concat(isDevBuild ? [] : [
        // Plugins that apply in production builds only
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin()
    ])
});

// Configuration for server-side (prerendering) bundle suitable for running in Node
var serverBundleConfig = merge(sharedConfig, {
    entry: { 'main-server': "./ClientApp/boot-server.ts" },
    output: {
        libraryTarget: "commonjs",
        path: path.join(__dirname, "./ClientApp/dist")
    },
    target: "node",
    devtool: "inline-source-map",
    externals: [nodeExternals({ whitelist: [allFilenamesExceptJavaScript] })] // Don't bundle .js files from node_modules
});

module.exports = [clientBundleConfig, serverBundleConfig];
