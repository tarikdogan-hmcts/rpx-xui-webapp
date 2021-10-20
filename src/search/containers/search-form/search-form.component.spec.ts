import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { SearchRequestCriteria } from 'src/search/models/search-request-criteria.model';
import { SearchRequestParty } from 'src/search/models/search-request-party.model';
import { SearchRequest } from 'src/search/models/search-request.model';

import { SearchFormComponent } from './search-form.component';

describe('SearchFormComponent', () => {
  let component: SearchFormComponent;
  let fixture: ComponentFixture<SearchFormComponent>;
  const formBuilder = new FormBuilder();

  const searchRequestParty: SearchRequestParty = {
    addressLine1: '156 Dummy Street',
    dateOfBirth: 'Sun Dec 31 1899',
    dateOfDeath: 'Sun Dec 31 1899',
    emailAddress: 'a@test.com',
    partyName: 'A Test',
    postCode: 'SS1 2NA'
  };
  const searchRequestCriteria: SearchRequestCriteria = {
    ccdJurisdictionIds: [
      'IA'
    ],
    caseReferences: [
      '1234-2341-3412-4123'
    ],
    otherReferences: [
      '456789'
    ],
    parties: [
      searchRequestParty
    ]
  };
  const searchRequest: SearchRequest = {
    maxReturnRecordCount: 25,
    startRecordNumber: 1,
    searchCriteria: searchRequestCriteria,
    sortCriteria: null
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchFormComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: FormBuilder, useValue: formBuilder }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    component.formGroup = formBuilder.group({
      caseRef: '1234-2341-3412-4123',
      otherRef: '456789',
      fullName: 'A Test',
      addressLine1: '156 Dummy Street',
      postCode: 'SS1 2NA',
      email: 'a@test.com',
      dateOfBirth_day: '20',
      dateOfBirth_month: '09',
      dateOfBirth_year: '1997',
      dateOfDeath_day: '12',
      dateOfDeath_month: '05',
      dateOfDeath_year: '2002',
      servicesList: 'All'
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get search request party', () => {
    const searchRequestPartyResult = component.getSearchRequestParty(component.formGroup);
    expect(searchRequestPartyResult).toBe(searchRequestParty);
  });

  it('should get search request criteria', () => {
    const searchRequestCriteriaResult = component.getSearchRequestCriteria(component.formGroup);
    expect(searchRequestCriteriaResult).toBe(searchRequestCriteria);
  });

  it('should populate search request model', () => {
    const searchRequestResult = component.populateSearchRequest(component.formGroup);
    expect(searchRequestResult).toBe(searchRequest);
  });
});
