/**
 * Audit event definitions — GENERATED from contracts/audit-events.json. DO NOT EDIT.
 */
export type AuditEventWire = "patient.create" | "patient.update" | "patient.delete" | "patient.view" | "order.create" | "order.update" | "order.status" | "order.delete" | "order.test.add" | "order.test.remove" | "order.test.cancel" | "order.test.retest" | "order.test.reflex" | "laboratory.sample.create" | "laboratory.sample.collect" | "laboratory.sample.reject" | "laboratory.sample.recollect_request" | "laboratory.sample.recollect_approve" | "laboratory.sample.recollect_deny" | "laboratory.analyzer.duplicate_ingest" | "laboratory.analyzer.ingest_rejected" | "laboratory.result.enter" | "laboratory.result.update" | "laboratory.result.critical_detect" | "laboratory.result.critical_notify" | "laboratory.result.critical_acknowledge" | "laboratory.validation.approve" | "laboratory.validation.reject" | "laboratory.escalation.trigger" | "laboratory.escalation.resolve" | "billing.payment.process" | "billing.invoice.generate" | "billing.invoice.void" | "billing.insurance.submit" | "reporting.generate" | "reporting.download" | "system.user.login" | "system.user.logout" | "system.user.create" | "system.user.update" | "system.catalog.create" | "system.catalog.update";

export type TrailingActorPolicy = 'human' | 'never';

export interface AuditEventDefinition {
  wire: AuditEventWire;
  domain: string;
  laboratorySubdomain?: string;
  domainLabel: string;
  verbPhrase: string;
  headlineMetaKeys?: readonly string[];
  leadingActor?: boolean;
  trailingActor?: TrailingActorPolicy;
  treatAsSystemActor?: boolean;
}

