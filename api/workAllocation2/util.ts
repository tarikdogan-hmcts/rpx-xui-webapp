import { AxiosResponse } from 'axios';
import * as express from 'express';
import { getConfigValue } from '../configuration';
import { SERVICES_CCD_DATA_STORE_API_PATH, SERVICES_ROLE_ASSIGNMENT_API_PATH } from '../configuration/references';

import { http } from '../lib/http';
import { EnhancedRequest } from '../lib/models';
import { setHeaders } from '../lib/proxy';
import { RoleCategory } from '../roleAccess/models/allocate-role.enum';
import { release2ContentType } from '../roleAccess/models/release2ContentType';
import { Role } from '../roleAccess/models/roleType';
import { ElasticSearchQuery } from '../searchCases/interfaces/ElasticSearchQuery';
import { CASE_ALLOCATOR_ROLE } from '../user/constants';
import { RoleAssignment } from '../user/interfaces/roleAssignment';

import {exists, reflect} from '../lib/util';
import { TaskPermission, VIEW_PERMISSIONS_ACTIONS_MATRIX, ViewType } from './constants/actions';
import {getCaseListPromises} from "./index";
import {Case, CaseList} from './interfaces/case';
import { PaginationParameter } from './interfaces/caseSearchParameter';
import { CaseworkerPayload, ServiceCaseworkerData } from './interfaces/caseworkerPayload';
import {
  Action,
  CaseDataType,
  Caseworker,
  CaseworkerApi,
  CaseworkersByService,
  Location,
  LocationApi
} from './interfaces/common';
import { Person, PersonRole } from './interfaces/person';
import { RoleCaseData } from './interfaces/roleCaseData';
import { SearchTaskParameter } from './interfaces/taskSearchParameter';

export function prepareGetTaskUrl(baseUrl: string, taskId: string): string {
  return `${baseUrl}/task/${taskId}`;
}

export function preparePostTaskUrlAction(baseUrl: string, taskId: string, action: string): string {
  return `${baseUrl}/task/${taskId}/${action}`;
}

export function prepareSearchCaseUrl(baseUrl: string, subPath?: string) {
  if (subPath) {
    return `${baseUrl}/${subPath}`;
  }
  return `${baseUrl}/case`;
}

export function prepareSearchTaskUrl(baseUrl: string, subPath?: string) {
  if (subPath) {
    return `${baseUrl}/${subPath}`;
  }
  return `${baseUrl}/task`;
}

export function prepareGetLocationByIdUrl(baseUrl: string, locationId: string): string {
  return `${baseUrl}/location/${locationId}`;
}

export function prepareGetLocationsUrl(baseUrl: string, serviceCode: string = 'BFA1'): string {
  return `${baseUrl}/refdata/location/court-venues/services?service_code=${serviceCode}`;
}

export function prepareRoleApiUrl(baseUrl: string) {
  return `${baseUrl}/am/role-assignments/query`;
}

export function prepareCaseWorkerSearchUrl(baseUrl: string) {
  return `${baseUrl}/caseworker/search`;
}

export function prepareTaskSearchForCompletable(baseUrl: string) {
  return `${baseUrl}/task/search-for-completable`;
}

export function prepareCaseWorkerForLocation(baseUrl: string, locationId: string) {
  return `${baseUrl}/caseworker/location/${locationId}`;
}

export function prepareCaseWorkerForService(baseUrl: string, serviceId: string) {
  return `${baseUrl}/caseworker/service/${serviceId}`;
}

export function prepareCaseWorkerForLocationAndService(baseUrl: string, locationId: string, serviceId: string) {
  return `${baseUrl}/caseworker/location/${locationId}/service/${serviceId}`;
}

export function preparePaginationUrl(req: EnhancedRequest, postPath: string): string {
  if (req.body && req.body.searchRequest && req.body.searchRequest.pagination_parameters) {
    const paginationConfig = req.body.searchRequest.pagination_parameters;
    const pageSize = paginationConfig.page_size;
    const pageNumber = (paginationConfig.page_number - 1) * pageSize;
    return `${postPath}?first_result=${pageNumber}&max_results=${pageSize}`;
  }
  return postPath;
}

