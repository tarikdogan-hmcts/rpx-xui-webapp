const { v4 } = require('uuid');
const ArrayUtil = require("../../e2e/utils/ArrayUtil");
const WorkAllocationDataModels = require("../../dataModels/workAllocation");
const nodeAppMock = require('../nodeApp/mockData');
class WorkAllocationMockData {

    constructor() {
        this.locationIdCounter = 10000; 

        this.WorkAllocationDataModels = WorkAllocationDataModels;
        this.init(); 
    }

    init(){
        this.setDefaultData();
    }

    setDefaultData(){
        this.findPersonsAllAdata = [];
        this.waSupportedJusridictions = ['IA', 'SSCS'];

        this.locationsByServices = this.getLocationsByServices(this.waSupportedJusridictions);

        this.caseWorkersList = this.getPersonList(20); 
        this.judgeUsers = this.setUpJudicialUsersList(20);
        
        this.caseworkersByService = this.getCaseworkersByService(this.waSupportedJusridictions);

        this.exclusions = this.getCaseExclusions([
            { added: '2021-10-12T12:14:42.230129Z', name: 'judeg a', userType: 'JUDICIAL', type: 'CASE', id: '12345678901' },
            { added: '2021-10-12T12:14:42.230129Z', name: 'judeg b', userType: 'JUDICIAL', type: 'CASE', id: '12345678902' },
            { added: '2021-10-12T12:14:42.230129Z', name: 'judeg c', userType: 'JUDICIAL', type: 'CASE', id: '12345678903' },
            { added: '2021-10-12T12:14:42.230129Z', name: 'legal a', userType: 'LEGAL_OPERATIONS', type: 'CASE', id: '12345678904' }
        ]);

        this.caseRoles = this.getCaseRoles([
            { added: '2021-10-12T12:14:42.230129Z', name: 'judeg a', userType: 'JUDICIAL', type: 'CASE', id: '12345678901', roleCategory: 'JUDICIAL', roleName: 'lead-judge' },
            { added: '2021-10-12T12:14:42.230129Z', name: 'judeg b', userType: 'JUDICIAL', type: 'CASE', id: '12345678902', roleCategory: 'JUDICIAL', roleName: 'lead-judge' },
            { added: '2021-10-12T12:14:42.230129Z', name: 'judeg c', userType: 'JUDICIAL', type: 'CASE', id: '12345678903', roleCategory: 'JUDICIAL', roleName: 'lead-judge' },
            { added: '2021-10-12T12:14:42.230129Z', name: 'legal a', userType: 'LEGAL_OPERATIONS', type: 'CASE', id: '12345678904', roleCategory: 'LEGAL_OPERATIONS', roleName: 'case-manager' }
        ]);
        const tasks = [
            { task_title: 'task 1', dueDate: -1, created_date: -10, permissions: "Own,Execute,Manage", warnings: "true", assignee: this.caseWorkersList[0].idamId, description: 'Click link to proceed to next step [case details link next step](/case/case-details/${[CASE_REFERENCE]})'},
            { task_title: 'task 2', dueDate: 0, created_date: -10, permissions: "Own,Execute,Manage", warnings: "true", assignee: this.judgeUsers[0].sidam_id, description: 'Click link to proceed to task [Task link next step](/case/case-details/${[id]})'},
            { task_title: 'task 3', dueDate: 1, created_date: -10, permissions: "Own,Execute,Manage", warnings: "true", assignee: "soneone" },
            { task_title: 'task 4', dueDate: 10, created_date: -10, permissions: "Own,Execute,Manage", warnings: "true", assignee: "soneone" }
        ];
        this.caseTasks = this.getCaseTasks(tasks);

        this.caseRoleForAssignment = [this.caseRoles[0]];

        this.myWorkMyTasks = this.getMyWorkMyTasks(150);
        this.myWorkAvailableTasks = this.getMyWorkAvailableTasks(200);
        this.allWorkTasks = this.getAllWorkTasks(300);

        this.myCases = this.getWACases(125);
        this.allWorkCases = this.getWACases(125);

        this.taskDetails = { task: this.getRelease2TaskDetails() } 
    }

