
var CreateCaseStartPage = require('../createCaseStartPage');
var BrowserWaits = require('../../../support/customWaits');
const date = require('moment');
var path = require('path');
var cucumberReporter = require('../../../support/reportLogger');
var CaseEditPage = require('../caseEditPage');
const BrowserUtil = require('../../../../ngIntegration/util/browserUtil');
const App = require('./application');
const BrowserLogs = require('../../../support/browserLogs');
const { accessibilityCheckerAuditor } = require('../../../../accessibility/helpers/accessibilityAuditor');
const config = require('../../../config/functional.conf');

const headerPage = require('../headerPage');
class CaseManager {

    constructor() {
        this.app = new App();
        this.manageCasesHeaderLink = $('.hmcts-header__link');
        this.caseListContainer = $('exui-case-list');

        this.caseCreateheaderLink = element(by.xpath('//a[contains(@class ,"hmcts-primary-navigation__link")][contains(text(),"Create case")]'));

        this.continueBtn = new Button('button', 'Continue');

        this.submitBtn = element(by.xpath('//button[contains(text(),\'Submit\')]'));
        this.previousBtn = $("form .button-secondary");
        this.cancelLink = $("form .cancel a");

        this.formFields = 'ccd-case-edit-form>div';
        this.ccdCaseDetails = $('ccd-case-viewer');
        this.ccdCaseEdit = $('ccd-case-edit')
        this.exuiCaseHomeComp = $("exui-case-home");
        this.checkYourAnswers = $(".check-your-answers");

        this.caseNextStepSelect = $("select#next-step");
        this.nextStepGoButton = $(".event-trigger button");
        this.createCaseStartPage = new CreateCaseStartPage();
        this.caseEditPage = new CaseEditPage();
        this.createCaseContainer= $("ccd-create-case-filters form");

        this.eventTimestamp = element(by.xpath('//tbody/tr[1]/td[2]/div[1]'));
    }

    async cancelCaseCreation(){
        await BrowserWaits.waitForElement(this.ccdCaseEdit);
        var thisPageUrl = await browser.getCurrentUrl();
        await BrowserWaits.waitForElement(this.cancelLink);
        await this.cancelLink.click();
        await BrowserWaits.waitForPageNavigation(thisPageUrl);
    }

    async clickPreviousButton(){
        await BrowserWaits.waitForElement(this.previousBtn);
        var thisPageUrl = await browser.getCurrentUrl();
        await this.previousBtn.click();
        await BrowserWaits.waitForPageNavigation(thisPageUrl);
    }

    async clickSubmit(){
      await this.submitBtn.click();
    }

    async getTimestampDisplayed(){
      await BrowserWaits.waitForElement(this.eventTimestamp);
      return await this.eventTimestamp.getText();
    }

    async _waitForSearchComponent(){
        await BrowserWaits.waitForElement(this.createCaseContainer);
    }

    async startCaseCreation(jurisdiction, caseType, event){
        await BrowserWaits.retryWithActionCallback(async ()=> {
            let retryOnJurisdiction = 0;
            await BrowserWaits.retryWithActionCallback(async () => {
                try {
                    await BrowserWaits.waitForSpinnerToDissappear();
                    await this.createCaseStartPage.selectJurisdiction(jurisdiction);
                }
                catch (error) {
                    await BrowserLogs.printBrowserLogs();
                    cucumberReporter.AddMessage("Jurisdiction option not found after 30sec. Retrying again with browser refresh");
                    retryOnJurisdiction++;
                    await headerPage.refreshBrowser();
                    throw new Errro(error); 

                }
            });
               
            

            await this.createCaseStartPage.selectCaseType(caseType);
            await this.createCaseStartPage.selectEvent(event);

            var thisPageUrl = await browser.getCurrentUrl();

            let startCasePageRetry = 0;
            await BrowserWaits.retryWithActionCallback(async () => {
                try {
                    await BrowserWaits.waitForSpinnerToDissappear();
                    await this.createCaseStartPage.clickStartButton();
                    const nextPageUrl = await BrowserWaits.waitForPageNavigation(thisPageUrl); 
                }
                catch (err) {
                    const nextPageUrl = await BrowserWaits.waitForPageNavigation(thisPageUrl);
                    if (nextPageUrl.includes("service-down")) {
                        await browser.get(config.config.baseUrl + "cases/case-filter")
                        await cucumberReporter.AddScreenshot(global.screenShotUtils);
                        cucumberReporter.AddMessage("Service error occured Retrying again ");
                        throw new Error("Service error occured Retrying again ");
                    }
                    cucumberReporter.AddMessage("Case start page not displayed in  30sec. Retrying again " + err);
                    startCasePageRetry++;
                    throw new Error(err);
                }
            });
            
        });    
   } 

