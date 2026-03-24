// Karma configuration file, see link for more information
// https://karma-runner.github.io/6.4/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("@angular-devkit/build-angular/plugins/karma")
    ],
    client: {
      jasmine: {
        // you can specify jasmine options here
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes duplicated traces
    },
    reporters: ["progress", "kjhtml"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: [process.env.GITHUB_ACTIONS ? "ChromeHeadless" : "Chromium"],
    customLaunchers: {
      ChromeHeadless: {
        base: "Chrome",
        flags: ["--no-sandbox", "--disable-gpu", "--headless", "--disable-dev-shm-usage"]
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};
