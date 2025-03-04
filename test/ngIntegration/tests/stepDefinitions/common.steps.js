var { defineSupportCode } = require('cucumber');

const MockApp = require('../../../nodeMock/app');

const caseListPage = require('../pageObjects/caselistPage');

const browserUtil = require('../../util/browserUtil');
const nodeAppMockData = require('../../../nodeMock/nodeApp/mockData');
const CucumberReporter = require('../../../e2e/support/reportLogger');
const BrowserWaits = require('../../../e2e/support/customWaits');
const headerpage = require('../../../e2e/features/pageObjects/headerPage');

const { getTestJurisdiction } = require('../../mockData/ccdCaseMock');

const ccdApi = require('../../../nodeMock/ccd/ccdApi');

defineSupportCode(function ({ And, But, Given, Then, When }) {
    Given('I reload app if {string}', async function(isReadRequired){
        if (isReadRequired.toLowerCase().includes("yes") || isReadRequired.toLowerCase().includes("true")){
            await browserUtil.gotoHomePage();
            await BrowserWaits.retryWithActionCallback(async () => {
                await headerpage.waitForPrimaryNavDisplay();
                await browserUtil.waitForLD();
            }); 
        } 
        
    });
   

});