    async createCase( caseData,isAccessibilityTest,tcTypeStatus) {
        this.caseData = caseData;

        var isCheckYourAnswersPage = false;
        let pageCounter = 0;
        while (!isCheckYourAnswersPage) {
            let page = tcTypeStatus ? pageCounter : "null";
            await this._formFillPage(page);
            var checkYouranswers = $(".check-your-answers");
            isCheckYourAnswersPage = await checkYouranswers.isPresent();
            pageCounter++;
        }
    }

    async submitCase(isAccessibilityTest){
        var checkYouranswers = $(".check-your-answers");
        var isCheckYourAnswersPage = await checkYouranswers.isPresent();
        if (isCheckYourAnswersPage) {
            var submit = element(by.xpath('//button[@type= "submit"]'));
            await BrowserWaits.waitForElement(submit);
            await browser.executeScript('arguments[0].scrollIntoView()',
                submit.getWebElement());

            var thisPageUrl = await browser.getCurrentUrl();

            await BrowserWaits.retryWithActionCallback(async () => {
                await submit.click();
                await BrowserWaits.waitForPageNavigation(thisPageUrl)
            });
        }else{
            throw new  Error("Not in case creation check your answers page");
        }
    }

    async startNextStep(stepName, isAccessibilityTest){
        await BrowserWaits.waitForElement(this.exuiCaseHomeComp);
        await BrowserWaits.waitForElement(this.caseNextStepSelect);

        var nextStepSelectoption = null;
        if (stepName){
            nextStepSelectoption = element(by.xpath("//*[@id='next-step']//option[text() = '" + stepName + "']"));

        }else{
            nextStepSelectoption = element(by.xpath("//*[@id='next-step']//option[2]"));
        }
        await BrowserWaits.waitForElement(nextStepSelectoption);

        await nextStepSelectoption.click();

        var thisPageUrl = await browser.getCurrentUrl();

        await this.nextStepGoButton.click();
        await BrowserWaits.waitForPageNavigation(thisPageUrl);

    }


    async AmOnCaseDetailsPage(){
        await BrowserWaits.retryWithActionCallback(async () => {
            expect(await this.ccdCaseDetails.isPresent()).to.be.true;
        });
    }

    async AmOnCCDCaseEditPage() {
        await BrowserWaits.retryWithActionCallback(async () => {
            try{
                await BrowserWaits.waitForElement(this.ccdCaseEdit);
                expect(await this.ccdCaseEdit.isPresent()).to.be.true;
            }catch(err){

                await this.createCaseStartPage.clickStartButton();
                throw new Error(err);
            }
            
        });
    }    

    async AmOnChekYourAnswersPage() {
        await BrowserWaits.retryWithActionCallback(async () => {
            expect(await this.checkYourAnswers.isPresent()).to.be.true;
        });
    }