export const AUDIT_EVENT_DEFINITIONS: Record<AuditEventWire, AuditEventDefinition> = {
  "patient.create": { wire: "patient.create", domain: "patient", domainLabel: "Patient", verbPhrase: "patient profile created" },
  "patient.update": { wire: "patient.update", domain: "patient", domainLabel: "Patient", verbPhrase: "patient profile updated" },
  "patient.delete": { wire: "patient.delete", domain: "patient", domainLabel: "Patient", verbPhrase: "patient profile archived" },
  "patient.view": { wire: "patient.view", domain: "patient", domainLabel: "Patient", verbPhrase: "patient chart viewed" },
  "order.create": { wire: "order.create", domain: "order", domainLabel: "Order", verbPhrase: "order created" },
  "order.update": { wire: "order.update", domain: "order", domainLabel: "Order", verbPhrase: "order updated", headlineMetaKeys: ["field","value"] },
  "order.status": { wire: "order.status", domain: "order", domainLabel: "Order", verbPhrase: "order status changed", headlineMetaKeys: ["trigger"] },
  "order.delete": { wire: "order.delete", domain: "order", domainLabel: "Order", verbPhrase: "cancelled order" },
  "order.test.add": { wire: "order.test.add", domain: "order", domainLabel: "Order", verbPhrase: "added test to order", headlineMetaKeys: ["test_code"] },
  "order.test.remove": { wire: "order.test.remove", domain: "order", domainLabel: "Order", verbPhrase: "removed test from order", headlineMetaKeys: ["test_code"] },
  "order.test.cancel": { wire: "order.test.cancel", domain: "order", domainLabel: "Order", verbPhrase: "cancelled test on order", headlineMetaKeys: ["test_code","reason"] },
  "order.test.retest": { wire: "order.test.retest", domain: "order", domainLabel: "Order", verbPhrase: "requested retest for", headlineMetaKeys: ["test_code","reason"] },
  "order.test.reflex": { wire: "order.test.reflex", domain: "order", domainLabel: "Order", verbPhrase: "added reflex test", headlineMetaKeys: ["added_test_code","triggered_by"] },
  "laboratory.sample.create": { wire: "laboratory.sample.create", domain: "laboratory", domainLabel: "Sample", verbPhrase: "sample label generated for", laboratorySubdomain: "sample", headlineMetaKeys: ["test_codes"], treatAsSystemActor: true },
  "laboratory.sample.collect": { wire: "laboratory.sample.collect", domain: "laboratory", domainLabel: "Sample", verbPhrase: "sample collected for", laboratorySubdomain: "sample", headlineMetaKeys: ["test_codes"] },
  "laboratory.sample.reject": { wire: "laboratory.sample.reject", domain: "laboratory", domainLabel: "Sample", verbPhrase: "sample rejected for", laboratorySubdomain: "sample", headlineMetaKeys: ["rejection_reason"] },
  "laboratory.sample.recollect_request": { wire: "laboratory.sample.recollect_request", domain: "laboratory", domainLabel: "Sample", verbPhrase: "sample recollection requested for", laboratorySubdomain: "sample", headlineMetaKeys: ["stage"] },
  "laboratory.sample.recollect_approve": { wire: "laboratory.sample.recollect_approve", domain: "laboratory", domainLabel: "Sample", verbPhrase: "sample recollection approved for", laboratorySubdomain: "sample" },
  "laboratory.sample.recollect_deny": { wire: "laboratory.sample.recollect_deny", domain: "laboratory", domainLabel: "Sample", verbPhrase: "sample recollection denied for", laboratorySubdomain: "sample", headlineMetaKeys: ["reason"] },
  "laboratory.analyzer.duplicate_ingest": { wire: "laboratory.analyzer.duplicate_ingest", domain: "laboratory", domainLabel: "Analyzer", verbPhrase: "duplicate analyzer ingest for", laboratorySubdomain: "analyzer", headlineMetaKeys: ["test_code","idempotency_key"], treatAsSystemActor: true },
  "laboratory.analyzer.ingest_rejected": { wire: "laboratory.analyzer.ingest_rejected", domain: "laboratory", domainLabel: "Analyzer", verbPhrase: "analyzer ingest rejected for", laboratorySubdomain: "analyzer", headlineMetaKeys: ["test_code","reason"], treatAsSystemActor: true },
  "laboratory.result.enter": { wire: "laboratory.result.enter", domain: "laboratory", domainLabel: "Results", verbPhrase: "entered results for", laboratorySubdomain: "result", headlineMetaKeys: ["test_code","source","analyzer_id"] },
  "laboratory.result.update": { wire: "laboratory.result.update", domain: "laboratory", domainLabel: "Results", verbPhrase: "updated results for", laboratorySubdomain: "result", headlineMetaKeys: ["test_code"] },
  "laboratory.result.critical_detect": { wire: "laboratory.result.critical_detect", domain: "laboratory", domainLabel: "Results", verbPhrase: "critical value detected for", laboratorySubdomain: "result", headlineMetaKeys: ["test_code"] },
  "laboratory.result.critical_notify": { wire: "laboratory.result.critical_notify", domain: "laboratory", domainLabel: "Results", verbPhrase: "clinician notification documented for", laboratorySubdomain: "result", headlineMetaKeys: ["test_code"] },
  "laboratory.result.critical_acknowledge": { wire: "laboratory.result.critical_acknowledge", domain: "laboratory", domainLabel: "Results", verbPhrase: "critical value protocol acknowledged for", laboratorySubdomain: "result", headlineMetaKeys: ["test_code"] },
  "laboratory.validation.approve": { wire: "laboratory.validation.approve", domain: "laboratory", domainLabel: "Validation", verbPhrase: "validated", laboratorySubdomain: "validation", headlineMetaKeys: ["test_code"] },
  "laboratory.validation.reject": { wire: "laboratory.validation.reject", domain: "laboratory", domainLabel: "Validation", verbPhrase: "sent back for correction on", laboratorySubdomain: "validation", headlineMetaKeys: ["reason","test_code"] },
  "laboratory.escalation.trigger": { wire: "laboratory.escalation.trigger", domain: "laboratory", domainLabel: "Escalation", verbPhrase: "escalated", laboratorySubdomain: "escalation", headlineMetaKeys: ["reason_code","test_code"] },
  "laboratory.escalation.resolve": { wire: "laboratory.escalation.resolve", domain: "laboratory", domainLabel: "Escalation", verbPhrase: "escalation resolved for", laboratorySubdomain: "escalation", headlineMetaKeys: ["resolution","test_code"] },
  "billing.payment.process": { wire: "billing.payment.process", domain: "billing", domainLabel: "Billing", verbPhrase: "payment recorded for", headlineMetaKeys: ["amount","payment_method"] },
  "billing.invoice.generate": { wire: "billing.invoice.generate", domain: "billing", domainLabel: "Billing", verbPhrase: "invoice generated for", trailingActor: "never" },
  "billing.invoice.void": { wire: "billing.invoice.void", domain: "billing", domainLabel: "Billing", verbPhrase: "voided invoice for order", headlineMetaKeys: ["reason"] },
  "billing.insurance.submit": { wire: "billing.insurance.submit", domain: "billing", domainLabel: "Billing", verbPhrase: "submitted insurance claim for order", headlineMetaKeys: ["payer","claim_number"] },
  "reporting.generate": { wire: "reporting.generate", domain: "reporting", domainLabel: "Reporting", verbPhrase: "report generated for order" },
  "reporting.download": { wire: "reporting.download", domain: "reporting", domainLabel: "Reporting", verbPhrase: "report downloaded for order", headlineMetaKeys: ["format"] },
  "system.user.login": { wire: "system.user.login", domain: "system", domainLabel: "System", verbPhrase: "signed in", leadingActor: true, trailingActor: "never" },
  "system.user.logout": { wire: "system.user.logout", domain: "system", domainLabel: "System", verbPhrase: "signed out", leadingActor: true, trailingActor: "never" },
  "system.user.create": { wire: "system.user.create", domain: "system", domainLabel: "System", verbPhrase: "created user account" },
  "system.user.update": { wire: "system.user.update", domain: "system", domainLabel: "System", verbPhrase: "updated user account" },
  "system.catalog.create": { wire: "system.catalog.create", domain: "system", domainLabel: "Catalog", verbPhrase: "catalog test created", headlineMetaKeys: ["test_code"] },
  "system.catalog.update": { wire: "system.catalog.update", domain: "system", domainLabel: "Catalog", verbPhrase: "catalog test updated", headlineMetaKeys: ["test_code"] },
};

export const AUDIT_EVENT_WIRES = ["patient.create","patient.update","patient.delete","patient.view","order.create","order.update","order.status","order.delete","order.test.add","order.test.remove","order.test.cancel","order.test.retest","order.test.reflex","laboratory.sample.create","laboratory.sample.collect","laboratory.sample.reject","laboratory.sample.recollect_request","laboratory.sample.recollect_approve","laboratory.sample.recollect_deny","laboratory.analyzer.duplicate_ingest","laboratory.analyzer.ingest_rejected","laboratory.result.enter","laboratory.result.update","laboratory.result.critical_detect","laboratory.result.critical_notify","laboratory.result.critical_acknowledge","laboratory.validation.approve","laboratory.validation.reject","laboratory.escalation.trigger","laboratory.escalation.resolve","billing.payment.process","billing.invoice.generate","billing.invoice.void","billing.insurance.submit","reporting.generate","reporting.download","system.user.login","system.user.logout","system.user.create","system.user.update","system.catalog.create","system.catalog.update"] as const;