/**
 * The below sets up actions on the tasks, though it's expected this will change
 * in the future - it should do fine for the MVP, though.
 * @param tasks The tasks to set up the actions for.
 * @param view This dictates which set of actions we should use.
 */
export function assignActionsToTasks(tasks: any[], view: any, currentUser: string): any[] {
  const allWorkView = ViewType.ALL_WORK;
  const activeTasksView = ViewType.ACTIVE_TASKS;
  const tasksWithActions: any[] = [];
  if (tasks) {
    for (const task of tasks) {
      task.dueDate = task.due_date;
      let thisView = view;
      if (view === allWorkView) {
        thisView = task.assignee ? ViewType.ALL_WORK_ASSIGNED : ViewType.ALL_WORK_UNASSIGNED;
      }
      if (view === activeTasksView) {
        thisView = ViewType.ACTIVE_TASKS_UNASSIGNED;
        if (task.assignee) {
          thisView = currentUser === task.assignee ?
            ViewType.ACTIVE_TASKS_ASSIGNED_CURRENT : ViewType.ACTIVE_TASKS_ASSIGNED_OTHER;
        }
      }
      const permissions = task.permissions && task.permissions.values && Array.isArray(task.permissions.values)
        ? task.permissions.values : task.permissions;
      const actions: Action[] = getActionsByPermissions(thisView, permissions);
      const taskWithAction = {...task, actions};
      tasksWithActions.push(taskWithAction);
    }
  }
  return tasksWithActions;
}

/**
 * NOTE: These comments are copied from the assignActionsToTasks method
 * The below sets up actions on the cases, though it's expected this will change
 * in the future - it should do fine for the MVP, though.
 * @param cases The cases to set up the actions for.
 * @param view This dictates which set of actions we should use.
 * @param isAllocator User is caseAllocator
 */
export function assignActionsToCases(cases: any[], isAllocator: boolean): any[] {
  const casesWithActions: any[] = [];
  if (cases) {
    for (const item of cases) {
      const actions: Action[] = getActionsFromAllocatorRole(isAllocator);
      const caseWithAction = {...item, actions};
      casesWithActions.push(caseWithAction);
    }
  }
  return casesWithActions;
}

export function getSessionCaseworkerInfo(serviceIds: string[], caseworkersByServices: CaseworkersByService[]):
 [string[], CaseworkersByService[]] {
  const caseworkersInSession: CaseworkersByService[] = [];
  const servicesNotInSession: string[] = [];
  serviceIds.forEach(thisService => {
    const currentCaseworkers = caseworkersByServices.find(caseworkerServiceList => caseworkerServiceList.service === thisService);
    if (currentCaseworkers && currentCaseworkers.caseworkers) {
      caseworkersInSession.push(currentCaseworkers);
    } else {
      servicesNotInSession.push(thisService);
    }
  });
  return [servicesNotInSession, caseworkersInSession];
}

export function getCaseworkerDataForServices(caseWorkerData: CaseworkerApi[], roleAssignmentsByService: ServiceCaseworkerData[]):
 CaseworkersByService[] {
  const allNewCaseworkersByService: CaseworkersByService[] = [];
  roleAssignmentsByService.forEach(roleAssignmentByService => {
    const roleAssignmentResponse = roleAssignmentByService.data.roleAssignmentResponse;
    const caseworkersByCurrentService: CaseworkersByService = {service: roleAssignmentByService.jurisdiction, caseworkers: []};
    if (roleAssignmentResponse && roleAssignmentResponse.length > 0) {
      const caseworkers = mapCaseworkerData(caseWorkerData, roleAssignmentResponse);
      caseworkersByCurrentService.caseworkers = caseworkers;
    }
    allNewCaseworkersByService.push(caseworkersByCurrentService);
  });
  return allNewCaseworkersByService;
}