    getCaseTasksForCaseId(caseId){
        for (const task of this.caseTasks){
            task.case_id = caseId; 
        }
        return this.caseTasks;
    }

    addCaseworkerWithIdamId(idamId, service){
        let user = null;

        let locationsByService = null;
        for(const byService of this.locationsByServices){
            if (byService.service === service){
                locationsByService = byService.locations;
                break; 
            }
        }

        for(const byservice of this.caseworkersByService){
            if(byservice.service === service){
                const personWithIdamd = JSON.parse(JSON.stringify(this.getPersonList(1)[0]));
                personWithIdamd.idamId = idamId;
                personWithIdamd.location = {
                    id: locationsByService[0].epimms_id,
                        locationName: locationsByService[0].court_name
                }; 
                byservice.caseworkers.push(personWithIdamd);
                user = personWithIdamd; 
                break; 
            }
        }
        return user;
    }

    addCaseworker(caseworker, service) {
        let caseworketByService = null;

        let locationsByService = null;
        for (const byService of this.locationsByServices) {
            if (byService.service === service) {
                locationsByService = byService.locations;
                break;
            }
        }

        for (const byservice of this.caseworkersByService) {
            if (byservice.service === service) {
                const personWithIdamd = JSON.parse(JSON.stringify(this.getPersonList(1)[0]));

                personWithIdamd.idamId = caseworker.idamId;
                personWithIdamd.firstName = caseworker.firstName;
                personWithIdamd.lastName = caseworker.lastName;
                personWithIdamd.email = caseworker.email;
                personWithIdamd.roleCategory = caseworker.roleCategory; 


                personWithIdamd.location = {
                    id: locationsByService[0].epimms_id,
                    locationName: locationsByService[0].court_name
                };
                byservice.caseworkers.push(personWithIdamd);
                break;
            }
        }
    }

    getLocationsByServices(services){
       const  locationsByService = [];
        
        for(const service of services){
            const byService = {service : service , locations : []};
            for(let i = 0; i < 20; i++){
                const location = {
                    "court_venue_id": "382",
                    "epimms_id": "" + this.locationIdCounter,
                    "is_hearing_location": "Y",
                    "is_case_management_location": "Y",
                    "site_name": service + ' Site ' + this.locationIdCounter,
                    "court_name": service + ' court ' + this.locationIdCounter,
                    "venue_name": service + ' court ' + this.locationIdCounter,
                    "court_status": "Open",
                    "region_id": "2",
                    "region": "London",
                    "court_type_id": "23",
                    "court_type": "Immigration and Asylum Tribunal",
                    "cluster_name": "Tribunal",
                    "open_for_public": "Yes",
                    "court_address": "YORK HOUSE AND WELLINGTON HOUSE, 2-3 DUKES GREEN, FELTHAM, MIDDLESEX",
                    "postcode": "TW14 0LS"
                }

                byService.locations.push(location); 
                this.locationIdCounter++;
            }
            locationsByService.push(byService);

        }
        return locationsByService; 
    }

    getLocationsWithNames(locations) {
        const returnValue = [];
        
        for (const location of locations) {
            const locationOBj = {
                "court_venue_id": "382",
                "epimms_id": "" + location.id,
                "is_hearing_location": "Y",
                "is_case_management_location": "Y",
                "site_name": location.locationName,
                "court_name": location.locationName,
                "venue_name":  location.locationName,
                "court_status": "Open",
                "region_id": "2",
                "region": "London",
                "court_type_id": "23",
                "court_type": "Immigration and Asylum Tribunal",
                "cluster_name": "Tribunal",
                "open_for_public": "Yes",
                "court_address": "YORK HOUSE AND WELLINGTON HOUSE, 2-3 DUKES GREEN, FELTHAM, MIDDLESEX",
                "postcode": "TW14 0LS"
            }

            returnValue.push(locationOBj);
            this.locationIdCounter++;
        }
        return returnValue;
    }

    updateWASupportedJurisdictions(jurisdictions){
        this.waSupportedJusridictions = jurisdictions;
        this.caseworkersByService = this.getCaseworkersByService(this.waSupportedJusridictions);
    }