    async _formFillPage(pageCounter) {
        var currentPageElement = $('ccd-case-edit-page');
        await BrowserWaits.waitForElement(currentPageElement);
        if(pageCounter!="null") {
           if(pageCounter>=1) pageCounter++;
            await this.caseEditPage.wizardPageFormFieldValidations(pageCounter);
        }
        var fields = element.all(by.css(this.formFields));
        for (let count = 0; count < await fields.count(); count++) {
            var isHidden = await fields.get(count).getAttribute("hidden");
            if (isHidden) {
                continue;
            }

            var field = await fields.get(count).element(by.xpath('./*'));
            var readWriteField = await field.getTagName();

            if (readWriteField === "ccd-field-write") {
                var ccdField = field.element(by.xpath("./div/*"));
                await this._writeToField(ccdField);
            }
        }

        var continieElement = element(by.xpath('//button[@type= "submit"]'));
        await browser.executeScript('arguments[0].scrollIntoView()',
            continieElement.getWebElement())

        await BrowserWaits.waitForElement(continieElement);
        browser.waitForAngular();
        await BrowserWaits.waitForElementClickable(continieElement);

        var thisPageUrl = await browser.getCurrentUrl();
        cucumberReporter.AddMessage("Submitting page: " + thisPageUrl);
        console.log("Submitting : " + thisPageUrl )

        await BrowserWaits.retryWithActionCallback(async () => {

            try{
                await continieElement.click();
                browser.waitForAngular();
                await BrowserWaits.waitForPageNavigation(thisPageUrl);
            }catch(err){
                let isValidationDisplayed = await this.caseEditPage.isValidationErrorDisplayed();
                cucumberReporter.AddJson(`******* Is Validation error message displayed : ${isValidationDisplayed}`);
                if (isValidationDisplayed) {
                    cucumberReporter.AddJson(`******* Validation error message : ${await this.caseEditPage.getValidationErrorMessageDisplayed()}`);
                }

                throw new Error(err);
            }
          
           
        });

    }
    async excludeFieldValues(fieldName){
        let excludedValues = ["Building and Street","Address Line 2", "Address Line 3", "Town or City", "County", "Postcode/Zipcode","Country"]
        var found = excludedValues.includes(fieldName);
        return found;
    }

