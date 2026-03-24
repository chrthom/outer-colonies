// Karma configuration file, see link for more information
// https://karma-runner.github.io/6.3/config/configuration-file.html

// Karma configuration file
const { config } = require("karma");

module.exports = function (karmaConfig) {
  karmaConfig.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-firefox-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma")
    ],
    client: {
      jasmine: {
        random: false
      },
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "./coverage"),
      subdir: ".",
      reporters: [{ type: "html" }, { type: "text-summary" }]
    },
    reporters: ["progress", "kjhtml"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["Chromium"],
    customLaunchers: {
      ChromeHeadless: {
        base: "Chrome",
        flags: ["--no-sandbox", "--disable-gpu", "--headless", "--disable-dev-shm-usage"]
      }
    },
    singleRun: true,
    restartOnFileChange: false
  });
};
