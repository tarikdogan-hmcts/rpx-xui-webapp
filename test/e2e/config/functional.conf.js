const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const minimist = require('minimist');

var screenShotUtils = require("protractor-screenshot-utils").ProtractorScreenShotUtils;

const BrowserUtil = require('.././../ngIntegration/util/browserUtil');
chai.use(chaiAsPromised);

const argv = minimist(process.argv.slice(2));


const isParallelExecution = argv.parallel ? argv.parallel === "true" : true;;
const chromeOptArgs = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-zygote ', '--disableChecks'];

if (!argv.head) {
    chromeOptArgs.push('--headless');
}


const jenkinsConfig = [

    {
        browserName: 'chrome',
        acceptInsecureCerts: true,
        nogui: true,
        chromeOptions: { args: chromeOptArgs }
    }
];

const localConfig = [
    {

        browserName: 'chrome',
        acceptInsecureCerts: true,
        chromeOptions: { args: chromeOptArgs },
        proxy: {
            proxyType: 'manual',
            httpProxy: 'proxyout.reform.hmcts.net:8080',
            sslProxy: 'proxyout.reform.hmcts.net:8080',
            noProxy: 'localhost:3000'
        }
    }
];


if (isParallelExecution) {
    jenkinsConfig[0].shardTestFiles = true;
    jenkinsConfig[0].maxInstances = 6;
}

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
        caseworkerUser: 'mahesh_fr_courtadmn@mailinator.com',
        caseworkerPassword: 'London01',
        fr_judge_username: process.env.FR_EMAIL,
        fr_judge_password: process.env.FR_PASSWORD,
        sscs_username: process.env.SSCS_EMAIL,
        sscs_password: process.env.SSCS_PASSWORD

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
        browser.get(config.baseUrl);
    },

    cucumberOpts: {
        strict: true,
        // format: ['node_modules/cucumber-pretty'],
        format: ['node_modules/cucumber-pretty', 'json:reports/tests/json/results.json'],
        tags: getBDDTags(),
        require: [
            '../support/timeout.js',
            '../support/hooks.js',
            '../support/world.js',
            '../support/*.js',
            '../features/step_definitions/*.steps.js',
            '../features/step_definitions/**/*.steps.js'
        ]    },

    plugins: [
        {
            package: 'protractor-multiple-cucumber-html-reporter-plugin',
            options: {
                automaticallyGenerateReport: true,
                removeExistingJsonReportFile: true,
                reportName: 'XUI Manage Cases Functional Tests',
                // openReportInBrowser: true,
                jsonDir: 'reports/tests/functional',
                reportPath: 'reports/tests/functional',
                displayDuration: true,
                durationInMS: false
            }
        }
    ]


};

function getBDDTags(){
    let tags = [];
    if (argv.tags) {
        tags = argv.tags.split(',');
    } else {
        tags = ["@fullfunctional", "~@ignore"];
    }
    return tags;
}

exports.config = config;