export function mapCaseworkerData(caseWorkerData: CaseworkerApi[], roleAssignments: RoleAssignment[]): Caseworker[] {
  const caseworkers: Caseworker[] = [];
  if (caseWorkerData) {
    caseWorkerData.forEach((caseWorkerApi: CaseworkerApi) => {
      const thisCaseWorker: Caseworker = {
        email: caseWorkerApi.email_id,
        firstName: caseWorkerApi.first_name,
        idamId: caseWorkerApi.id,
        lastName: caseWorkerApi.last_name,
        location: mapCaseworkerPrimaryLocation(caseWorkerApi.base_location),
        roleCategory: getRoleCategory(roleAssignments, caseWorkerApi),
      };
      caseworkers.push(thisCaseWorker);
    });
  }
  return caseworkers;
}

export function getRoleCategory(roleAssignments: RoleAssignment[], caseWorkerApi: CaseworkerApi): string {
  const roleAssignment = roleAssignments.find(roleAssign => roleAssign.actorId === caseWorkerApi.id);
  return roleAssignment ? roleAssignment.roleCategory : null;
}

export function mapCaseworkerPrimaryLocation(baseLocation: LocationApi[]): Location {
  let primaryLocation: Location = null;
  if (baseLocation) {
    baseLocation.forEach((location: LocationApi) => {
      if (location.is_primary) {
        primaryLocation = {
          id: location.location_id,
          locationName: location.location,
          services: location.services,
        };
      }
    });
  }
  return primaryLocation;
}

export function prepareRoleApiRequest(jurisdictions: string[], locationId?: number): any {
  const attributes: any = {
    jurisdiction: jurisdictions,
  };

  const payload = {
    attributes,
    roleName: ['hearing-centre-admin', 'case-manager', 'ctsc', 'tribunal-caseworker',
      'hmcts-legal-operations', 'task-supervisor', 'hmcts-admin',
      'national-business-centre', 'senior-tribunal-caseworker', 'case-allocator'],
    roleType: ['ORGANISATION'],
    validAt: Date.UTC,
  };
  if (locationId) {
    payload.attributes.primaryLocation = [locationId];
  }
  return payload;
}

export function prepareServiceRoleApiRequest(jurisdictions: string[], roles: Role[], locationId?: number): CaseworkerPayload[] {
  // note that this could be moved to index method if required
  const roleIds = getRoleIdsFromRoles(roles);
  const payloads: CaseworkerPayload[] = [];
  jurisdictions.forEach(jurisdiction => {
    const attributes: any = {
      jurisdiction: [jurisdiction],
    };
    if (locationId) {
      attributes.primaryLocation = [locationId];
    }
    const payload = {
      attributes,
      roleName: roleIds,
      roleType: ['ORGANISATION'],
      validAt: Date.UTC,
    };
    payloads.push(payload);
  });
  return payloads;
}

export function getRoleIdsFromRoles(roles: Role[]): string[] {
  const roleIds = [];
  roles.forEach(role => roleIds.push(role.name));
  return roleIds;
}

/**
 * Aggregate permissions from the View Permissions Actions Matrix defined by business.
 * @param view This dictates which set of actions we should use.
 * @param permissions The list of permissions the user holds.
 * @return actionList:Action[] the list of total actions user holds.
 */
