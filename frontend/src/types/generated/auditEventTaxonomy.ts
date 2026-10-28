/**
 * Audit event log query taxonomy — GENERATED from contracts/audit-events.json. DO NOT EDIT.
 */

export type EventLogDomain = "patient" | "order" | "laboratory" | "billing" | "reporting" | "system";

export type EventLogLaboratoryKindKey = "laboratory:sample" | "laboratory:result" | "laboratory:validation" | "laboratory:escalation" | "laboratory:quality" | "laboratory:analyzer";

export type EventLogKind = EventLogDomain | EventLogLaboratoryKindKey;

export type StoredEventScope = "order" | "lab" | "patient" | "system";

export type EventLogLaboratorySubdomain = (typeof LABORATORY_SUBDOMAIN_VALUES)[number];

export const LABORATORY_SUBDOMAIN_VALUES = ["sample","result","validation","escalation","quality","analyzer"] as const;

export const EVENT_LOG_KIND_OPTIONS: { id: EventLogKind; label: string }[] = [
  { id: "patient", label: "Patient" },
  { id: "order", label: "Order" },
  { id: "laboratory", label: "Laboratory" },
  { id: "billing", label: "Billing" },
  { id: "reporting", label: "Reporting" },
  { id: "system", label: "System" },
  { id: "laboratory:sample", label: "Laboratory · Sample" },
  { id: "laboratory:result", label: "Laboratory · Results" },
  { id: "laboratory:validation", label: "Laboratory · Validation" },
  { id: "laboratory:escalation", label: "Laboratory · Escalation" },
  { id: "laboratory:quality", label: "Laboratory · Quality" },
  { id: "laboratory:analyzer", label: "Laboratory · Analyzer" },
];

export const ACCESS_EVENT_TYPES = ["patient.view","reporting.download"] as const;

export const DEFAULT_STORED_EVENT_SCOPE = "order" as const;