    async _writeToField(ccdField,parentFieldName) {
        const isElementDisplayed = await ccdField.isDisplayed();
        if (!isElementDisplayed) {
            return;
        }
        var ccdFileTagName = await ccdField.getTagName();
        var fieldName = "";
        var fieldName1 = "";
        try {
            if (ccdFileTagName.includes("ccd-write-collection-field")){
                console.log("collection field name");
                fieldName = await ccdField.$('h2.heading-h2').getText();
                fieldName = fieldName.trim();
                console.log("collection field name is" + fieldName);

            }else{
                fieldName = await ccdField.$('.form-label').getText();
            }
        }
        catch (err) {
            console.log(err);
        }

        if(parentFieldName){
            let status = await this.excludeFieldValues(fieldName);
            if(status) return;
        }

        fieldName1 = fieldName;
        fieldName = parentFieldName ? `${parentFieldName}.${fieldName}` : fieldName;
        console.log("===> Case Field : " + fieldName);
        switch (ccdFileTagName) {
            case "ccd-write-text-field":
                let e = ccdField.$('input.form-control');
                let textvalue = this._fieldValue(fieldName);
                if (textvalue != "test Enter a UK postcode.Postcode/Zipcode")
                await e.sendKeys(textvalue);
                cucumberReporter.AddMessage(fieldName + " : " + textvalue);
                this._appendFormPageValues(fieldName1, textvalue);
                break;
            case "ccd-write-text-area-field":
                let e1 = ccdField.$('textarea.form-control');
                let textAreaValue = this._fieldValue(fieldName);
                await e1.sendKeys(textAreaValue)
                cucumberReporter.AddMessage(fieldName + " : " + textAreaValue);
                this._appendFormPageValues(fieldName1, textAreaValue);
                break;
            case "ccd-write-money-gbp-field":
                let e2 = ccdField.$('input.form-control');
                let gbpvalue = 300;
                await e2.sendKeys(gbpvalue);
                cucumberReporter.AddMessage(fieldName + " : " + gbpvalue);
                this._appendFormPageValues(fieldName1, gbpvalue);
                break;
            case "ccd-write-number-field":
                let e3 = ccdField.$('input.form-control');
                let numberfield = 1234567;
                await e3.sendKeys(numberfield);
                cucumberReporter.AddMessage(fieldName + " : " + numberfield);
                this._appendFormPageValues(fieldName1, numberfield);
                break;
            case "ccd-write-phone-uk-field":
                let e4 = ccdField.$('input.form-control');
                let phone_uk = '07889999111';
                await e4.sendKeys(phone_uk);
                cucumberReporter.AddMessage(fieldName + " : " + phone_uk);
                this._appendFormPageValues(fieldName1, phone_uk);
                break;
            case "ccd-write-address-field":
                await BrowserWaits.retryWithActionCallback(async () => {
                    await ccdField.$('.form-control').clear();
                    await ccdField.$('.form-control').sendKeys("SW1");
                    await ccdField.$('button').click();
                    var addressSelectionField = ccdField.$('select.form-control')
                    await BrowserWaits.waitForElement(addressSelectionField);
                    var addressToSelect = addressSelectionField.$("option:nth-of-type(2)");
                    await BrowserWaits.waitForElement(addressToSelect);
                    await addressToSelect.click();
                    cucumberReporter.AddMessage(fieldName + " : 2nd option selected");
                }); 
                
                break;
            case "ccd-write-email-field":
                await ccdField.$('input.form-control').sendKeys("test@autotest.com ");
                cucumberReporter.AddMessage(fieldName + " : test@autotest.com");
                this._appendFormPageValues(fieldName1, "test@autotest.com");
                break;
            case "ccd-write-yes-no-field":
                await ccdField.$('.multiple-choice input').click();
                // cucumberReporter.AddMessage(fieldName + " : " + await await ccdField.$('.multiple-choice input').getText());
                let yesOrNoFieldElement = ccdField.$$('.multiple-choice label');
                let selectionYesorNoValue = await yesOrNoFieldElement.get(0).getText();
                cucumberReporter.AddMessage(fieldName + " : " + selectionYesorNoValue);
                this._appendFormPageValues(fieldName1, selectionYesorNoValue);
                break;
            case "ccd-write-fixed-list-field":
                var selectOption = this._fieldValue(fieldName);
                var selectOptionElement = ccdField.$('option:nth-of-type(2)');
                if (!selectOption.includes(fieldName)) {
                    selectOptionElement = ccdField.element(by.xpath("//option[contains(text() , '" + selectOption+"')]"));

                }
                await selectOptionElement.click();

                let selectFieldId = await ccdField.$('select');
                let id = await selectFieldId.getAttribute('id');
                let selectionOptionValue = await selectOptionElement.getAttribute('value');
                cucumberReporter.AddMessage(fieldName + " : " + selectionOptionValue);
                this._appendFormPageValues(fieldName1, selectionOptionValue);
                break;
            case "ccd-write-date-field":
            case "ccd-write-date-container-field":
                var dateValue = this._fieldValue(fieldName);
                if(dateValue.includes(fieldName) || dateValue === ""){
                    dateValue = date().format('DD-MM-YYYY');
                }
                var today = dateValue.split("-");
                await ccdField.$('.form-group-day input').sendKeys(today[0]);
                await ccdField.$('.form-group-month input').sendKeys(today[1]);
                await ccdField.$('.form-group-year input').sendKeys(today[2]);
                cucumberReporter.AddMessage(fieldName + " : " + dateValue);
                this._appendFormPageValues(fieldName1, dateValue);
                break;

            case "ccd-write-document-field":
                await BrowserWaits.retryWithActionCallback(async () => {
                    var fileToUpload = path.resolve(__dirname, "../../../documents/dummy.pdf");
                    await ccdField.$('input.form-control').sendKeys(fileToUpload);
                    const statusMessageELement = ccdField.$("span.error-message") 
                    let statusMessage = "";

                    await BrowserWaits.waitForCondition(async () => {
                        let isStatusDisplayed = await statusMessageELement.isPresent();
                        if (isStatusDisplayed){
                            statusMessage = await statusMessageELement.getText(); 
                        }
                        console.log(`file upload status : Status message is displayed : ${isStatusDisplayed} : ${statusMessage}` );
                        return !isStatusDisplayed || statusMessage.includes("error");
                    });

                    let isStatusDisplayed = await statusMessageELement.isPresent();
                    if (isStatusDisplayed) {
                        statusMessage = await statusMessageELement.getText();
                    }

                    let uploadError = isStatusDisplayed || statusMessage.includes("error");
                    if (uploadError) {
                        var fileToUpload1 = path.resolve(__dirname, "../../../documents/dummy1.pdf");
                        await ccdField.$('input.form-control').sendKeys(fileToUpload1);

                        throw new Error(`file upload error occured : Status message is displayed : ${isStatusDisplayed} : ${statusMessage}` );
                    }
                    cucumberReporter.AddMessage(fieldName + " : dummy.pdf");
                    this._appendFormPageValues(fieldName1, "dummy.pdf");
                    await browser.sleep(5000); 
                });
                break;
            case "ccd-write-multi-select-list-field":
                var selectionFields = ccdField.$$(".multiple-choice input");
                var selectionFieldsCount = await selectionFields.count();
                for (var count = 0; count < selectionFieldsCount; count++) {
                    await selectionFields.get(count).click();
                }
                cucumberReporter.AddMessage(fieldName + " : all options selected");
                break;

            case "ccd-write-fixed-radio-list-field":
                var selectionRadioFields = ccdField.$$(".multiple-choice input");
                var selectionFieldsCount = await selectionRadioFields.count();
                await selectionRadioFields.get(0).click();
                cucumberReporter.AddMessage(fieldName + " : first option selected : " + await ccdField.$$(".multiple-choice label").get(0).getText());
                this._appendFormPageValues(fieldName1, await ccdField.$$(".multiple-choice label").get(0).getText());
                break;
            case "ccd-write-complex-type-field":
                cucumberReporter.AddMessage(fieldName + " : complex field values");
                var writeFields = ccdField.$$("ccd-field-write");
                for (var fieldcounter = 0; fieldcounter < await writeFields.count(); fieldcounter++){
                    var isHidden = await writeFields.get(fieldcounter).getAttribute("hidden");
                    if (isHidden){
                       continue;
                    }
                    var ccdSubField = writeFields.get(fieldcounter).element(by.xpath("./div/*"));
                    await this._writeToField(ccdSubField, fieldName)
                }
                cucumberReporter.AddMessage(fieldName + " : complex field values");
                break;
            case "ccd-write-collection-field":
                cucumberReporter.AddMessage(fieldName + " : complex write collection values");
                var addNewBtn = ccdField.$(".panel button");

                // let arrval = this._fieldValue(fieldName);
                // if (!(arrval instanceof Array)){
                //     break;
                // }
                await browser.executeScript('arguments[0].scrollIntoView()',
                    addNewBtn.getWebElement());
                await addNewBtn.click();
                var writeFields = ccdField.$$(".panel > .form-group > .form-group>ccd-field-write");
                var writeFieldsCount = await writeFields.count();

                for (var count = 0; count < writeFieldsCount; count++) {
                    var ccdSubField = writeFields.get(count).element(by.xpath("./div/*"));
                    var subFieldText = await ccdSubField.getText();
                    await this._writeToField(ccdSubField, `${fieldName}[0]`)
                }

                cucumberReporter.AddMessage(fieldName + " : complex write collection values");
                break;
            default:
                console.log("Unknown field type : " + ccdFileTagName);

                cucumberReporter.AddMessage(fieldName + " : unknown ccd field container " + ccdFileTagName+". Please check if container is missing in test config or changed");

        }
    }

    _fieldValue(fieldName) {
        var value = "fieldName";
        console.log("Read field value : " + fieldName);
        if (this.caseData[fieldName]) {
            value = this.caseData[fieldName];
        } else if (fieldName.includes('Optional')){
            value = "";
        }else{
            value = "test "+fieldName
        }
        return value;
    }

    async _appendFormPageValues(key, value, page) {
        if (key || value) {
            this.checkURanswerPageVal = this.checkURanswerPageVal ? this.checkURanswerPageVal : [];
            let label;
            let keyVal;
            if (key.includes('Optional')) {
                label = key.split(" (Optional)");
            }
            let objKey = label ? label[0] : key;

            if (typeof (value) === 'number') {
                keyVal = value.toString();
            }
            let objValue = keyVal ? keyVal : value;
            this.checkURanswerPageVal.push({ [objKey]: objValue })
        }
        if (page == "caseEditPage") {
            return this.checkURanswerPageVal;
        }
    }


}
module.exports = CaseManager;