export function getActionsByPermissions(view, permissions: TaskPermission[]): Action[] {
  let actionList: Action[] = [];
  permissions.forEach(permission => {
    switch (permission) {
      case TaskPermission.MANAGE:
        const manageActionList = actionList.concat(VIEW_PERMISSIONS_ACTIONS_MATRIX[view][TaskPermission.MANAGE]);
        actionList = !manageActionList.includes(undefined) ? manageActionList : actionList;
        break;
      case TaskPermission.EXECUTE:
      case TaskPermission.OWN:
        // if on active tasks and there is no manage permission do not add execute actions
        if ((view.includes(ViewType.ACTIVE_TASKS) && !permissions.includes(TaskPermission.MANAGE))) {
          break;
        }
        const executeActionList = actionList.concat(VIEW_PERMISSIONS_ACTIONS_MATRIX[view][TaskPermission.EXECUTE]);
        actionList = !executeActionList.includes(undefined) ? executeActionList : actionList;
        break;
      case TaskPermission.CANCEL:
        const cancelActionList = actionList.concat(VIEW_PERMISSIONS_ACTIONS_MATRIX[view][TaskPermission.CANCEL]);
        actionList = !cancelActionList.includes(undefined) ? cancelActionList : actionList;
        break;
      default:
        break;
    }
  });
  // Note sorting is implemented to order all possible action lists the same
  // Currently sorting by id but can be changed
  actionList =  Array.from(new Set(actionList));
  return actionList.sort((a, b) => a.id.localeCompare(b.id));
}

export function getActionsFromAllocatorRole(isAllocator: boolean): Action[] {
  let actionList: Action[] = [];
  if (isAllocator) {
    actionList = (VIEW_PERMISSIONS_ACTIONS_MATRIX.AllCases.Manage);
  }
  return actionList;
}

export function applySearchFilter(person: Person, domain: string, searchTerm: any): boolean {
  if (domain === PersonRole.ALL) {
    return person && person.name.toLowerCase().includes(searchTerm.toLowerCase());
  }
  return person && person.domain === domain && person.name.toLowerCase().includes(searchTerm.toLowerCase());
}

export async function handlePost(path: string, payload: any, req: EnhancedRequest): Promise<any> {
  const headers = setHeaders(req);
  const response: AxiosResponse = await http.post(path, payload, {headers});
  // Return the whole response, not just the data, so we can
  // see what the status of the response is.
  return response;
}

export async function getCaseIdListFromRoles(roleAssignmentList: RoleAssignment[], req: EnhancedRequest): Promise<Case[]> {
  if (!roleAssignmentList) {
    return Promise.resolve([]);
  }
  const data: CaseDataType = getCaseDataFromRoleAssignments(roleAssignmentList);

  const casePromises: Array<Promise<CaseList>> = getCaseListPromises(data, req);

  const response = await Promise.all(casePromises.map(reflect));
  const caseResults = response.filter(x => x.status === 'fulfilled' && x.value ).map( x => x.value );

  let cases = [];
  caseResults.forEach( caseResult => cases = [...cases, ...caseResult.cases]);
  return cases;
}

export function constructElasticSearchQuery(caseIds: any[], page: number, size: number): ElasticSearchQuery {
  return {
    native_es_query: {
      query: {
        terms: {
          reference: caseIds,
        },
      },
      sort: [
        // does not seem to allow sorting by case name (attempted both pre and post v6.8 syntax)
        // this is either because case name not present for all cases or because nested data cannot be sorted in this instance
        //{ "case_data.caseName": {mode: "max", order: "asc", nested_path: "case_data"}},
        { id: {order: "asc"} },
      ],
      size,
    },
    supplementary_data: ['*'],
  };
}