    getCaseworkersByService(services){
        const caseworkersByServices = [];
        for (const service of services){
            const cwByService = { service: service, caseworkers : []}
            cwByService.caseworkers = this.getPersonList(20, null, service);

            let locationsForThisService = null;
            for(const locationsByService of this.locationsByServices){
                if (locationsByService.service === service){
                    locationsForThisService = locationsByService.locations;
                    break; 
               } 
            }

            let loctionTracker = 0;
            for (const cw of cwByService.caseworkers){
                cw.location = { id: locationsForThisService[loctionTracker].epimms_id ,
                    locationName: locationsForThisService[loctionTracker].court_name };

                loctionTracker++;
                if (loctionTracker >=locationsForThisService.length){
                    loctionTracker = 0;
                } 
            }

            caseworkersByServices.push(cwByService); 
        }
        return caseworkersByServices;
    }

    setUpJudicialUsersList(count){
        this.judgeUsers = [];
        for (let i = 0; i < count; i++) {
            this.addJudgeUsers('fnuser-' + i, 'snjudge-' + i, `testjudge_${i}@judidicial.com`);
        }
        return this.judgeUsers;
    }

    addJudgeUsers(idamId,firtName, surname, email){
        const judge = WorkAllocationDataModels.getRefDataJudge(firtName, surname, email);
        judge.sidam_id = idamId;
        let location = null;
        for(const service of this.locationsByServices){
            location = service.locations[0];
            break;
        }
        judge.appointments[0]['base_location_id'] = location.epimms_id;
        judge.appointments[0]['epimms_id'] = location.epimms_id;
        judge.appointments[0]['court_name'] = location.court_name;
        
        this.judgeUsers.push(judge);
        return judge; 
    }

    setCaseRoleAssignment(caseRole){
        this.caseRoleForAssignment  = this.getCaseRoles([caseRole]);
    }


    setCasesWithPermissionsForView(viewInTest,casePermissionHashes){
        const cases = [];
        let view = viewInTest.split(" ").join("");
        view = view.toLowerCase();
        for (let i = 0; i < casePermissionHashes.length; i++) {

            let caseCount = casePermissionHashes[i]['Count'];
            for (let j = 0; j < caseCount; j++) {
                cases.push(this.getRelease2CaseWithPermission(casePermissionHashes[i]['Roles'].split(","), view));
            }
            const validRoleTypes = WorkAllocationDataModels.getValidRoles();

            let validRoleCounter = 0;
            for (const caseAlloc of cases) {
                caseAlloc.case_role = validRoleTypes[validRoleCounter].roleId;
                caseAlloc.role_category = validRoleTypes[validRoleCounter].roleCategory;
                validRoleCounter++;
                if (validRoleCounter >= validRoleTypes.length) {
                    validRoleCounter = 0;
                }
            }

        }
        const casesResponse = { cases: cases, total_records: cases.length };
        switch (view) {
            case 'mycases':
                this.myCases = casesResponse;
                break;

            case 'allworkcases':
                this.allWorkCases = casesResponse;
                break;
            default:
                throw new Error(`Cases view not recognised in test step "${viewInTest}"`);
        }
    }

    async getFindPersonsDataFrom(database) {
        return await ArrayUtil.map(database, async (personDetails) => {
            let personModel = WorkAllocationDataModels.getFindPersonObj();
            let personDetailsKeys = Object.keys(personDetails);

            await ArrayUtil.map(personDetailsKeys, async (key) => {
                personModel[key] = personDetails[key];
            });
            return personModel;
        });
    }

    getMyTasks(count) {
        const taskActions = [
            { "id": "reassign", "title": "Reassign task" },
            { "id": "unclaim", "title": "Unassign task" },
            { "id": "go", "title": "Go to case" }
        ];
        return this.getRelease1TaskList(25, taskActions);
    }

    getAvailableTasks(count) {
        const taskActions = [
            { "id": "claim", "title": "Assign to me" },
            { "id": "claim-and-go", "title": "Assign to me and go to case" }
        ];
        let tasks = this.getRelease1TaskList(25, taskActions);
        tasks.tasks.forEach(task => task.assignee = null);
        return tasks;
    }

