import { RoutesRecognized } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let environmentService;
  let appComponent: AppComponent;
  let store: any;
  let googleTagManagerService: any;
  let timeoutNotificationService: any;
  let featureToggleService: any;
  let loggerService: any;
  let cookieService: any;
  let router: any;
  let title: any;
  let testRoute: RoutesRecognized;

  beforeEach(() => {
      store = jasmine.createSpyObj('store', ['pipe', 'dispatch']);
      googleTagManagerService = jasmine.createSpyObj('GoogleTagManagerService', ['init']);
      timeoutNotificationService = jasmine.createSpyObj('TimeoutNotificationsService', ['notificationOnChange', 'initialise']);
      featureToggleService = jasmine.createSpyObj('FeatureToggleService', ['isEnabled', 'getValue', 'initialize']);
      cookieService = jasmine.createSpyObj('CookieService', ['deleteCookieByPartialMatch']);
      loggerService = jasmine.createSpyObj('LoggerService', ['enableCookies']);
      environmentService = jasmine.createSpyObj('environmentService', ['config$']);
      testRoute = new RoutesRecognized(1, 'test', 'test', {
          url: 'test',
          root: {
              firstChild: {
                  data: { title: 'Test' },
                  url: [],
                  params: {},
                  queryParams: {},
                  fragment: '',
                  outlet: '',
                  component: '',
                  routeConfig: {},
                  root: null,
                  parent: null,
                  firstChild: null,
                  children: [],
                  pathFromRoot: [],
                  paramMap: null,
                  queryParamMap: null
              },
              data: { title: 'Test' },
              url: [],
              params: {},
              queryParams: {},
              fragment: '',
              outlet: '',
              component: '',
              routeConfig: {},
              root: null,
              parent: null,
              children: [],
              pathFromRoot: [],
              paramMap: null,
              queryParamMap: null
          }
      });
      router = { events: of(testRoute) };
      title = jasmine.createSpyObj('Title', ['setTitle']);
      appComponent = new AppComponent(store, googleTagManagerService, timeoutNotificationService, router, title, featureToggleService, loggerService, cookieService, environmentService);
  });

  it('Truthy', () => {
    expect(appComponent).toBeTruthy();
  });

  it('Calls title service', () => {
    expect(title.setTitle).toHaveBeenCalled();
  });

  it('signOutHandler', () => {
    appComponent.signOutHandler();
    expect(store.dispatch).toHaveBeenCalledTimes(2);
  });

  it('timeoutNotificationEventHandler throw Error for Invalidtype', () => {
    expect(() => appComponent.timeoutNotificationEventHandler({type: 'something'})).toThrow(new Error('Invalid Timeout Notification Event'));
  });

  it('timeoutNotificationEventHandler signout', () => {
    const spyModal = spyOn(appComponent, 'updateTimeoutModal');
    appComponent.timeoutNotificationEventHandler({eventType: 'sign-out'});
    expect(spyModal).toHaveBeenCalledWith('0 seconds', false);
    expect(store.dispatch).toHaveBeenCalledTimes(2);
  });

  it('timeoutNotificationEventHandler updateTimeoutModal', () => {
    const spyModal = spyOn(appComponent, 'updateTimeoutModal');
    appComponent.timeoutNotificationEventHandler({eventType: 'countdown', readableCountdown: '100 seconds'});
    expect(spyModal).toHaveBeenCalledWith('100 seconds', true);
  });

  it('initTimeoutNotificationService', () => {
    appComponent.initTimeoutNotificationService(10, 100);
    expect(timeoutNotificationService.initialise).toHaveBeenCalledWith({
      idleModalDisplayTime: (10 * 60) * 1000,
      totalIdleTime: (100 * 60) * 1000,
      idleServiceName: 'idleSession',
    });
  });

  it('staySignedInHandler', () => {
    const spyModal = spyOn(appComponent, 'updateTimeoutModal');
    appComponent.staySignedInHandler();
    expect(spyModal).toHaveBeenCalledWith(undefined, false);
  });

  it('updateTimeoutModal', () => {
    appComponent.updateTimeoutModal('100 seconds', false);
    expect(appComponent.timeoutModalConfig).toEqual({
      countdown: '100 seconds',
      isVisible: false
    });
  });

  it('timeoutNotificationEventHandler keepalive', () => {
    const spyModal = spyOn(appComponent, 'updateTimeoutModal');
    appComponent.timeoutNotificationEventHandler({eventType: 'keep-alive'});
    expect(spyModal).toHaveBeenCalled();
  });

  it('addIdleServiceListener', () => {
    const spy = spyOn(appComponent, 'timeoutNotificationEventHandler');
    timeoutNotificationService.notificationOnChange.and.returnValue(of({}));
    appComponent.addTimeoutNotificationServiceListener();
    expect(timeoutNotificationService.notificationOnChange).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({});
  });

  it('should call initializeFeature', () => {
    const userInfo = {
      id: '1234',
      forename: 'foreName',
      surname: 'surName',
      email: 'test@email.com',
      active: true,
      roles: ['role1', 'role2'],
      uid: '1234'
    };
    appComponent.initializeFeature(userInfo, 'clientId');
    const featureUser = {
      key: '1234',
      custom: {
        roles: ['role1', 'role2'],
        orgId: '-1'
      }
    };
    expect(featureToggleService.initialize).toHaveBeenCalledWith(featureUser, 'clientId');
  });

  it('should call userDetailsHandler', () => {
    const user = {
      sessionTimeout: {
        idleModalDisplayTime: 60,
        totalIdleTime: 60,
      },
      canShareCases: true,
      userInfo: {
        id: '1234',
        forename: 'foreName',
        surname: 'surName',
        email: 'test@email.com',
        active: true,
        roles: ['role1', 'role2'],
        uid: '1234'
      }
    };
    timeoutNotificationService.notificationOnChange.and.returnValue(of({eventType: 'keep-alive'}));
    appComponent.userDetailsHandler('clientId', user);

    expect(featureToggleService.initialize).toHaveBeenCalled();
    expect(timeoutNotificationService.initialise).toHaveBeenCalled();
  });

  it('loadAndListenForUserDetails', () => {
    appComponent.loadAndListenForUserDetails();
    environmentService.config$.and.returnValue(of({launchDarklyClientId: '4452'}));
    const userDetails = {
      sessionTimeout: {
        idleModalDisplayTime: 23434,
        totalIdleTime: 23,
      },
      canShareCases: false,
      userInfo: {
        id: '1232',
        forename: 'foreName',
        surname: 'surname',
        email: 'email@name.com',
        active: true,
        roles: ['role1', 'rol3'],
        uid: '23435'
      }
    };
    store.pipe.and.returnValue(of(userDetails));
    expect(store.pipe).toHaveBeenCalled();
  });

  it('addIdleServiceListener', () => {
      const spy = spyOn(appComponent, 'timeoutNotificationEventHandler');
      timeoutNotificationService.notificationOnChange.and.returnValue(of({}));
      appComponent.addTimeoutNotificationServiceListener();
      expect(timeoutNotificationService.notificationOnChange).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({});
  });

  describe('cookie actions', () => {

    describe('setCookieBannerVisibility()', () => {
        it('should set isCookieBannerVisible true when there is no cookie and there is a user and cookie banner is feature toggled on', () => {
            featureToggleService.isEnabled.and.returnValue(of(true));
            appComponent.handleCookieBannerFeatureToggle();
            appComponent.setUserAndCheckCookie('dummy');
            expect(appComponent.isCookieBannerVisible).toBeTruthy();
        });

        it('should set isCookieBannerVisible false when there is no cookie and there is no user and cookie banner is feature toggled on', () => {
            featureToggleService.isEnabled.and.returnValue(of(true));
            appComponent.handleCookieBannerFeatureToggle();
            expect(appComponent.isCookieBannerVisible).toBeFalsy();
        });
    });

    describe('setUserAndCheckCookie()', () => {

        it('should call setCookieBannerVisibility', () => {
            const spy = spyOn(appComponent, 'setCookieBannerVisibility');
            appComponent.setUserAndCheckCookie('dummy');
            expect(spy).toHaveBeenCalled();
        });

    });

    describe('handleCookieBannerFeatureToggle()', () => {

        it('should make a call to setCookieBannerVisibility', () => {
            const spy = spyOn(appComponent, 'setCookieBannerVisibility');
            featureToggleService.isEnabled.and.returnValue(of(true));
            appComponent.handleCookieBannerFeatureToggle();
            expect(spy).toHaveBeenCalled();
        });

    });

    describe('notifyAcceptance()', () => {

        it('should make a call to googleTagManagerService', () => {
            appComponent.notifyAcceptance();
            expect(googleTagManagerService.init).toHaveBeenCalled();
        });

        it('should make a call to loggerService', () => {
            appComponent.notifyAcceptance();
            expect(loggerService.enableCookies).toHaveBeenCalled();
        });
    });

    describe('notifyRejection()', () => {
        it('should make a call to cookieService', () => {
            appComponent.notifyRejection();
            expect(cookieService.deleteCookieByPartialMatch).toHaveBeenCalled();
        });
    });
  });

  describe('userDetailsHandler', () => {
    it('should call setUserAndCheckCookie', () => {
        const spy = spyOn(appComponent, 'setUserAndCheckCookie');
        timeoutNotificationService.notificationOnChange.and.returnValue(of({
            eventType: 'keep-alive'
        }));
        appComponent.userDetailsHandler('ldClientId', {
            sessionTimeout: {
                totalIdleTime: 10,
                idleModalDisplayTime: 100
            },
            canShareCases: false,
            userInfo: {
                id: 'dummy',
                forename: '',
                surname: '',
                email: '',
                active: true,
                roles: ['role1'],
                uid: 'u234'
            }
        });
        expect(spy).toHaveBeenCalledWith('dummy');
    });
  });
});
