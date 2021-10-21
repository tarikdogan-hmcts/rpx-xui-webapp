import { isDefined } from '@angular/compiler/src/util';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GovUiConfigModel } from '@hmcts/rpx-xui-common-lib/lib/gov-ui/models';
import { SearchRequestCriteria } from 'src/search/models/search-request-criteria.model';
import { SearchRequestParty } from 'src/search/models/search-request-party.model';
import { SearchRequestSortCriteria } from 'src/search/models/search-request-sort-criteria.model';
import { SearchRequest } from 'src/search/models/search-request.model';

@Component({
  selector: 'exui-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss']
})
export class SearchFormComponent implements OnInit {

  public formGroup: FormGroup;
  public caseRefConfig: GovUiConfigModel;
  public otherRefConfig: GovUiConfigModel;
  public fullNameConfig: GovUiConfigModel;
  public addressLine1Config: GovUiConfigModel;
  public postcodeConfig: GovUiConfigModel;
  public emailConfig: GovUiConfigModel;
  public dateOfBirthConfig: GovUiConfigModel;
  public dateOfDeathConfig: GovUiConfigModel;
  public servicesConfig: GovUiConfigModel;
  public services: SearchFormServiceListItem[];

  private searchRequest: SearchRequest;

  constructor(private readonly fb: FormBuilder) {
    this.caseRefConfig = {
      id: 'caseRef',
      name: 'caseRef',
      classes: 'govuk-input--width-10',
      label: '16-digit case reference',
      type: 'text'
    };
    this.otherRefConfig = {
      id: 'otherRef',
      name: 'otherRef',
      hint: 'Any other reference to identify a case, for example National Insurance number or system reference.',
      classes: 'govuk-input--width-10',
      label: 'Other reference',
      type: 'text'
    };
    this.fullNameConfig = {
      id: 'fullName',
      name: 'fullName',
      hint: 'For example, name of a party or solicitor.',
      classes: 'govuk-input--width-20',
      label: 'Full name',
      type: 'text'
    };
    this.addressLine1Config = {
      id: 'addressLine1',
      name: 'addressLine1',
      classes: 'govuk-input--width-20',
      label: 'First line of address',
      type: 'text'
    };
    this.postcodeConfig = {
      id: 'postcode',
      name: 'postcode',
      label: 'Postcode',
      type: 'text'
    };
    this.emailConfig = {
      id: 'email',
      name: 'email',
      classes: 'govuk-input--width-20',
      label: 'Email address',
      type: 'email'
    };
    this.dateOfBirthConfig = {
      id: 'dateOfBirth',
      name: 'dateOfBirth',
      hint: '',
      label: 'Date of birth'
    };
    this.dateOfDeathConfig = {
      id: 'dateOfDeath',
      name: 'dateOfDeath',
      hint: '',
      label: 'Date of death'
    };
    this.servicesConfig = {
      id: 'servicesList',
      name: 'servicesList',
      classes: 'govuk-label--m',
      label: 'Services'
    };
    this.services = [
      {label: 'All', value: 'All', id: 'All'}
    ];
  }

  public ngOnInit(): void {
    this.formGroup = this.fb.group({
      caseRef: null,
      otherRef: null,
      fullName: null,
      addressLine1: null,
      postcode: null,
      email: null,
      dateOfBirth_day: null,
      dateOfBirth_month: null,
      dateOfBirth_year: null,
      dateOfDeath_day: null,
      dateOfDeath_month: null,
      dateOfDeath_year: null,
      servicesList: null
    });

    // Set default service selection to "All"
    this.formGroup.get('servicesList').setValue(this.services[0].id);
  }

  public onSubmit(): void {
    this.searchRequest = this.populateSearchRequest(this.formGroup);
    console.log(this.searchRequest);
  }

  public populateSearchRequest(formGroup: FormGroup): SearchRequest {
    return {
      maxReturnRecordCount: 25,
      startRecordNumber: 1,
      searchCriteria: this.getSearchRequestCriteria(formGroup),
      sortCriteria: null
    }
  }

  public getSearchRequestCriteria(formGroup: FormGroup): SearchRequestCriteria {
    const jurisdictionId = formGroup.get('servicesList').value;
    const caseReference = formGroup.get('caseRef').value;
    const otherReference = formGroup.get('otherRef').value;

    const searchRequestParty = this.getSearchRequestParty(formGroup);

    return {
      ccdJurisdictionIds: [jurisdictionId],
      caseReferences: [caseReference],
      otherReferences: [otherReference],
      parties: [searchRequestParty]
    };
  }

  public getSearchRequestSortCriteria(formGroup): SearchRequestSortCriteria {
    // Sort criteria requirement not defined at this stage
    // Might be introduced in future
    return null;
  }

  public getSearchRequestParty(formGroup: FormGroup): SearchRequestParty {
    const addressLine1 = formGroup.get('addressLine1').value;
    const emailAddress = formGroup.get('email').value;
    const partyName = formGroup.get('fullName').value;
    const postcode = formGroup.get('postcode').value;

    const dateOfBirth = isDefined(formGroup.get('dateOfBirth_year').value)
      ? `${formGroup.get('dateOfBirth_day').value}-${formGroup.get('dateOfBirth_month').value}-${formGroup.get('dateOfBirth_year').value}`
      : null;

    const dateOfDeath = isDefined(formGroup.get('dateOfDeath_year').value)
      ? `${formGroup.get('dateOfDeath_day').value}-${formGroup.get('dateOfDeath_month').value}-${formGroup.get('dateOfDeath_year').value}`
      : null;

    // Please note: "postcode" is one word, so we use "postcode", but API expects "postCode"
    // Using "postCode" instead of "postcode" in our code will result in null values
    return {
      addressLine1: addressLine1,
      dateOfBirth: dateOfBirth,
      dateOfDeath: dateOfDeath,
      emailAddress: emailAddress,
      partyName: partyName,
      postCode: postcode
    };
  }
}

export interface SearchFormServiceListItem {
  label: string,
  value: string,
  id: string
}