    getTaskManagerTasks(count) {
        const taskActions = [
            { "id": "reassign", "title": "Reassign task" },
            { "id": "unclaim", "title": "Unassign task" },
            { "id": "complete", "title": "Mark as done" },
            { "id": "cancel", "title": "Cancel task" }
        ];
        return this.getRelease1TaskList(25, taskActions);
    }

    getMyWorkMyTasks(count) {
        let tasks = { tasks: [], total_records: count };
        for (let i = 0; i < count; i++) {
            tasks.tasks.push(this.getRelease2TaskWithPermissions(["Manage", "Read"], "MyTasks", "assigned"));
        }
        return tasks;
    }

    getMyWorkAvailableTasks(count) {
        let tasks = { tasks: [], total_records: count };
        for (let i = 0; i < count; i++) {
            tasks.tasks.push(this.getRelease2TaskWithPermissions(["Manage", "Read","Own"], "AvailableTasks", null));
        }
        return tasks;
    }

    getAllWorkTasks(count) {
        let tasks = { tasks: [], total_records: count };
        for (let i = 0; i < count; i++) {
            tasks.tasks.push(this.getRelease2TaskWithPermissions(["Manage", "Read","Execute"], "AllWork", null));
        }
        return tasks;
    }

    getWACases(count) {
       let casesResponse =  { cases: [], total_records: count };
        for (let i = 0; i < count; i++) {
            casesResponse.cases.push(this.getRelease2CaseWithPermission(['case-allocator'], "MyCases", "assigned"));
        }
        const validRoleTypes = WorkAllocationDataModels.getValidRoles();

        let validRoleCounter = 0;
        for (const caseAlloc of casesResponse.cases){
            caseAlloc.case_role = validRoleTypes[validRoleCounter].roleId;
            caseAlloc.role_category = validRoleTypes[validRoleCounter].roleCategory;
            validRoleCounter++;
            if (validRoleCounter >= validRoleTypes.length){
                validRoleCounter = 0;
            }
        }

       
        casesResponse.total_records = casesResponse.cases.length;
        return casesResponse;

    }

    getRelease1TaskList(count, actions) {
        const taskActions = actions ? actions : [
            { "id": "reassign", "title": "Reassign task" },
            { "id": "unclaim", "title": "Release this task" }
        ];
        const tasks = [];
        for (let i = 0; i < count; i++) {
            const taskDueDate = `"2021-02-16T18:58:48.987+0000"`;
            let task = WorkAllocationDataModels.getRelease1Task();;
            task.id = v4();
            task.assignee = v4();
            task.name = task.name + " " + i
            task.task_title = task.task_title + " " + i
            task.location = task.location + i
            task.case_id = task.case_id + 1;
            task.taskName = task.taskName + 1;
            task.caseName = task.caseName + 1;
            task.actions = taskActions;

            tasks.push(task);
        }
        return { tasks: tasks, total_records: 150 };
    }

    getPersonList(count,roleCategory,forService) {
        const persons = [];
        for (let ctr = 0; ctr < count; ctr++) {
            persons.push({
                "firstName": "Jane " + ctr,
                "lastName": "Doe" + (forService ? forService : ''),
                "idamId": "00000-d756-4eba-8e85-5b5bf56b31f" + ctr,
                "email": "testemail" + ctr + "@testdomain.com",
                "roleCategory": roleCategory ? roleCategory : "LEGAL_OPERATIONS",
                "location": {
                    "id": "a",
                    "locationName": "Location A",
                    "services": [
                        "a"
                    ]
                }
            });
        }
        return persons;
    }

    getCaseworkersList(count) {
        return this.caseWorkersList;
    }

    getJudicialList() {
       
        return this.judgeUsers;
    }

    getTaskDetails() {
        return {
            "task": WorkAllocationDataModels.getRelease1Task()
        }
    }

    getRelease2TaskDetails() {
        return WorkAllocationDataModels.getRelease2Task()
    }


    getLocation(locationId) {
        locationId = locationId ? locationId : 10001
        return {
            id: locationId,
            locationName: "testloc " + locationId,
            services: ['Test service 1', 'Test service 2']
        }
    }

