const chai            = require('chai');
const chaiAsPromised  = require('chai-as-promised');
const minimist        = require('minimist');

const dotenv = require('dotenv');
var screenShotUtils = require("protractor-screenshot-utils").ProtractorScreenShotUtils;

dotenv.config({ path: __dirname +'/../../.local-test.env' });

chai.use(chaiAsPromised);

const argv = minimist(process.argv.slice(2));

const jenkinsConfig = [

  {
    browserName: 'chrome',
    acceptInsecureCerts: true,
    nogui: true,
    chromeOptions: { args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-zygote ', '--disableChecks'] }
  }
];

const localConfig = [
  {

    browserName: 'chrome',
    acceptInsecureCerts: true,
    chromeOptions: { args: ['--headless','--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-zygote '] },
    proxy: {
      proxyType: 'manual',
      httpProxy: 'proxyout.reform.hmcts.net:8080',
      sslProxy: 'proxyout.reform.hmcts.net:8080',
      noProxy: 'localhost:3000'
    }
  }
];

const cap = (argv.local) ? localConfig : jenkinsConfig;

const config = {
  SELENIUM_PROMISE_MANAGER: false,
  framework: 'custom',
  frameworkPath: require.resolve('protractor-cucumber-framework'),
  specs: ['../features/**/*.feature'],
  baseUrl: process.env.TEST_URL || 'http://localhost:3000/',
  params: {
    serverUrls: process.env.TEST_URL || 'http://localhost:3000/',
    targetEnv: argv.env || 'local',
    username: 'lukesuperuserxui@mailnesia.com',
    password: 'Monday01',
    caseworkerUser:'mahesh_fr_courtadmn@mailinator.com',
    caseworkerPassword: 'London01',
    fr_judge_username: process.env.FR_EMAIL,
    fr_judge_password: process.env.FR_PASSWORD,
    sscs_username: process.env.SSCS_EMAIL,
    sscs_password: process.env.SSCS_PASSWORD,

    caseworker_iac_off_username: process.env.CASEWORKER_IAC_OFF_USERNAME ? process.env.CASEWORKER_IAC_OFF_USERNAME :'xui_auto_co_r1@justice.gov.uk' ,
    caseworker_iac_off_password: process.env.CASEWORKER_IAC_OFF_PASSWORD ? process.env.CASEWORKER_IAC_OFF_PASSWORD :'Welcome01',
    hrsTesterUser: 'xui.hrs.tester@hmcts.net',
    hrsTesterPassword: 'Monday01'

  },
  directConnect: true,
  // seleniumAddress: 'http://localhost:4444/wd/hub',
  getPageTimeout: 120000,
  allScriptsTimeout: 500000,
  multiCapabilities: cap,

  onPrepare() {
    browser.waitForAngularEnabled(false);
    global.expect = chai.expect;
    global.assert = chai.assert;
    global.should = chai.should;

    global.screenShotUtils = new screenShotUtils({
      browserInstance: browser
    });
  },

  cucumberOpts: {
    strict: true,
    // format: ['node_modules/cucumber-pretty'],
    format: ['node_modules/cucumber-pretty', 'json:reports/tests/json/results.json'],
    tags: ['@smoke or @test','not @ignore'],
    require: [
      '../support/timeout.js',
      '../support/hooks.js',
      '../support/world.js',
      '../support/*.js',
      '../features/step_definitions/*.steps.js'
    ]
  },

  plugins: [
    {
      package: 'protractor-multiple-cucumber-html-reporter-plugin',
      options: {
        automaticallyGenerateReport: true,
        removeExistingJsonReportFile: true,
        reportName: 'XUI Manage Cases Functional Tests',
        // openReportInBrowser: true,
        jsonDir: 'reports/tests/functional',
        reportPath: 'reports/tests/functional'
      }
    }
  ]


};


exports.config = config;