export async function getRoleAssignmentsByQuery(query: any, req: express.Request): Promise<any> {
  const url = getConfigValue(SERVICES_ROLE_ASSIGNMENT_API_PATH);
  const path = `${url}/am/role-assignments/query`;
  const headers = setHeaders(req, release2ContentType);
  headers.size = 10000;
  try {
    const result = await http.post(path, query, {headers});
    return result.data;
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function searchCasesById(queryParams: string, query: any, req: express.Request): Promise<CaseList> {
  const url = getConfigValue(SERVICES_CCD_DATA_STORE_API_PATH);
  const path = `${url}/searchCases`;
  const headers = setHeaders(req);
  try {
    const result = await http.post(path, query, {headers , params: { ctid: queryParams }});
    return result.data;
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function getCaseAllocatorLocations(roleAssignments: RoleAssignment[]): string[] {
  return roleAssignments.filter(roleAssignment => roleAssignment.attributes && roleAssignment.attributes.primaryLocation
    && roleAssignment.roleName === CASE_ALLOCATOR_ROLE)
    .map(roleAssignment => roleAssignment.attributes.primaryLocation)
    .reduce((acc, locationId) => acc.includes(locationId) ? acc : `${acc}${locationId},`, '')
    .split(',')
    .filter(location => location.length);
}

export function constructRoleAssignmentQuery(
  searchTaskParameters: SearchTaskParameter[]
): any {
  searchTaskParameters = [...searchTaskParameters,
    {key: 'roleType', values: 'CASE', operator: ''},
  ];
  return {
    queryRequests: [searchTaskParameters
      .map((param: SearchTaskParameter) => {
        if (param.key === 'location_id') {
          param.key = 'primaryLocation';
          const values = param.values as string;
          param.values = [values]
            .filter(location => location.length);
          return param;
        }
        if (param.key === 'role') {
          param.key = 'roleCategory';
          param.values = mapRoleType(param.values as string);
        }

        return {
          ...param, values: param.values.length ? [param.values] : [],
        };
      })
      .filter((param: SearchTaskParameter) => param.values && param.values.length)
      .reduce((acc: any, param: SearchTaskParameter) => {

        if (param.key === 'jurisdiction') {
          const attributes = acc.attributes || {};
          return {
            ...acc, attributes: {
              ...attributes,
              [param.key]: param.values,
            },
          };
        }
        return {...acc, [param.key]: param.values};
      }, {})],
  };
}

export function constructRoleAssignmentCaseAllocatorQuery(searchTaskParameters: SearchTaskParameter[], req: any): any {
  const currentUser = req.session.passport.user.userinfo;
  const userId = currentUser.id ? currentUser.id : currentUser.uid;
  let newSearchTaskParameters = JSON.parse(JSON.stringify(searchTaskParameters)) as SearchTaskParameter[];
  newSearchTaskParameters = [...newSearchTaskParameters,
    {key: 'role', values: 'case-allocator', operator: ''},
    {key: 'roleType', values: 'ORGANISATION', operator: ''}];
  return {
    queryRequests: [newSearchTaskParameters
      .filter((param: SearchTaskParameter) => param.key === 'actorId' || param.values && param.values.length)
      .map((param: SearchTaskParameter) => {
        if (param.key === 'location_id') {
          param.key = 'primaryLocation';
        }
        if (param.key === 'roleCategory') {
          param.values = mapRoleType(param.values as string);
        }

        return param;
      })
      .reduce((acc: any, param: SearchTaskParameter) => {
        if (param.key === 'actorId') {
          param.values = userId;
        }
        if (param.key === 'jurisdiction' || param.key === 'primaryLocation') {
          const attributes = acc.attributes || {};
          return {
            ...acc, attributes: {
              ...attributes,
              [param.key]: [param.values],
            },
          };
        }
        return {...acc, [param.key]: [param.values]};
      }, {})],
  };
}

export function mapRoleType(roleType: string): string {
  if (roleType === PersonRole.JUDICIAL) {
    return RoleCategory.JUDICIAL;
  }

  if (roleType === PersonRole.CASEWORKER) {
    return RoleCategory.LEGAL_OPERATIONS;
  }

  if (roleType === PersonRole.ADMIN) {
    return RoleCategory.ADMIN;
  }

  return '';
}

export function filterByLocationId(cases: Case[], locations: string[]): Case[] {
  return locations.length === 0 ? cases : cases.filter((caseDetail: Case) =>
    caseDetail.case_data.caseManagementLocation &&
    caseDetail.case_data.caseManagementLocation.baseLocation &&
    locations.includes(caseDetail.case_data.caseManagementLocation.baseLocation));
}

export function mapCasesFromData(
  caseDetails: Case[],
  roleAssignmentList: RoleAssignment[],
  paginationConfig: PaginationParameter
): RoleCaseData[] {
  if (!caseDetails) {
    return [];
  }
  const roleCaseList = [];
  caseDetails.forEach(caseDetail => {
    const rolesForCaseId = roleAssignmentList.filter(
      role => role.attributes && caseDetail.id.toString() === role.attributes.caseId
    );
    rolesForCaseId.forEach(roleAssignment => {
      const roleCase = mapRoleCaseData(roleAssignment, caseDetail);
      roleCaseList.push(roleCase);
    });
  });
  // sorting case list by case name - no longer necessary as sorting by case id through elastic search
  //const sortedCaseList = roleCaseList.sort((a, b) => a.case_name.toString().localeCompare(b.case_name));
  return roleCaseList;
}

export function mapRoleCaseData(roleAssignment: RoleAssignment, caseDetail: Case): RoleCaseData {
  return {
    assignee: roleAssignment.actorId,
    // hmctsCaseCategory will be available only if an event has been triggered
    case_category: caseDetail.case_data && caseDetail.case_data.hmctsCaseCategory ? caseDetail.case_data.hmctsCaseCategory : '',
    case_type: caseDetail.case_type_id,
    case_id: caseDetail.id,
    case_name: getCaseName(caseDetail),
    case_role: roleAssignment.roleName,
    role: roleAssignment.roleName,
    endDate: roleAssignment.endTime,
    id: roleAssignment.id,
    jurisdiction: caseDetail.jurisdiction,
    jurisdictionId: caseDetail.jurisdiction,
    role_category: roleAssignment.roleCategory,
    location_id: caseDetail.case_data &&
    caseDetail.case_data.caseManagementLocation &&
    caseDetail.case_data.caseManagementLocation.baseLocation ?
      caseDetail.case_data.caseManagementLocation.baseLocation : null,
    startDate: roleAssignment.beginTime,
  };
}

export function getCaseName(caseDetail: Case): string {
  return caseDetail.case_data && caseDetail.case_data.hmctsCaseNameInternal ?
  caseDetail.case_data.hmctsCaseNameInternal : caseDetail.id;
}

export function getCaseDataFromRoleAssignments(roleAssignments: RoleAssignment[]): CaseDataType {
  const result: CaseDataType = {};

  const roleAssignmentsFiltered = roleAssignments.filter( roleAssignment =>
      exists(roleAssignment, 'attributes.jurisdiction') &&
      exists(roleAssignment, 'attributes.caseType') &&
      exists(roleAssignment, 'attributes.caseId')
  );

  roleAssignmentsFiltered.forEach( roleAssignment => {
    const { jurisdiction, caseType, caseId } = roleAssignment.attributes;
    if (!result[jurisdiction]) {
      result[jurisdiction] = {};
    }
    if (!result[jurisdiction][caseType]) {
      result[jurisdiction][caseType] = new Set();
    }
    result[jurisdiction][caseType].add(caseId);
  });
  return result;
}

export function getSubstantiveRoles(roleAssignments: RoleAssignment[]): RoleAssignment[] {
  return roleAssignments
    .filter((roleAssignment: RoleAssignment) => roleAssignment.attributes && roleAssignment.attributes.substantive === 'Y');
}

// Note: array type may need to be changed depending on where pagination called
export function paginate<T>(array: T[], pageNumber: number, pageSize: number): T[] {
  return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
}

export function removeEmptyValues(searchRequests: SearchTaskParameter[]): SearchTaskParameter[] {
  return searchRequests.filter((searchRequest: SearchTaskParameter) => searchRequest.values && searchRequest.values.length > 0);
}

export async function getTypesOfWorkByUserId(path, req: express.Request): Promise<any> {
  const headers = setHeaders(req);
  try {
    const result = await http.get(path, {headers});
    return result.data;
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function getUniqueCasesCount(caseData: RoleCaseData[]): number {
  const caseIds = caseData ? caseData.map(caseResult => caseResult.case_id) : [];
  return new Set(caseIds).size;
}