    getLocationList(count) {
        const locations = [];
        for (let i = 0; i < count - 1; i++) {
            locations.push(this.getLocation(9000 + i));
        }
        locations.push({
            id: 'a', locationName: 'Taylor House', services: ['a']
        });
        return locations;
    }


    getRelease2TaskWithPermissions(permissions, view, assignState) {
        view = view.replace(" ", "");
        const task = WorkAllocationDataModels.getRelease2Task();;
        task.permissions = permissions;
        task.actions = WorkAllocationDataModels.getRelease2TaskActions(permissions, view, assignState);

        return task;
    }

    getRelease2CaseWithPermission(permissions, view, assignState) {
        view = view.replace(" ", "");
        const waCase = WorkAllocationDataModels.getRelease2Case();
       
        waCase.permissions = permissions;
        waCase.actions = WorkAllocationDataModels.getRelease2CaseActions(permissions, view, assignState);

        return waCase;
    }

    findPersonResponse(searchOptions) {

        const results = [];

        if (searchOptions.userRole === 'Judicial'){
           for(const judge of this.judgeUsers){
               if (judge.full_name.includes(searchOptions.searchTerm)){
                  
                   results.push({ ...judge, name: judge.full_name, email: judge.email_id, id: judge.sidam_id });
            } 
           }
        } else if (searchOptions.userRole === 'LegalOps'){
            for (const cw of this.caseWorkersList) {
                if (cw.firstName.includes(searchOptions.searchTerm) || cw.lastName.includes(searchOptions.searchTerm) ) {
                    results.push(cw);
                }
            }
        } else if (searchOptions.userRole === 'All'){
            for (const judge of this.judgeUsers) {
                if (judge.full_name.includes(searchOptions.searchTerm)) {

                    results.push({ ...judge, name: judge.full_name, email: judge.email_id, id: judge.sidam_id });
                }
            }
            for (const cw of this.caseWorkersList) {
                if (cw.firstName.includes(searchOptions.searchTerm) || cw.lastName.includes(searchOptions.searchTerm)) {
                    results.push(cw);
                }
            }
        }


       
        return results;
    }


    getExclusionRoleCategories() {
        const roleCategories = [];
        const judicial = WorkAllocationDataModels.getRoleCategory();
        judicial.roleId = "judicial";
        judicial.roleName = "Judicial"

        const legalOps = WorkAllocationDataModels.getRoleCategory();
        legalOps.roleId = "legalOps";
        legalOps.roleName = "Legal Ops"

        const admin = WorkAllocationDataModels.getRoleCategory();
        admin.roleId = "admin";
        admin.roleName = "Admin"

        roleCategories.push(judicial);
        roleCategories.push(legalOps);
        roleCategories.push(admin);
        return roleCategories;

    }

    getRoles(services) {
        const serviceRoles = [];
        services.forEach(service => {
            serviceRoles.push({
                service:service,
                roles: WorkAllocationDataModels.getValidRoles()
            }) 
        }); 
        return serviceRoles;

    }

    getCaseRole(){
        return WorkAllocationDataModels.getCaseRole()
    }

    getCaseRoles(roles) {
        const caseRolesRes = [];
        for (const role of roles) {
            const caseRoleObj = WorkAllocationDataModels.getCaseRole(role.roleCategory);
            caseRoleObj['roleId'] = role.roleName;
            for (let key of Object.keys(role)) {
                caseRoleObj[key] = role[key];
            }

            caseRolesRes.push(caseRoleObj);
        }
        return caseRolesRes;
    }

    getCaseExclusions(exclusions) {
        const caseExlusionsRes = [];
        for (const exclusion of exclusions) {
            const caseExclusionObj = WorkAllocationDataModels.getCaseRole();

            for (let key of Object.keys(exclusion)) {
                caseExclusionObj[key] = exclusion[key];
            }

            caseExlusionsRes.push(caseExclusionObj);
        }
        return caseExlusionsRes;
    }

