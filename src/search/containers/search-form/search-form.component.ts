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
      caseRef: '',
      otherRef: '',
      fullName: '',
      addressLine1: '',
      postcode: '',
      email: '',
      dateOfBirth_day: '',
      dateOfBirth_month: '',
      dateOfBirth_year: '',
      dateOfDeath_day: '',
      dateOfDeath_month: '',
      dateOfDeath_year: '',
      servicesList: ''
    });

    // Set default service selection to "All"
    this.formGroup.get('servicesList').setValue(this.services[0].id);
  }

  public onSubmit(): void {
    this.searchRequest = this.populateSearchRequest(this.formGroup);
  }

  public populateSearchRequest(formGroup: FormGroup): SearchRequest {
    return {
      maxReturnRecordCount: 25,
      startRecordNumber: 1,
      searchCriteria: this.getSearchRequestCriteria(formGroup),
      sortCriteria: this.getSearchRequestSortCriteria(formGroup)
    }
  }

  public getSearchRequestCriteria(formGroup: FormGroup): SearchRequestCriteria {
    const searchRequestParty = this.getSearchRequestParty(formGroup);

    return {
      ccdJurisdictionIds: [
        formGroup.get('servicesList').value
      ],
      caseReferences: [
        formGroup.get('caseRef').value
      ],
      otherReferences: [
        formGroup.get('otherRef').value
      ],
      parties: [
        searchRequestParty
      ]
    };
  }

  public getSearchRequestSortCriteria(formGroup): SearchRequestSortCriteria {
    // Sort criteria requirement not defined at this stage
    // Might be introduced in future
    return null;
  }

  public getSearchRequestParty(formGroup: FormGroup): SearchRequestParty {
    const dateOfBirth = new Date(formGroup.get('dateOfBirth_year').value,
      formGroup.get('dateOfBirth_month').value,
      formGroup.get('dateOfBirth_day').value);

    const dateOfDeath = new Date(formGroup.get('dateOfDeath_year').value,
      formGroup.get('dateOfDeath_month').value,
      formGroup.get('dateOfDeath_day').value);

    return {
      addressLine1: formGroup.get('addressLine1').value,
      dateOfBirth: dateOfBirth.toDateString(),
      dateOfDeath: dateOfDeath.toDateString(),
      emailAddress: formGroup.get('email').value,
      partyName: formGroup.get('fullName').value,
      postCode: formGroup.get('postcode').value
    }
  }
}

export interface SearchFormServiceListItem {
  label: string,
  value: string,
  id: string
}
