import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map, mergeMap } from 'rxjs/operators';
import { SessionStorageService } from '../../../app/services';
import { getJudicialUserIds, mapCaseRoles } from '../../../cases/utils/utils';
import { Caseworker } from '../../../work-allocation-2/models/dtos';
import { CaseworkerDataService } from '../../../work-allocation-2/services';
import { handleFatalErrors } from '../../../work-allocation-2/utils';
import { Answer, CaseRole, RemoveAllocationNavigationEvent } from '../../models';
import { CaseRoleDetails } from '../../models/case-role-details.interface';
import { RemoveRoleText } from '../../models/enums/answer-text';
import { AllocateRoleService } from '../../services';

@Component({
  selector: 'exui-remove-role',
  templateUrl: './remove-role.component.html'
})
export class RemoveRoleComponent implements OnInit {

  public removeAllocationNavigationEvent = RemoveAllocationNavigationEvent;
  public answers: Answer[] = [];
  public caption = null;
  public caseId: string;
  public assignmentId: string;
  public jurisdiction: string;
  public heading = RemoveRoleText.heading;
  public hint = RemoveRoleText.hint;
  public role: CaseRole;

  private backUrl: string;

  constructor(private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly location: Location,
              private readonly allocateRoleService: AllocateRoleService,
              private readonly sessionStorageService: SessionStorageService,
              private readonly caseworkerDataService: CaseworkerDataService) {

  }

  public ngOnInit(): void {
    this.backUrl = window.history.state && window.history.state.backUrl ? window.history.state.backUrl : '';
    const paramMap$ = this.route.queryParamMap;
    paramMap$.pipe(mergeMap(queryMap => {
      return this.getRoleAssignmentFromQuery(queryMap);
    })).subscribe((caseRoles: CaseRole[]) => {
      this.role = caseRoles.find(role => role.id === this.assignmentId);
      if (!this.role.email && this.role.actorId) {
        const caseworkers = JSON.parse(this.sessionStorageService.getItem('caseworkers'));
        if (caseworkers) {
          const caseWorker = (caseworkers as Caseworker[]).find(caseworker => caseworker.idamId === this.role.actorId);
          if (caseWorker) {
            this.role.email = caseWorker.email;
          }
        }
      }
      this.populateAnswers(this.role);
      this.getNamesIfNeeded();
    });
  }

  public populateAnswers(assignment: CaseRole): void {
    const person = assignment.email ? `${assignment.name}\n${assignment.email}` : 'Awaiting person details';
    this.answers.push({ label: 'Type of role', value: assignment.roleName });
    this.answers.push({ label: 'Person', value: person });
  }

  public getRoleAssignmentFromQuery(queryMap: ParamMap): Observable<CaseRole[]> {
    this.assignmentId = queryMap.get('assignmentId');
    this.caseId = queryMap.get('caseId');
    this.jurisdiction = queryMap.get('jurisdiction');
    const caseType = queryMap.get('caseType');
    return this.allocateRoleService.getCaseRoles(this.caseId, this.jurisdiction, caseType, this.assignmentId).pipe(
      mergeMap((caseRoles: CaseRole[]) => this.allocateRoleService.getCaseRolesUserDetails(getJudicialUserIds(caseRoles), [this.jurisdiction]).pipe(
        map((caseRolesWithUserDetails: CaseRoleDetails[]) => mapCaseRoles(caseRoles, caseRolesWithUserDetails))
      )),
    );
  }

  public onNavEvent(navEvent: RemoveAllocationNavigationEvent): void {
    switch (navEvent) {
      case RemoveAllocationNavigationEvent.REMOVE_ROLE_ALLOCATION: {
        this.allocateRoleService.removeAllocation(this.assignmentId).subscribe(() => {
            const message: any = { type: 'success', message: RemoveRoleText.infoMessage };
            this.router.navigate([this.backUrl], {
              state: {
                showMessage: true,
                retainMessages: true,
                message,
                messageText: RemoveRoleText.infoMessage,
              }
            });
          },
          error => {
            handleFatalErrors(error.status, this.router);
          }
        );
        break;
      }
      case RemoveAllocationNavigationEvent.CANCEL: {
        this.location.back();
        return;
      }
      default: {
        throw new Error('Invalid option');
      }
    }
  }

  private getNamesIfNeeded(): void {
    if (!this.role.name) {
      this.caseworkerDataService.getCaseworkersForServices([this.jurisdiction]).pipe(first()).subscribe(caseworkers => {
        const caseworker = caseworkers.find(givenCaseworker => givenCaseworker.idamId === this.role.actorId);
        this.role.name = `${caseworker.firstName}-${caseworker.lastName}`;
        this.role.email = caseworker.email;
        this.answers = [];
        this.populateAnswers(this.role);
      });
    }
  }

}