    getCaseTasks(tasksObjects, userDetails) {

        const tasks = [];
        for (let task of tasksObjects) {
            const taskTemplate = this.getRelease2TaskDetails();
            let taskPermissions = [];
            const taskAttributes = Object.keys(task);
            for (const taskAttribute of taskAttributes) {
                if (taskAttribute.toLowerCase().includes('date')) {
                    const dateObj = new Date();
                    dateObj.setDate(dateObj.getDate() + parseInt(task[taskAttribute]));
                    taskTemplate[taskAttribute] = dateObj.toISOString();
                } else if (taskAttribute.toLowerCase().includes('permissions')) {
                    if (task[taskAttribute] === '') {
                        taskTemplate[taskAttribute].values = [];
                    } else {
                        taskPermissions = task[taskAttribute].split(','); 
                        taskTemplate[taskAttribute].values = taskPermissions;

                    }

                } else if (taskAttribute.toLowerCase().includes('warnings')) {
                    const val = task[taskAttribute].toLowerCase();
                    taskTemplate[taskAttribute] = val.includes('true') || val.includes('yes');
                } else if (taskAttribute.toLowerCase().trim() === 'assignee') {
                    const val = task[taskAttribute].toLowerCase();
                    if (val.includes('session')) {
                        taskTemplate[taskAttribute] = nodeAppMock.userDetails.userInfo.uid ? nodeAppMock.userDetails.userInfo.uid : nodeAppMock.userDetails.userInfo.id;
                    } else if (val === '' || val === undefined) {
                        taskTemplate[taskAttribute] = null;
                    } else if (val === 'someone' ) {
                        taskTemplate[taskAttribute] = this.caseWorkersList[0].idamId;
                    }  else {
                        taskTemplate[taskAttribute] = task[taskAttribute];
                    }
                    taskTemplate.task_state= taskTemplate[taskAttribute] ? 'assigned':'unassigned'

                } else if (taskAttribute.toLowerCase().includes('description')) {
                    const val = task[taskAttribute];
                    if (val !== '' || val !== undefined) {
                        taskTemplate[taskAttribute] = val;
                    } else {
                        delete taskTemplate[taskAttribute];
                    }
                }
                else if (taskAttribute.toLowerCase().includes('id')) {
                    if (task[taskAttribute] !== ''){
                        taskTemplate[taskAttribute] = task[taskAttribute];
                    }
                }
                else {
                    taskTemplate[taskAttribute] = task[taskAttribute];
                }
            }
            taskTemplate.actions = WorkAllocationDataModels.getRelease2TaskActions(taskPermissions, 'AllWork', taskTemplate.task_state); 

            taskTemplate.jurisdiction = "IA";
            tasks.push(taskTemplate);

        }
        return tasks;
    }


    getTaskRoles(){
        return [
            {
                "role_category": "JUDICIAL",
                "role_name": "lead-judge",
                "permissions": [
                    "OWN",
                    "EXECUTE",
                    "READ",
                    "MANAGE",
                    "CANCEL"
                ],
                "authorisations": [
                    "IAC",
                    "SSCS"
                ]
            },
            {
                "role_category": "LEGAL_OPERATIONS",
                "role_name": "case-manager",
                "permissions": [
                    "EXECUTE",
                    "READ",
                    "MANAGE",
                    "CANCEL"
                ],
                "authorisations": [
                    "IAC",
                    "SSCS"
                ]
            },
            {
                "role_category": "JUDICIAL",
                "role_name": "hearing-judge",
                "permissions": [
                    "EXECUTE",
                    "READ"
                ],
                "authorisations": [
                    "IAC"
                ]
            }
        ]
    }


    getTypeOfWorks(){
        return [
            { key: "hearing_work", label: "Hearing work"},
            { key: "upper_tribunal", label: "Upper Tribunal" },
            { key: "routine_work", label: "Routine work" },
            { key: "decision_making_work", label: "Decision-making work" },
            { key: "applications", label: "Applications" },
            { key: "priority", label: "Priority" },
            { key: "access_requests", label: "Access requests" },
            { key: "error_management", label: "Error management" }
        ]
    }

