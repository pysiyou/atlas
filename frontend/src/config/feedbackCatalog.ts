/**
 * Centralized user-facing feedback copy and channel mapping.
 */

export type FeedbackChannel = 'toast' | 'alert' | 'errorAlert' | 'inline';
export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info' | 'danger';

export type FeedbackId =
  | 'session.expired'
  | 'order.create.success'
  | 'order.create.error'
  | 'order.update.success'
  | 'order.update.error'
  | 'order.delete.success'
  | 'order.delete.error'
  | 'order.paymentStatus.success'
  | 'order.invoice.preview'
  | 'patient.create.success'
  | 'patient.create.error'
  | 'patient.update.success'
  | 'patient.update.error'
  | 'report.download.success'
  | 'report.download.error'
  | 'report.generate.success'
  | 'report.generate.error'
  | 'billing.claim.submit.success'
  | 'billing.claim.submit.error'
  | 'payment.record.success'
  | 'payment.process.error'
  | 'auth.login.fieldsRequired'
  | 'lab.collection.authRequired'
  | 'lab.collection.invalidSample'
  | 'lab.collection.colorRequired'
  | 'lab.collection.containerRequired'
  | 'lab.collection.popover.colorRequired'
  | 'lab.collection.popover.containerRequired'
  | 'lab.collection.success'
  | 'lab.collection.refreshWarning'
  | 'lab.collection.networkAmbiguous'
  | 'lab.collection.error'
  | 'lab.collection.printLabel.error'
  | 'lab.collection.printLabel.genericError'
  | 'lab.entry.noResults'
  | 'lab.entry.testNotFound'
  | 'lab.entry.parametersMissing'
  | 'lab.entry.save.success'
  | 'lab.entry.save.error'
  | 'lab.entry.modalUnavailable'
  | 'lab.entry.selectInvalid'
  | 'lab.validation.approve.success'
  | 'lab.validation.approve.networkAmbiguous'
  | 'lab.validation.approve.error'
  | 'lab.validation.testUnavailable'
  | 'lab.recollection.approve.success'
  | 'lab.recollection.approve.error'
  | 'lab.recollection.deny.success'
  | 'lab.recollection.deny.error'
  | 'lab.escalation.permissionDenied'
  | 'lab.escalation.resolve.success'
  | 'lab.escalation.resolve.error'
  | 'lab.qualityIssue.report.error'
  | 'lab.history.sampleNotFound'
  | 'lab.history.testNotFound'
  | 'lab.history.testLoadFailed'
  | 'lab.critical.profileMissing'
  | 'lab.critical.recipientRequired'
  | 'lab.critical.notify.success'
  | 'lab.critical.notify.error'
  | 'lab.critical.readBackRequired'
  | 'lab.critical.ack.success'
  | 'lab.critical.ack.error'
  | 'lab.qualityIssue.reported'
  | 'lab.qualityIssue.escalate'
  | 'lab.qualityIssue.escalate.limitHit'
  | 'lab.qualityIssue.retest'
  | 'lab.qualityIssue.retest.limitHit'
  | 'lab.qualityIssue.recollection.requested'
  | 'lab.qualityIssue.specimenRejected'
  | 'lab.qualityIssue.cancelled'
  | 'lab.qualityIssue.options.loadFailed'
  | 'lab.escalation.readBack.providerRequired'
  | 'lab.escalation.readBack.confirmRequired'
  | 'lab.escalation.recollect.reasonRequired'
  | 'lab.escalation.cancel.reasonRequired'
  | 'orders.list.loadFailed'
  | 'patients.list.loadFailed'
  | 'catalog.list.loadFailed'
  | 'catalog.bootstrap.loadFailed'
  | 'reports.list.loadFailed'
  | 'payments.list.loadFailed'
  | 'lab.page.loadFailed'
  | 'billing.claims.loadFailed'
  | 'patients.affiliation.pricingLoadFailed'
  | 'lab.history.panel.loadFailed'
  | 'payment.amount.mustBePositive'
  | 'payment.orderAmount.invalid'
  | 'payment.alreadyPaid'
  | 'auth.login.profileLoadFailed'
  | 'auth.login.failed'
  | 'auth.login.network'
  | 'auth.login.timeout'
  | 'auth.login.invalidCredentials'
  | 'api.networkError'
  | 'api.sessionExpired'
  | 'api.permissionDenied'
  | 'api.notFound'
  | 'api.conflict'
  | 'api.serverError'
  | 'api.timeout'
  | 'lab.qualityIssue.reject.error'
  | 'lab.collection.printLabel.uncollected'
  | 'lab.collection.printLabel.popupBlocked'
  | 'lab.entry.fieldInvalid'
  | 'lab.entry.fixValidationBeforeSubmit'
  | 'catalog.detail.notFoundTitle'
  | 'catalog.detail.notFoundDescription'
  | 'patient.detail.notFoundTitle'
  | 'patient.detail.notFoundDescription';

