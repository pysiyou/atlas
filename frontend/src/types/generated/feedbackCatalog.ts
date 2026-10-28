/**
 * User feedback catalog — GENERATED from contracts/feedback.json. DO NOT EDIT.
 */
export type FeedbackChannel = 'toast' | 'alert' | 'errorAlert' | 'inline';
export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info' | 'danger';

export type FeedbackId =
  | "api.badRequest"
  | "api.businessRule"
  | "api.conflict"
  | "api.databaseError"
  | "api.labOperation"
  | "api.networkError"
  | "api.notFound"
  | "api.permissionDenied"
  | "api.serverError"
  | "api.sessionExpired"
  | "api.timeout"
  | "api.validationError"
  | "auth.login.failed"
  | "auth.login.fieldsRequired"
  | "auth.login.invalidCredentials"
  | "auth.login.network"
  | "auth.login.profileLoadFailed"
  | "auth.login.timeout"
  | "billing.claim.submit.error"
  | "billing.claim.submit.success"
  | "billing.claims.loadFailed"
  | "catalog.bootstrap.loadFailed"
  | "catalog.detail.notFoundDescription"
  | "catalog.detail.notFoundTitle"
  | "catalog.list.loadFailed"
  | "lab.collection.authRequired"
  | "lab.collection.colorRequired"
  | "lab.collection.containerRequired"
  | "lab.collection.error"
  | "lab.collection.invalidSample"
  | "lab.collection.networkAmbiguous"
  | "lab.collection.popover.colorRequired"
  | "lab.collection.popover.containerRequired"
  | "lab.collection.printLabel.error"
  | "lab.collection.printLabel.genericError"
  | "lab.collection.printLabel.popupBlocked"
  | "lab.collection.printLabel.uncollected"
  | "lab.collection.refreshWarning"
  | "lab.collection.success"
  | "lab.collection.workContext.loadFailed"
  | "lab.critical.ack.error"
  | "lab.critical.ack.success"
  | "lab.critical.notify.error"
  | "lab.critical.notify.success"
  | "lab.critical.profileMissing"
  | "lab.critical.readBackRequired"
  | "lab.critical.recipientRequired"
  | "lab.entry.context.loadFailed"
  | "lab.entry.fieldInvalid"
  | "lab.entry.fixValidationBeforeSubmit"
  | "lab.entry.modalUnavailable"
  | "lab.entry.noResults"
  | "lab.entry.parametersMissing"
  | "lab.entry.save.error"
  | "lab.entry.save.success"
  | "lab.entry.selectInvalid"
  | "lab.entry.testNotFound"
  | "lab.escalation.cancel.reasonRequired"
  | "lab.escalation.permissionDenied"
  | "lab.escalation.readBack.confirmRequired"
  | "lab.escalation.readBack.providerRequired"
  | "lab.escalation.recollect.reasonRequired"
  | "lab.escalation.resolve.error"
  | "lab.escalation.resolve.success"
  | "lab.history.panel.loadFailed"
  | "lab.history.sampleNotFound"
  | "lab.history.testLoadFailed"
  | "lab.history.testNotFound"
  | "lab.page.loadFailed"
  | "lab.qualityIssue.cancelled"
  | "lab.qualityIssue.collection.actions.cancelUnfinished"
  | "lab.qualityIssue.collection.actions.cancelUnfinishedDescription"
  | "lab.qualityIssue.collection.actions.followUp"
  | "lab.qualityIssue.collection.actions.recollect"
  | "lab.qualityIssue.collection.actions.recollectDescription"
  | "lab.qualityIssue.collection.escalate.warningBody"
  | "lab.qualityIssue.collection.escalate.warningTitle"
  | "lab.qualityIssue.collection.reasonLabel"
  | "lab.qualityIssue.collection.recollect.warningBody"
  | "lab.qualityIssue.collection.recollect.warningTitle"
  | "lab.qualityIssue.dialog.actions.cancel"
  | "lab.qualityIssue.dialog.actions.cancelDescription"
  | "lab.qualityIssue.dialog.actions.followUp"
  | "lab.qualityIssue.dialog.actions.recollect"
  | "lab.qualityIssue.dialog.actions.recollectDescription"
  | "lab.qualityIssue.dialog.actions.retest"
  | "lab.qualityIssue.dialog.actions.retestDescription"
  | "lab.qualityIssue.dialog.actions.retestHint"
  | "lab.qualityIssue.dialog.actions.retestLimit"
  | "lab.qualityIssue.dialog.error.cancel"
  | "lab.qualityIssue.dialog.error.retry"
  | "lab.qualityIssue.dialog.escalation.reasonLabel"
  | "lab.qualityIssue.dialog.escalation.warningBody"
  | "lab.qualityIssue.dialog.escalation.warningTitle"
  | "lab.qualityIssue.dialog.loading"
  | "lab.qualityIssue.dialog.notesLabel"
  | "lab.qualityIssue.dialog.recollectBlocked"
  | "lab.qualityIssue.dialog.reject.confirm"
  | "lab.qualityIssue.dialog.reject.reasonLabel"
  | "lab.qualityIssue.dialog.reject.title"
  | "lab.qualityIssue.dialog.reject.warningBody"
  | "lab.qualityIssue.dialog.reject.warningTitle"
  | "lab.qualityIssue.dialog.trigger"
  | "lab.qualityIssue.escalate"
  | "lab.qualityIssue.escalate.limitHit"
  | "lab.qualityIssue.options.loadFailed"
  | "lab.qualityIssue.recollection.requested"
  | "lab.qualityIssue.reject.error"
  | "lab.qualityIssue.report.error"
  | "lab.qualityIssue.reported"
  | "lab.qualityIssue.retest"
  | "lab.qualityIssue.retest.limitHit"
  | "lab.qualityIssue.specimenRejected"
  | "lab.recollection.approve.error"
  | "lab.recollection.approve.success"
  | "lab.recollection.deny.error"
  | "lab.recollection.deny.success"
  | "lab.validation.approve.error"
  | "lab.validation.approve.networkAmbiguous"
  | "lab.validation.approve.success"
  | "lab.validation.testUnavailable"
  | "lab.worklist.loadFailed"
  | "order.create.error"
  | "order.create.success"
  | "order.delete.error"
  | "order.delete.success"
  | "order.invoice.preview"
  | "order.paymentStatus.success"
  | "order.update.error"
  | "order.update.success"
  | "orders.list.loadFailed"
  | "patient.create.error"
  | "patient.create.success"
  | "patient.detail.notFoundDescription"
  | "patient.detail.notFoundTitle"
  | "patient.update.error"
  | "patient.update.success"
  | "patients.affiliation.pricingLoadFailed"
  | "patients.list.loadFailed"
  | "payment.alreadyPaid"
  | "payment.amount.mustBePositive"
  | "payment.orderAmount.invalid"
  | "payment.process.error"
  | "payment.record.success"
  | "payments.list.loadFailed"
  | "report.download.error"
  | "report.download.success"
  | "report.generate.error"
  | "report.generate.success"
  | "reports.list.loadFailed"
  | "session.expired"
  | "users.create.error"
  | "users.create.success"
  | "users.disable.error"
  | "users.disable.lastAdmin"
  | "users.disable.self"
  | "users.disable.success"
  | "users.enable.error"
  | "users.enable.success"
  | "users.list.loadFailed"
  | "users.update.error"
  | "users.update.success";

