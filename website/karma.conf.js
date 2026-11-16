// Karma configuration file, see link for more information
// https://karma-runner.github.io/6.3/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma")
    ],
    client: {
      jasmine: {
        random: false
      }
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "coverage/outercolonies-website"),
      subdir: ".",
      reporters: [{ type: "html" }, { type: "text-summary" }]
    },
    reporters: ["progress", "kjhtml"],
    browsers: ["ChromeHeadless"],
    customLaunchers: {
      ChromeHeadless: {
        base: "Chrome",
        flags: ["--no-sandbox", "--disable-gpu", "--headless", "--disable-dev-shm-usage"]
      }
    },
    restartOnFileChange: true
  });
};
