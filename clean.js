// For cleaning up our dist folder
const del = require("del");
del.sync(["dist/**/*", "dist/.*"]);