    retrieveCaseWorkersForServices(services,allServices){

        const caseWorkerForServices = [];
        for(const byService of this.caseworkersByService){
            if (allServices){
                caseWorkerForServices.push(byService);
            } else if(services && services.includes(byService.service)){
                caseWorkerForServices.push(byService);
           }else{
                //throw new Error(`retrieveCaseWorkersForServices request services or fullservices atre not set.`);
           }
        }
        return caseWorkerForServices;
        
    }

    addLocationWithNamesToService(locations, service){

    }

    searchLocations(serviceIds, searchTerm){
        const locationsByService = {};
        const servicesAvailable = [];
        for (const locationByService of this.locationsByServices) {
            servicesAvailable.push(locationsByService.service); 
            locationsByService[locationByService.service] = locationByService.locations;
        }

        let matchingLocations = [];
        const serviceids = serviceIds.split(",");
        for (const service of serviceids) {
            const locations = locationsByService[service];
            if (!locations){
                throw new Error(`Mock locations nor found or configured for service ${service} : configured services ${servicesAvailable}`);
            }
            for (const loc of locations) {
                if (loc.court_name.includes(searchTerm) ||
                    loc.court_address.includes(searchTerm) ||
                    loc.site_name.includes(searchTerm)) {
                    matchingLocations.push(loc);
                }
            }
        }
        return matchingLocations;
    }

    getLocationById(locationId){
        const allLocations = [];
        for(const locationsByService of this.locationsByServices){
            allLocations.push(...locationsByService.locations);
        }

        let locationMatchingId = null;
        for (const location of allLocations) {
            if (location.epimms_id === locationId) {
                locationMatchingId = location;
                break;
            }
        }
        return locationMatchingId;
       
    }


}



module.exports = new WorkAllocationMockData();

const findPersonsDetails = [
    { domain: 1, email: "Aleena.Agarwal@justice.gov.uk", id: "", name: "Aleena Agarwal" },
    { domain: 1, email: "Tommy.Wong@justice.gov.uk", id: "", name: "Tommy Wong" },
    { domain: 1, email: "Adnan.Akgun@justice.gov.uk", id: "", name: "Adnan Akgun" },
    { domain: 1, email: "Andy.Wilkins@justice.gov.uk", id: "", name: "Andy Wilkins" },
    { domain: 1, email: "Connor.McElroy@justice.gov.uk", id: "", name: "Connor McElroy" },
    { domain: 1, email: "Daniel.Lam@justice.gov.uk", id: "", name: "Daniel Lam " },
    { domain: 1, email: "Ernest.Man@justice.gov.uk", id: "", name: "Ernest Man" },
    { domain: 1, email: "Ishita.Oswal@justice.gov.uk", id: "", name: "Ishita Oswal" },
    { domain: 1, email: "jamie.Mistry@justice.gov.uk", id: "", name: "jamie Mistry" },
    { domain: 1, email: "Kuda.Nyamainashe@justice.gov.uk", id: "", name: "Kuda Nyamainashe" },
    { domain: 1, email: " Lefkos.HadjiPavlou@justice.gov.uk", id: "", name: " Lefkos HadjiPavlou" },
    { domain: 1, email: "Mariana.Pereira@justice.gov.uk", id: "", name: "Mariana Pereira" },
    { domain: 1, email: "Mohammed.Lala@justice.gov.uk", id: "", name: "Mohammed Lala" },
    { domain: 1, email: "Paul.Graham@justice.gov.uk", id: "", name: "Paul Graham" },
    { domain: 1, email: "Paul.Howes@justice.gov.uk", id: "", name: "Paul Howes" },
    { domain: 1, email: "Ray.Liang @justice.gov.uk", id: "", name: "Ray Liang " },
    { domain: 1, email: "ritesh.dsouza@justice.gov.uk", id: "", name: "ritesh dsouza" },
    { domain: 1, email: "Ronald.Mansveld@justice.gov.uk", id: "", name: "Ronald Mansveld" },
    { domain: 1, email: "Sreekanth.Puligadda@justice.gov.uk", id: "", name: "Sreekanth Puligadda" },
    { domain: 1, email: "Uday.Denduluri @justice.gov.uk", id: "", name: "Uday Denduluri " },
    { domain: 1, email: "Vamshi.Muniganti @justice.gov.uk", id: "", name: "Vamshi Muniganti " },
];