export interface FeedbackEntry {
  channel: FeedbackChannel;
  variant: FeedbackVariant;
  title: string;
  subtitle?: string;
}

export const FEEDBACK_CATALOG: Record<FeedbackId, FeedbackEntry> = {
  "api.badRequest": { channel: "inline", variant: "danger", title: "The request could not be processed. Check the details and try again." },
  "api.businessRule": { channel: "inline", variant: "danger", title: "This action is not allowed by a lab business rule." },
  "api.conflict": { channel: "inline", variant: "danger", title: "A conflict occurred. The resource may have been modified." },
  "api.databaseError": { channel: "inline", variant: "danger", title: "A database error occurred. Please try again later." },
  "api.labOperation": { channel: "inline", variant: "danger", title: "The lab operation could not be completed." },
  "api.networkError": { channel: "inline", variant: "danger", title: "Network error. Please check your connection and try again." },
  "api.notFound": { channel: "inline", variant: "danger", title: "The requested resource was not found." },
  "api.permissionDenied": { channel: "inline", variant: "danger", title: "You do not have permission to perform this action." },
  "api.serverError": { channel: "inline", variant: "danger", title: "A server error occurred. Please try again later." },
  "api.sessionExpired": { channel: "toast", variant: "error", title: "Session expired. Please log in again." },
  "api.timeout": { channel: "inline", variant: "danger", title: "The request timed out. Please try again." },
  "api.validationError": { channel: "inline", variant: "danger", title: "Request validation failed. Check the highlighted fields and try again." },
  "auth.login.failed": { channel: "inline", variant: "danger", title: "Login failed. Please try again." },
  "auth.login.fieldsRequired": { channel: "inline", variant: "danger", title: "Please enter both username and password" },
  "auth.login.invalidCredentials": { channel: "inline", variant: "danger", title: "Invalid username or password" },
  "auth.login.network": { channel: "inline", variant: "danger", title: "Unable to connect to server. Please check your connection." },
  "auth.login.profileLoadFailed": { channel: "inline", variant: "danger", title: "Failed to load user after login. Please try again." },
  "auth.login.timeout": { channel: "inline", variant: "danger", title: "Request timed out. Please try again." },
  "billing.claim.submit.error": { channel: "alert", variant: "danger", title: "Failed to submit claim" },
  "billing.claim.submit.success": { channel: "toast", variant: "success", title: "Claim submitted", subtitle: "The insurance claim has been recorded for this invoice." },
  "billing.claims.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load insurance claims" },
  "catalog.bootstrap.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load tests" },
  "catalog.detail.notFoundDescription": { channel: "inline", variant: "danger", title: "The test could not be found in the catalog." },
  "catalog.detail.notFoundTitle": { channel: "inline", variant: "danger", title: "Test Not Found" },
  "catalog.list.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load test catalog" },
  "lab.collection.authRequired": { channel: "toast", variant: "error", title: "You must be logged in to collect samples", subtitle: "Please sign in to record sample collections, then try again." },
  "lab.collection.colorRequired": { channel: "toast", variant: "error", title: "Container color is required", subtitle: "Select the container cap color before confirming the collection." },
  "lab.collection.containerRequired": { channel: "toast", variant: "error", title: "Container type is required", subtitle: "Select the container type (e.g. cup or tube) before confirming the collection." },
  "lab.collection.error": { channel: "toast", variant: "error", title: "Failed to collect sample", subtitle: "The collection could not be saved. Check your connection and try again." },
  "lab.collection.invalidSample": { channel: "toast", variant: "error", title: "Invalid sample data", subtitle: "The sample or requirement data is missing or invalid. Refresh the page and try again." },
  "lab.collection.networkAmbiguous": { channel: "toast", variant: "warning", title: "Action may have completed", subtitle: "The request did not complete. Please refresh the page to see the latest status." },
  "lab.collection.popover.colorRequired": { channel: "toast", variant: "error", title: "Please select the top color", subtitle: "Select the container cap color used for this sample." },
  "lab.collection.popover.containerRequired": { channel: "toast", variant: "error", title: "Please select the container type", subtitle: "Select tube or cup used for this sample." },
  "lab.collection.printLabel.error": { channel: "toast", variant: "error", title: "Failed to print label", subtitle: "The label could not be printed. Check your printer and try again." },
  "lab.collection.printLabel.genericError": { channel: "toast", variant: "error", title: "Failed to print label", subtitle: "Ensure the printer is connected and the sample data is valid." },
  "lab.collection.printLabel.popupBlocked": { channel: "toast", variant: "error", title: "Please allow popups to print labels", subtitle: "Enable popups for this site in your browser settings, then try again." },
  "lab.collection.printLabel.uncollected": { channel: "toast", variant: "error", title: "Cannot print label for uncollected sample", subtitle: "Collect the sample before printing a label." },
  "lab.collection.refreshWarning": { channel: "toast", variant: "warning", title: "Collection saved", subtitle: "The sample was collected, but the list could not be refreshed. Reload the page to see the latest status." },
  "lab.collection.success": { channel: "toast", variant: "success", title: "Sample collected", subtitle: "The sample has been recorded and the order has been updated. You can continue with the next sample." },
  "lab.collection.workContext.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load sample collection eligibility" },
  "lab.critical.ack.error": { channel: "toast", variant: "error", title: "Failed to acknowledge critical value" },
  "lab.critical.ack.success": { channel: "toast", variant: "success", title: "Critical value acknowledged" },
  "lab.critical.notify.error": { channel: "toast", variant: "error", title: "Failed to record notification" },
  "lab.critical.notify.success": { channel: "toast", variant: "success", title: "Notification recorded" },
  "lab.critical.profileMissing": { channel: "toast", variant: "error", title: "Cannot acknowledge", subtitle: "Your user profile is missing a name. Sign in again and retry." },
  "lab.critical.readBackRequired": { channel: "toast", variant: "error", title: "Read-back required", subtitle: "Confirm provider read-back before acknowledging." },
  "lab.critical.recipientRequired": { channel: "toast", variant: "error", title: "Recipient required", subtitle: "Enter who was notified." },
  "lab.entry.context.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load this test for result entry" },
  "lab.entry.fieldInvalid": { channel: "inline", variant: "danger", title: "Invalid value" },
  "lab.entry.fixValidationBeforeSubmit": { channel: "inline", variant: "danger", title: "Please correct invalid values before submitting" },
  "lab.entry.modalUnavailable": { channel: "toast", variant: "error", title: "Unable to open result entry", subtitle: "Refresh the page and try again." },
  "lab.entry.noResults": { channel: "toast", variant: "error", title: "No results to save", subtitle: "There are no results entered for this test. Enter values in the required fields before saving." },
  "lab.entry.parametersMissing": { channel: "toast", variant: "error", title: "Test parameters not found", subtitle: "The test configuration could not be loaded. Refresh the page or contact support." },
  "lab.entry.save.error": { channel: "toast", variant: "error", title: "Failed to save results", subtitle: "The results could not be saved. Check your connection and try again." },
  "lab.entry.save.success": { channel: "toast", variant: "success", title: "Results saved successfully", subtitle: "The results have been saved and the order has been updated. You can continue with other tests." },
  "lab.entry.selectInvalid": { channel: "toast", variant: "error", title: "Invalid selection value", subtitle: "Choose a valid option from the list before saving." },
  "lab.entry.testNotFound": { channel: "toast", variant: "error", title: "Test not found in current list", subtitle: "This test could not be found in the current order. The list may have been updated—refresh and try again." },
  "lab.escalation.cancel.reasonRequired": { channel: "toast", variant: "error", title: "Reason required", subtitle: "Provide a clinical reason to cancel this test." },
  "lab.escalation.permissionDenied": { channel: "toast", variant: "error", title: "You do not have permission to resolve escalations.", subtitle: "Ask a supervisor or administrator to complete this action." },
  "lab.escalation.readBack.confirmRequired": { channel: "toast", variant: "error", title: "Read-back confirmation required", subtitle: "Confirm provider read-back before force-validating critical results." },
  "lab.escalation.readBack.providerRequired": { channel: "toast", variant: "error", title: "Provider read-back required", subtitle: "Enter provider name and contact for critical value release." },
  "lab.escalation.recollect.reasonRequired": { channel: "toast", variant: "error", title: "Reason required", subtitle: "Provide a clinical reason to authorize re-collection." },
  "lab.escalation.resolve.error": { channel: "toast", variant: "error", title: "Failed to resolve escalation", subtitle: "Check the details and try again." },
  "lab.escalation.resolve.success": { channel: "toast", variant: "success", title: "Escalation resolved", subtitle: "The escalation has been resolved and the test status updated." },
  "lab.history.panel.loadFailed": { channel: "inline", variant: "danger", title: "Failed to load history." },
  "lab.history.sampleNotFound": { channel: "toast", variant: "error", title: "Sample not found", subtitle: "It may have been removed." },
  "lab.history.testLoadFailed": { channel: "toast", variant: "error", title: "Test record not found" },
  "lab.history.testNotFound": { channel: "toast", variant: "error", title: "Test not found", subtitle: "This test is no longer in the current workflow list." },
  "lab.page.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load laboratory data" },
  "lab.qualityIssue.cancelled": { channel: "toast", variant: "success", title: "Cancelled", subtitle: "The selected work item(s) were cancelled." },
  "lab.qualityIssue.collection.actions.cancelUnfinished": { channel: "inline", variant: "info", title: "Reject tube only" },
  "lab.qualityIssue.collection.actions.cancelUnfinishedDescription": { channel: "inline", variant: "info", title: "Mark specimen rejected without opening a recollection request. Unfinished tests reset to await collection." },
  "lab.qualityIssue.collection.actions.followUp": { channel: "inline", variant: "info", title: "Unfinished linked tests" },
  "lab.qualityIssue.collection.actions.recollect": { channel: "inline", variant: "info", title: "Request recollection" },
  "lab.qualityIssue.collection.actions.recollectDescription": { channel: "inline", variant: "info", title: "Supervisor must approve before the patient is contacted for a new sample." },
  "lab.qualityIssue.collection.escalate.warningBody": { channel: "inline", variant: "warning", title: "Resulted tests will stay in Validation for the validator. Validated results will remain released." },
  "lab.qualityIssue.collection.escalate.warningTitle": { channel: "inline", variant: "warning", title: "Linked Tests Have Results" },
  "lab.qualityIssue.collection.reasonLabel": { channel: "inline", variant: "warning", title: "Sample Issue" },
  "lab.qualityIssue.collection.recollect.warningBody": { channel: "inline", variant: "warning", title: "Decide what happens to unfinished tests. Resulted tests stay in Validation with a Sample rejected signal. Validated results stay released." },
  "lab.qualityIssue.collection.recollect.warningTitle": { channel: "inline", variant: "warning", title: "Reject Sample" },
  "lab.qualityIssue.dialog.actions.cancel": { channel: "inline", variant: "info", title: "Cancel this test" },
  "lab.qualityIssue.dialog.actions.cancelDescription": { channel: "inline", variant: "info", title: "Close this test line. Other tests on the order are not affected." },
  "lab.qualityIssue.dialog.actions.followUp": { channel: "inline", variant: "info", title: "Send to" },
  "lab.qualityIssue.dialog.actions.recollect": { channel: "inline", variant: "info", title: "Request recollection" },
  "lab.qualityIssue.dialog.actions.recollectDescription": { channel: "inline", variant: "info", title: "Reject the sample and submit a recollection request — supervisor must approve before the patient is redrawn." },
  "lab.qualityIssue.dialog.actions.retest": { channel: "inline", variant: "info", title: "Re-test same sample" },
  "lab.qualityIssue.dialog.actions.retestDescription": { channel: "inline", variant: "info", title: "Supersede this result and create a new entry on the same tube." },
  "lab.qualityIssue.dialog.actions.retestHint": { channel: "inline", variant: "warning", title: "(supervisor approval required)" },
  "lab.qualityIssue.dialog.actions.retestLimit": { channel: "inline", variant: "warning", title: "Re-test limit reached. Submitting will escalate to a supervisor for approval." },
  "lab.qualityIssue.dialog.error.cancel": { channel: "inline", variant: "info", title: "Cancel" },
  "lab.qualityIssue.dialog.error.retry": { channel: "inline", variant: "info", title: "Retry" },
  "lab.qualityIssue.dialog.escalation.reasonLabel": { channel: "inline", variant: "danger", title: "Rejection Reason" },
  "lab.qualityIssue.dialog.escalation.warningBody": { channel: "inline", variant: "warning", title: "Re-test attempts are exhausted. You can still choose re-test — it will escalate to a supervisor for approval before another run." },
  "lab.qualityIssue.dialog.escalation.warningTitle": { channel: "inline", variant: "warning", title: "Re-test Limit Reached" },
  "lab.qualityIssue.dialog.loading": { channel: "inline", variant: "info", title: "Loading options..." },
  "lab.qualityIssue.dialog.notesLabel": { channel: "inline", variant: "info", title: "Additional Context / Notes" },
  "lab.qualityIssue.dialog.recollectBlocked": { channel: "inline", variant: "warning", title: "Cannot collect new sample - order has validated tests" },
  "lab.qualityIssue.dialog.reject.confirm": { channel: "inline", variant: "danger", title: "Submit Rejection" },
  "lab.qualityIssue.dialog.reject.reasonLabel": { channel: "inline", variant: "warning", title: "Result rejection reason" },
  "lab.qualityIssue.dialog.reject.title": { channel: "inline", variant: "danger", title: "Reject Results" },
  "lab.qualityIssue.dialog.reject.warningBody": { channel: "inline", variant: "warning", title: "Select a rejection reason and where to send this test. The system will not decide automatically." },
  "lab.qualityIssue.dialog.reject.warningTitle": { channel: "inline", variant: "warning", title: "Choose Next Step" },
  "lab.qualityIssue.dialog.trigger": { channel: "inline", variant: "danger", title: "Reject" },
  "lab.qualityIssue.escalate": { channel: "toast", variant: "success", title: "Escalated to supervisor", subtitle: "This test has been sent to the escalation queue for supervisor review." },
  "lab.qualityIssue.escalate.limitHit": { channel: "toast", variant: "success", title: "Escalated to supervisor", subtitle: "Re-test limit reached. A supervisor must approve before another run — find it under Awaiting supervisor approval on Validation." },
  "lab.qualityIssue.options.loadFailed": { channel: "alert", variant: "danger", title: "Failed to load options" },
  "lab.qualityIssue.recollection.requested": { channel: "toast", variant: "success", title: "Recollection request submitted", subtitle: "A supervisor will review before the patient is contacted." },
  "lab.qualityIssue.reject.error": { channel: "inline", variant: "danger", title: "Failed to reject results" },
  "lab.qualityIssue.report.error": { channel: "toast", variant: "error", title: "Failed to report quality issue", subtitle: "Check the details and try again." },
  "lab.qualityIssue.reported": { channel: "toast", variant: "success", title: "Quality issue reported", subtitle: "The issue has been recorded and the workflow updated." },
  "lab.qualityIssue.retest": { channel: "toast", variant: "success", title: "Re-test requested", subtitle: "A new result entry has been created using the same sample." },
  "lab.qualityIssue.retest.limitHit": { channel: "toast", variant: "success", title: "Escalated for re-test approval", subtitle: "Re-test limit reached. The test is on Validation awaiting supervisor approval." },
  "lab.qualityIssue.specimenRejected": { channel: "toast", variant: "success", title: "Sample rejected", subtitle: "Linked resulted tests remain in Validation for validator decision." },
  "lab.recollection.approve.error": { channel: "toast", variant: "error", title: "Failed to approve recollection", subtitle: "Please try again." },
  "lab.recollection.approve.success": { channel: "toast", variant: "success", title: "Recollection approved", subtitle: "A pending collection tube is now available in Sample Collection." },
  "lab.recollection.deny.error": { channel: "toast", variant: "error", title: "Failed to deny recollection", subtitle: "Please try again." },
  "lab.recollection.deny.success": { channel: "toast", variant: "success", title: "Recollection denied", subtitle: "Affected tests have been cancelled." },
  "lab.validation.approve.error": { channel: "toast", variant: "error", title: "Failed to validate results", subtitle: "The validation request failed. Please try again or contact support if the issue persists." },
  "lab.validation.approve.networkAmbiguous": { channel: "toast", variant: "warning", title: "Action may have completed", subtitle: "The request did not complete. Please refresh the page to see the latest status." },
  "lab.validation.approve.success": { channel: "toast", variant: "success", title: "Results approved", subtitle: "These results have been approved and are now final. The order status has been updated." },
  "lab.validation.testUnavailable": { channel: "toast", variant: "error", title: "Test record unavailable", subtitle: "Refresh the page and try again." },
  "lab.worklist.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load the lab worklist" },
  "order.create.error": { channel: "toast", variant: "error", title: "Failed to create order" },
  "order.create.success": { channel: "toast", variant: "success", title: "Order created", subtitle: "The order has been saved and is ready for collection." },
  "order.delete.error": { channel: "toast", variant: "error", title: "Failed to delete order", subtitle: "The order could not be deleted. Please try again." },
  "order.delete.success": { channel: "toast", variant: "success", title: "Order deleted", subtitle: "The order has been removed." },
  "order.invoice.preview": { channel: "toast", variant: "info", title: "Invoice" },
  "order.paymentStatus.success": { channel: "toast", variant: "success", title: "Payment status updated", subtitle: "The order payment record has been saved." },
  "order.update.error": { channel: "toast", variant: "error", title: "Failed to update order", subtitle: "The order could not be updated. Please try again." },
  "order.update.success": { channel: "toast", variant: "success", title: "Order updated", subtitle: "The order has been saved with the latest changes." },
  "orders.list.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load orders" },
  "patient.create.error": { channel: "toast", variant: "error", title: "Failed to create patient" },
  "patient.create.success": { channel: "toast", variant: "success", title: "Patient created", subtitle: "The patient record has been saved." },
  "patient.detail.notFoundDescription": { channel: "inline", variant: "danger", title: "The patient could not be found." },
  "patient.detail.notFoundTitle": { channel: "inline", variant: "danger", title: "Patient Not Found" },
  "patient.update.error": { channel: "toast", variant: "error", title: "Failed to update patient" },
  "patient.update.success": { channel: "toast", variant: "success", title: "Patient updated", subtitle: "The patient record has been saved." },
  "patients.affiliation.pricingLoadFailed": { channel: "inline", variant: "danger", title: "Failed to load pricing. Please try again." },
  "patients.list.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load patients" },
  "payment.alreadyPaid": { channel: "inline", variant: "danger", title: "This order is already paid. Refresh the page to see the latest status." },
  "payment.amount.mustBePositive": { channel: "inline", variant: "danger", title: "Amount must be greater than 0" },
  "payment.orderAmount.invalid": { channel: "inline", variant: "danger", title: "Invalid order amount" },
  "payment.process.error": { channel: "inline", variant: "danger", title: "Failed to process payment" },
  "payment.record.success": { channel: "toast", variant: "success", title: "Payment recorded", subtitle: "The order payment status has been updated." },
  "payments.list.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load data" },
  "report.download.error": { channel: "toast", variant: "error", title: "Failed to generate report", subtitle: "The report could not be generated. Please try again or contact support if the issue persists." },
  "report.download.success": { channel: "toast", variant: "success", title: "Report downloaded successfully", subtitle: "The report has been generated and the download should start shortly. Check your downloads folder." },
  "report.generate.error": { channel: "toast", variant: "error", title: "Failed to generate report", subtitle: "Please try again or contact support if the issue persists." },
  "report.generate.success": { channel: "toast", variant: "success", title: "Report generated", subtitle: "The report is ready to view or download." },
  "reports.list.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load reports" },
  "session.expired": { channel: "toast", variant: "error", title: "Session expired", subtitle: "Please log in again." },
  "users.create.error": { channel: "toast", variant: "error", title: "Failed to create user" },
  "users.create.success": { channel: "toast", variant: "success", title: "User created" },
  "users.disable.error": { channel: "toast", variant: "error", title: "Failed to disable user" },
  "users.disable.lastAdmin": { channel: "toast", variant: "error", title: "Cannot disable the last active administrator" },
  "users.disable.self": { channel: "toast", variant: "error", title: "You cannot disable your own account" },
  "users.disable.success": { channel: "toast", variant: "success", title: "User disabled" },
  "users.enable.error": { channel: "toast", variant: "error", title: "Failed to enable user" },
  "users.enable.success": { channel: "toast", variant: "success", title: "User enabled" },
  "users.list.loadFailed": { channel: "errorAlert", variant: "danger", title: "Failed to load users" },
  "users.update.error": { channel: "toast", variant: "error", title: "Failed to update user" },
  "users.update.success": { channel: "toast", variant: "success", title: "User updated" },
};