export interface FeedbackEntry {
  channel: FeedbackChannel;
  variant: FeedbackVariant;
  title: string;
  subtitle?: string;
}

export const FEEDBACK_CATALOG: Record<FeedbackId, FeedbackEntry> = {
  'session.expired': {
    channel: 'toast',
    variant: 'error',
    title: 'Session expired',
    subtitle: 'Please log in again.',
  },
  'order.create.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Order created',
    subtitle: 'The order has been saved and is ready for collection.',
  },
  'order.create.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to create order',
  },
  'order.update.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Order updated',
    subtitle: 'The order has been saved with the latest changes.',
  },
  'order.update.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to update order',
    subtitle: 'The order could not be updated. Please try again.',
  },
  'order.delete.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Order deleted',
    subtitle: 'The order has been removed.',
  },
  'order.delete.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to delete order',
    subtitle: 'The order could not be deleted. Please try again.',
  },
  'order.paymentStatus.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Payment status updated',
    subtitle: 'The order payment record has been saved.',
  },
  'order.invoice.preview': {
    channel: 'toast',
    variant: 'info',
    title: 'Invoice',
  },
  'patient.create.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Patient created',
    subtitle: 'The patient record has been saved.',
  },
  'patient.create.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to create patient',
  },
  'patient.update.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Patient updated',
    subtitle: 'The patient record has been saved.',
  },
  'patient.update.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to update patient',
  },
  'report.download.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Report downloaded successfully',
    subtitle:
      'The report has been generated and the download should start shortly. Check your downloads folder.',
  },
  'report.download.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to generate report',
    subtitle:
      'The report could not be generated. Please try again or contact support if the issue persists.',
  },
  'report.generate.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Report generated',
    subtitle: 'The report is ready to view or download.',
  },
  'report.generate.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to generate report',
    subtitle: 'Please try again or contact support if the issue persists.',
  },
  'billing.claim.submit.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Claim submitted',
    subtitle: 'The insurance claim has been recorded for this invoice.',
  },
  'billing.claim.submit.error': {
    channel: 'alert',
    variant: 'danger',
    title: 'Failed to submit claim',
  },
  'payment.record.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Payment recorded',
    subtitle: 'The order payment status has been updated.',
  },
  'payment.process.error': {
    channel: 'inline',
    variant: 'danger',
    title: 'Failed to process payment',
  },
  'auth.login.fieldsRequired': {
    channel: 'inline',
    variant: 'danger',
    title: 'Please enter both username and password',
  },
  'lab.collection.authRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'You must be logged in to collect samples',
    subtitle: 'Please sign in to record sample collections, then try again.',
  },
  'lab.collection.invalidSample': {
    channel: 'toast',
    variant: 'error',
    title: 'Invalid sample data',
    subtitle:
      'The sample or requirement data is missing or invalid. Refresh the page and try again.',
  },
  'lab.collection.colorRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Container color is required',
    subtitle: 'Select the container cap color before confirming the collection.',
  },
  'lab.collection.containerRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Container type is required',
    subtitle: 'Select the container type (e.g. cup or tube) before confirming the collection.',
  },
  'lab.collection.popover.colorRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Please select the top color',
    subtitle: 'Select the container cap color used for this sample.',
  },
  'lab.collection.popover.containerRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Please select the container type',
    subtitle: 'Select tube or cup used for this sample.',
  },
  'lab.collection.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Sample collected',
    subtitle:
      'The sample has been recorded and the order has been updated. You can continue with the next sample.',
  },
  'lab.collection.refreshWarning': {
    channel: 'toast',
    variant: 'warning',
    title: 'Collection saved',
    subtitle:
      'The sample was collected, but the list could not be refreshed. Reload the page to see the latest status.',
  },
  'lab.collection.networkAmbiguous': {
    channel: 'toast',
    variant: 'warning',
    title: 'Action may have completed',
    subtitle: 'The request did not complete. Please refresh the page to see the latest status.',
  },
  'lab.collection.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to collect sample',
    subtitle: 'The collection could not be saved. Check your connection and try again.',
  },
  'lab.collection.printLabel.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to print label',
    subtitle: 'The label could not be printed. Check your printer and try again.',
  },
  'lab.collection.printLabel.genericError': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to print label',
    subtitle: 'Ensure the printer is connected and the sample data is valid.',
  },
  'lab.entry.noResults': {
    channel: 'toast',
    variant: 'error',
    title: 'No results to save',
    subtitle:
      'There are no results entered for this test. Enter values in the required fields before saving.',
  },
  'lab.entry.testNotFound': {
    channel: 'toast',
    variant: 'error',
    title: 'Test not found in current list',
    subtitle:
      'This test could not be found in the current order. The list may have been updated—refresh and try again.',
  },
  'lab.entry.parametersMissing': {
    channel: 'toast',
    variant: 'error',
    title: 'Test parameters not found',
    subtitle: 'The test configuration could not be loaded. Refresh the page or contact support.',
  },
  'lab.entry.save.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Results saved successfully',
    subtitle:
      'The results have been saved and the order has been updated. You can continue with other tests.',
  },
  'lab.entry.save.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to save results',
    subtitle: 'The results could not be saved. Check your connection and try again.',
  },
  'lab.entry.modalUnavailable': {
    channel: 'toast',
    variant: 'error',
    title: 'Unable to open result entry',
    subtitle: 'Refresh the page and try again.',
  },
  'lab.entry.selectInvalid': {
    channel: 'toast',
    variant: 'error',
    title: 'Invalid selection value',
    subtitle: 'Choose a valid option from the list before saving.',
  },
  'lab.validation.approve.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Results approved',
    subtitle:
      'These results have been approved and are now final. The order status has been updated.',
  },
  'lab.validation.approve.networkAmbiguous': {
    channel: 'toast',
    variant: 'warning',
    title: 'Action may have completed',
    subtitle: 'The request did not complete. Please refresh the page to see the latest status.',
  },
  'lab.validation.approve.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to validate results',
    subtitle:
      'The validation request failed. Please try again or contact support if the issue persists.',
  },
  'lab.validation.testUnavailable': {
    channel: 'toast',
    variant: 'error',
    title: 'Test record unavailable',
    subtitle: 'Refresh the page and try again.',
  },
  'lab.recollection.approve.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Recollection approved',
    subtitle: 'A pending collection tube is now available in Sample Collection.',
  },
  'lab.recollection.approve.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to approve recollection',
    subtitle: 'Please try again.',
  },
  'lab.recollection.deny.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Recollection denied',
    subtitle: 'Affected tests have been cancelled.',
  },
  'lab.recollection.deny.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to deny recollection',
    subtitle: 'Please try again.',
  },
  'lab.escalation.permissionDenied': {
    channel: 'toast',
    variant: 'error',
    title: 'You do not have permission to resolve escalations.',
    subtitle: 'Ask a supervisor or administrator to complete this action.',
  },
  'lab.escalation.resolve.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Escalation resolved',
    subtitle: 'The escalation has been resolved and the test status updated.',
  },
  'lab.escalation.resolve.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to resolve escalation',
    subtitle: 'Check the details and try again.',
  },
  'lab.qualityIssue.report.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to report quality issue',
    subtitle: 'Check the details and try again.',
  },
  'lab.history.sampleNotFound': {
    channel: 'toast',
    variant: 'error',
    title: 'Sample not found',
    subtitle: 'It may have been removed.',
  },
  'lab.history.testNotFound': {
    channel: 'toast',
    variant: 'error',
    title: 'Test not found',
    subtitle: 'This test is no longer in the current workflow list.',
  },
  'lab.history.testLoadFailed': {
    channel: 'toast',
    variant: 'error',
    title: 'Test record not found',
  },
  'lab.critical.profileMissing': {
    channel: 'toast',
    variant: 'error',
    title: 'Cannot acknowledge',
    subtitle: 'Your user profile is missing a name. Sign in again and retry.',
  },
  'lab.critical.recipientRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Recipient required',
    subtitle: 'Enter who was notified.',
  },
  'lab.critical.notify.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Notification recorded',
  },
  'lab.critical.notify.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to record notification',
  },
  'lab.critical.readBackRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Read-back required',
    subtitle: 'Confirm provider read-back before acknowledging.',
  },
  'lab.critical.ack.success': {
    channel: 'toast',
    variant: 'success',
    title: 'Critical value acknowledged',
  },
  'lab.critical.ack.error': {
    channel: 'toast',
    variant: 'error',
    title: 'Failed to acknowledge critical value',
  },
  'lab.qualityIssue.reported': {
    channel: 'toast',
    variant: 'success',
    title: 'Quality issue reported',
    subtitle: 'The issue has been recorded and the workflow updated.',
  },
  'lab.qualityIssue.escalate': {
    channel: 'toast',
    variant: 'success',
    title: 'Escalated to supervisor',
    subtitle: 'This test has been sent to the escalation queue for supervisor review.',
  },
  'lab.qualityIssue.escalate.limitHit': {
    channel: 'toast',
    variant: 'success',
    title: 'Escalated to supervisor',
    subtitle:
      'Re-test limit reached. A supervisor must approve before another run — find it under Awaiting supervisor approval on Review.',
  },
  'lab.qualityIssue.retest': {
    channel: 'toast',
    variant: 'success',
    title: 'Re-test requested',
    subtitle: 'A new result entry has been created using the same sample.',
  },
  'lab.qualityIssue.retest.limitHit': {
    channel: 'toast',
    variant: 'success',
    title: 'Escalated for re-test approval',
    subtitle: 'Re-test limit reached. The test is on Review awaiting supervisor approval.',
  },
  'lab.qualityIssue.recollection.requested': {
    channel: 'toast',
    variant: 'success',
    title: 'Recollection request submitted',
    subtitle: 'A supervisor will review before the patient is contacted.',
  },
  'lab.qualityIssue.specimenRejected': {
    channel: 'toast',
    variant: 'success',
    title: 'Specimen rejected',
    subtitle: 'Linked resulted tests remain in Review for validator decision.',
  },
  'lab.qualityIssue.cancelled': {
    channel: 'toast',
    variant: 'success',
    title: 'Cancelled',
    subtitle: 'The selected work item(s) were cancelled.',
  },
  'lab.qualityIssue.options.loadFailed': {
    channel: 'alert',
    variant: 'danger',
    title: 'Failed to load options',
  },
  'lab.escalation.readBack.providerRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Provider read-back required',
    subtitle: 'Enter provider name and contact for critical value release.',
  },
  'lab.escalation.readBack.confirmRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Read-back confirmation required',
    subtitle: 'Confirm provider read-back before force-validating critical results.',
  },
  'lab.escalation.recollect.reasonRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Reason required',
    subtitle: 'Provide a clinical reason to authorize re-collection.',
  },
  'lab.escalation.cancel.reasonRequired': {
    channel: 'toast',
    variant: 'error',
    title: 'Reason required',
    subtitle: 'Provide a clinical reason to cancel this test.',
  },
  'orders.list.loadFailed': {
    channel: 'errorAlert',
    variant: 'danger',
    title: 'Failed to load orders',
  },
  'patients.list.loadFailed': {
    channel: 'errorAlert',
    variant: 'danger',
    title: 'Failed to load patients',
  },
  'catalog.list.loadFailed': {
    channel: 'errorAlert',
    variant: 'danger',
    title: 'Failed to load test catalog',
  },
  'catalog.bootstrap.loadFailed': {
    channel: 'errorAlert',
    variant: 'danger',
    title: 'Failed to load tests',
  },
  'reports.list.loadFailed': {
    channel: 'errorAlert',
    variant: 'danger',
    title: 'Failed to load reports',
  },
  'payments.list.loadFailed': {
    channel: 'errorAlert',
    variant: 'danger',
    title: 'Failed to load data',
  },
  'lab.page.loadFailed': {
    channel: 'errorAlert',
    variant: 'danger',
    title: 'Failed to load laboratory data',
  },
  'billing.claims.loadFailed': {
    channel: 'errorAlert',
    variant: 'danger',
    title: 'Failed to load insurance claims',
  },
  'patients.affiliation.pricingLoadFailed': {
    channel: 'inline',
    variant: 'danger',
    title: 'Failed to load pricing. Please try again.',
  },
  'lab.history.panel.loadFailed': {
    channel: 'inline',
    variant: 'danger',
    title: 'Failed to load history.',
  },
  'payment.amount.mustBePositive': {
    channel: 'inline',
    variant: 'danger',
    title: 'Amount must be greater than 0',
  },
  'payment.orderAmount.invalid': {
    channel: 'inline',
    variant: 'danger',
    title: 'Invalid order amount',
  },
  'payment.alreadyPaid': {
    channel: 'inline',
    variant: 'danger',
    title: 'This order is already paid. Refresh the page to see the latest status.',
  },
  'auth.login.profileLoadFailed': {
    channel: 'inline',
    variant: 'danger',
    title: 'Failed to load user after login. Please try again.',
  },
  'auth.login.failed': {
    channel: 'inline',
    variant: 'danger',
    title: 'Login failed. Please try again.',
  },
  'auth.login.network': {
    channel: 'inline',
    variant: 'danger',
    title: 'Unable to connect to server. Please check your connection.',
  },
  'auth.login.timeout': {
    channel: 'inline',
    variant: 'danger',
    title: 'Request timed out. Please try again.',
  },
  'auth.login.invalidCredentials': {
    channel: 'inline',
    variant: 'danger',
    title: 'Invalid username or password',
  },
  'api.networkError': {
    channel: 'inline',
    variant: 'danger',
    title: 'Network error. Please check your connection and try again.',
  },
  'api.sessionExpired': {
    channel: 'toast',
    variant: 'error',
    title: 'Session expired. Please log in again.',
  },
  'api.permissionDenied': {
    channel: 'inline',
    variant: 'danger',
    title: 'You do not have permission to perform this action.',
  },
  'api.notFound': {
    channel: 'inline',
    variant: 'danger',
    title: 'The requested resource was not found.',
  },
  'api.conflict': {
    channel: 'inline',
    variant: 'danger',
    title: 'A conflict occurred. The resource may have been modified.',
  },
  'api.serverError': {
    channel: 'inline',
    variant: 'danger',
    title: 'A server error occurred. Please try again later.',
  },
  'api.timeout': {
    channel: 'inline',
    variant: 'danger',
    title: 'The request timed out. Please try again.',
  },
  'lab.qualityIssue.reject.error': {
    channel: 'inline',
    variant: 'danger',
    title: 'Failed to reject results',
  },
  'lab.collection.printLabel.uncollected': {
    channel: 'toast',
    variant: 'error',
    title: 'Cannot print label for uncollected sample',
    subtitle: 'Collect the sample before printing a label.',
  },
  'lab.collection.printLabel.popupBlocked': {
    channel: 'toast',
    variant: 'error',
    title: 'Please allow popups to print labels',
    subtitle: 'Enable popups for this site in your browser settings, then try again.',
  },
  'lab.entry.fieldInvalid': {
    channel: 'inline',
    variant: 'danger',
    title: 'Invalid value',
  },
  'lab.entry.fixValidationBeforeSubmit': {
    channel: 'inline',
    variant: 'danger',
    title: 'Please correct invalid values before submitting',
  },
  'catalog.detail.notFoundTitle': {
    channel: 'inline',
    variant: 'danger',
    title: 'Test Not Found',
  },
  'catalog.detail.notFoundDescription': {
    channel: 'inline',
    variant: 'danger',
    title: 'The test could not be found in the catalog.',
  },
  'patient.detail.notFoundTitle': {
    channel: 'inline',
    variant: 'danger',
    title: 'Patient Not Found',
  },
  'patient.detail.notFoundDescription': {
    channel: 'inline',
    variant: 'danger',
    title: 'The patient could not be found.',
  },
};
