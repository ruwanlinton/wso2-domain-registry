"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/components/layout/UserSwitcher";

interface Domain {
  id: string;
  name: string;
  environment: string;
}

interface RequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestForm({ onClose, onSuccess }: RequestFormProps) {
  const [currentUser] = useCurrentUser();
  const [step, setStep] = useState(1);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    requestType: "CREATE_SUBDOMAIN",
    title: "",
    description: "",
    justification: "",
    priority: "MEDIUM",
    // For subdomain
    domainId: "",
    proposedName: "",
    proposedPurpose: "API",
    proposedEnvironment: "PRODUCTION",
    proposedDescription: "",
    // For domain
    proposedDomainName: "",
  });

  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then(setDomains)
      .catch(console.error);
  }, []);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        type: form.requestType,
        status: "PENDING",
        priority: form.priority,
        title: form.title,
        description: form.description,
        justification: form.justification,
        requestedBy: currentUser.email.split("@")[0],
      };

      if (form.requestType === "CREATE_SUBDOMAIN") {
        payload.domainId = form.domainId;
        payload.proposedName = form.proposedName;
        payload.proposedPurpose = form.proposedPurpose;
        payload.proposedEnvironment = form.proposedEnvironment;
        payload.proposedDescription = form.proposedDescription;
      } else if (form.requestType === "CREATE_DOMAIN") {
        payload.proposedName = form.proposedDomainName;
        payload.proposedEnvironment = form.proposedEnvironment;
        payload.proposedDescription = form.proposedDescription;
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedDomain = domains.find((d) => d.id === form.domainId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Request</h2>
            <p className="text-sm text-gray-500">Step {step} of 2</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type
                </label>
                <select
                  value={form.requestType}
                  onChange={(e) => set("requestType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                >
                  <option value="CREATE_SUBDOMAIN">Create Subdomain</option>
                  <option value="CREATE_DOMAIN">Create Domain</option>
                  <option value="MODIFY_DOMAIN">Modify Domain</option>
                  <option value="MODIFY_SUBDOMAIN">Modify Subdomain</option>
                  <option value="DELETE_DOMAIN">Delete Domain</option>
                  <option value="DELETE_SUBDOMAIN">Delete Subdomain</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Brief description of your request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Detailed description of what you need and why"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Justification
                </label>
                <textarea
                  rows={2}
                  value={form.justification}
                  onChange={(e) => set("justification", e.target.value)}
                  placeholder="Why is this needed?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </>
          )}

          {step === 2 && form.requestType === "CREATE_SUBDOMAIN" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.domainId}
                  onChange={(e) => {
                    set("domainId", e.target.value);
                    const d = domains.find((x) => x.id === e.target.value);
                    if (d) set("proposedEnvironment", d.environment);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                >
                  <option value="">Select a domain...</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.environment})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subdomain Name <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={form.proposedName}
                    onChange={(e) => set("proposedName", e.target.value)}
                    placeholder="staging-api"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                  />
                  {selectedDomain && (
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600 font-mono">
                      .{selectedDomain.name}
                    </span>
                  )}
                </div>
                {form.proposedName && selectedDomain && (
                  <p className="text-xs text-gray-500 mt-1">
                    Full domain:{" "}
                    <strong>
                      {form.proposedName}.{selectedDomain.name}
                    </strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <select
                  value={form.proposedPurpose}
                  onChange={(e) => set("proposedPurpose", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                >
                  {["API", "WEB_APP", "INTERNAL", "DOCS", "CDN", "MAIL", "MONITORING", "ANALYTICS", "OTHER"].map(
                    (p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.proposedDescription}
                  onChange={(e) => set("proposedDescription", e.target.value)}
                  placeholder="Brief description of this subdomain"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                />
              </div>
            </>
          )}

          {step === 2 && form.requestType === "CREATE_DOMAIN" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.proposedDomainName}
                  onChange={(e) => set("proposedDomainName", e.target.value)}
                  placeholder="example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <select
                  value={form.proposedEnvironment}
                  onChange={(e) => set("proposedEnvironment", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                >
                  <option value="PRODUCTION">Production</option>
                  <option value="STAGING">Staging</option>
                  <option value="DEVELOPMENT">Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.proposedDescription}
                  onChange={(e) => set("proposedDescription", e.target.value)}
                  placeholder="Brief description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wso2-orange"
                />
              </div>
            </>
          )}

          {step === 2 &&
            !["CREATE_SUBDOMAIN", "CREATE_DOMAIN"].includes(form.requestType) && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                For modify/delete requests, please use the{" "}
                <strong>AI Assistant</strong> for guided assistance, or contact
                your admin.
              </p>
            )}
        </div>

        <div className="flex items-center justify-between p-6 border-t gap-3">
          {step === 1 ? (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
          )}

          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!form.title || !form.description}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Submit Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
