import { Injectable } from '@angular/core';
import { AbstractAppConfig, CaseEditorConfig } from '@hmcts/ccd-case-ui-toolkit';
import { FeatureToggleService } from '@hmcts/rpx-xui-common-lib';
import { WorkAllocationTaskService } from '../../../work-allocation/services';
import { AppUtils } from '../../app-utils';
import { AppConstants } from '../../app.constants';
import { EnvironmentService } from '../../shared/services/environment.service';
import { AppConfigService } from '../config/configuration.services';

/**
 * see more:
 * https://tools.hmcts.net/confluence/pages/viewpage.action?pageId=797343913#Integrationsteps-Caseview(`ccd-case-view`)
 * is explained why this is needed
 */

@Injectable()
export class AppConfig extends AbstractAppConfig {
  public workallocationUrl: string;
  protected config: CaseEditorConfig;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly featureToggleService: FeatureToggleService,
    private readonly environmentService: EnvironmentService
  ) {
    super();
    this.config = this.appConfigService.getEditorConfiguration() || {};
    this.featureToggleWorkAllocation();

    this.featureToggleService.getValue('mc-document-secure-mode-enabled', false).subscribe({
      next: (val) => this.config = {
        ...this.config,
        document_management_secure_enabled: val
      }
    });

    this.featureToggleService.getValue('access-management-mode', false).subscribe({
      next: (val) => this.config = {
        ...this.config,
        access_management_mode: val
      }
    });

    this.featureToggleService.getValue('access-management-basic-view-mock', {}).subscribe({
      next: (val) => this.config = {
        ...this.config,
        access_management_basic_view_mock: val
      }
    });
  }

  public load(): Promise<void> {
    return Promise.resolve();
  }

  public getLoginUrl(): string {
    return this.config.login_url;
  }

  public getApiUrl() {
    return this.config.api_url;
  }

  public getCaseDataUrl() {
    return this.config.case_data_url;
  }

  public getDocumentManagementUrl() {
    return this.config.document_management_url;
  }

  public getDocumentManagementUrlV2() {
    return this.config.document_management_url_v2;
  }

  public getDocumentSecureMode() {
    return this.config.document_management_secure_enabled;
  }

  public getRemoteDocumentManagementUrl() {
    return this.config.remote_document_management_url;
  }

  public getPostcodeLookupUrl() {
    return this.config.postcode_lookup_url;
  }

  public getOAuth2ClientId() {
    return this.config.oauth2_client_id;
  }

  public getPaymentsUrl() {
    return this.config.payments_url;
  }

  public getHrsUrl() {
    return this.config.hrs_url;
  }

  public getRemoteHrsUrl() {
    return this.config.remote_hrs_url;
  }

  public getCaseHistoryUrl(caseId: string, eventId: string) {
    return (
      this.getCaseDataUrl() +
      `/internal` +
      `/cases/${caseId}` +
      `/events/${eventId}`
    );
  }

  public getCreateOrUpdateDraftsUrl(ctid: string) {
    return this.getCaseDataUrl() + `/internal/case-types/${ctid}/drafts/`;
  }

  public getViewOrDeleteDraftsUrl(did: string) {
    return this.getCaseDataUrl() + `/drafts/${did}`;
  }

  public getActivityUrl() {
    return `${this.environmentService.get('ccdGatewayUrl')}/activity`;
  }

  public getActivityNexPollRequestMs() {
    return this.config.activity_next_poll_request_ms;
  }

  public getActivityRetry() {
    return this.config.activity_retry;
  }

  public getActivityBatchCollectionDelayMs() {
    return this.config.activity_batch_collection_delay_ms;
  }

  public getActivityMaxRequestPerBatch() {
    return this.config.activity_max_request_per_batch;
  }

  public getPrintServiceUrl() {
    return this.config.print_service_url;
  }

  public getRemotePrintServiceUrl() {
    return this.config.remote_print_service_url;
  }

  public getPaginationPageSize(): number {
    return this.config.pagination_page_size;
  }

  public getAnnotationApiUrl(): string {
    return this.config.annotation_api_url;
  }

  public getPayBulkScanBaseUrl(): string {
    return this.config.pay_bulk_scan_url;
  }

  public getBannersUrl(): string {
    return `${this.getCaseDataUrl()}/internal/banners/`;
  }

  public getPrdUrl(): string {
    return 'api/caseshare/orgs';
  }

  public getCacheTimeOut(): number {
    return 45000;
  }

  public getWorkAllocationApiUrl(): string {
    return this.workallocationUrl;
  }

  public getRefundsUrl(): string {
    return 'api/refund';
  }

  private featureToggleWorkAllocation(): void {
    this.featureToggleService
    .getValue(AppConstants.FEATURE_NAMES.currentWAFeature, 'WorkAllocationRelease2')
      .subscribe(
        (currentWorkAllocationFeature) =>
        this.workallocationUrl = currentWorkAllocationFeature === 'WorkAllocationRelease2'
          ? 'workallocation2' : 'workallocation');
  }

  public getAccessManagementMode(): boolean {
    return this.config.access_management_mode && this.environmentService.get('accessManagementEnabled');
  }

  public getAccessManagementBasicViewMock(): {} {
    return this.config.access_management_basic_view_mock;
  }

  public getLocationRefApiUrl(): string {
    return this.config.location_ref_api_url;
  }

  public getCamRoleAssignmentsApiUrl(): string {
    return this.config.cam_role_assignments_api_url;
  }
}
