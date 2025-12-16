import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../utils/api.js";

const defaultCommitteeSettings = {
  offlineMode: true,
  minSpeakersBeforeVote: 2,
  recordNamesInVotes: false,
  allowSpecialMotions: true,
};

export default function CommitteeDetail() {
  const { id } = useParams();
  const { appData } = useAuth();
  const currentUser = appData.auth?.currentUser || null;
  const [committee, setCommittee] = useState(null);
  const [motions, setMotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "standard",
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [discussionDrafts, setDiscussionDrafts] = useState({});
  const [voteDrafts, setVoteDrafts] = useState({});
  const [decisionDrafts, setDecisionDrafts] = useState({});
  const [subMotionDrafts, setSubMotionDrafts] = useState({});
  const [overturnDrafts, setOverturnDrafts] = useState({});
  const [showChairPanel, setShowChairPanel] = useState(false);
  const [expandedMotions, setExpandedMotions] = useState({});

  const fetchCommittee = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getCommitteeDetail(id);
      setCommittee(data.committee || null);
      setMotions(data.motions || []);
      setFetchError("");
    } catch (err) {
      setCommittee(null);
      setMotions([]);
      setFetchError(err.message || "Unable to load committee.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCommittee();
  }, [fetchCommittee]);

  const motionsSource = motions || [];
  const sortedMotions = useMemo(
    () =>
      [...motionsSource].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    [motionsSource]
  );
  const rootMotions = useMemo(
    () => sortedMotions.filter((motion) => !motion.parentMotionId && !motion.decisionRecord),
    [sortedMotions]
  );
  const decidedMotions = useMemo(
    () => sortedMotions.filter((motion) => Boolean(motion.decisionRecord)),
    [sortedMotions]
  );
  const memberRecord = useMemo(() => {
    const normalizedCurrentName = currentUser?.name?.toLowerCase?.() || "";
    return (committee?.members || []).find((member) => {
      if (!member) return false;
      if (member.user && currentUser?.id) {
        return String(member.user) === String(currentUser.id);
      }
      if (member.userId && currentUser?.id) return member.userId === currentUser.id;
      if (member.email && currentUser?.email) {
        return member.email.toLowerCase() === currentUser.email.toLowerCase();
      }
      if (member.name && normalizedCurrentName) {
        return member.name.toLowerCase() === normalizedCurrentName;
      }
      return false;
    });
  }, [committee, currentUser]);

  const motionsById = useMemo(() => {
    const lookup = {};
    (motionsSource || []).forEach((motion) => {
      lookup[String(motion.id || motion._id)] = motion;
    });
    return lookup;
  }, [motionsSource]);
  const committeeSettings = useMemo(
    () => ({
      ...defaultCommitteeSettings,
      ...(committee?.settings || {}),
    }),
    [committee]
  );
  const committeeId = committee?._id || committee?.id || id;
  const handRaises = committee?.handRaises || [];
  const groupedHandRaises = useMemo(
    () =>
      (handRaises || []).reduce(
        (acc, entry) => {
          const key = entry.stance || "neutral";
          acc[key] = acc[key] || [];
          acc[key].push(entry);
          return acc;
        },
        { pro: [], con: [], neutral: [] }
      ),
    [handRaises]
  );

  const [settingsForm, setSettingsForm] = useState(committeeSettings);
  const [handRaiseDraft, setHandRaiseDraft] = useState({ stance: "pro", note: "" });

  useEffect(() => {
    setSettingsForm(committeeSettings);
  }, [committeeSettings]);

  useEffect(() => {
    setHandRaiseDraft({ stance: "pro", note: "" });
  }, [id]);

  useEffect(() => {
    setShowChairPanel(false);
    setExpandedMotions({});
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-sand p-6 text-center">
        <p className="text-lg font-semibold text-wine">Loading committee...</p>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-sand p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-cream/70 bg-white/80 p-8 text-center shadow-soft">
          <p className="text-lg font-semibold text-wine">
            {fetchError || "Committee not found."}
          </p>
          <Link to="/committees" className="btn-secondary mt-6">
            Back to committees
          </Link>
        </div>
      </div>
    );
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canPerform(permissionKey) {
    if (!permissionKey) return true;
    if (!memberRecord) return true;
    return (memberRecord.permissions || []).includes(permissionKey);
  }

  function canRecordDecision() {
    if (!memberRecord) return false;
    return ["owner", "chair"].includes(memberRecord.role);
  }

  function canRequestOverturn(motion) {
    if (!motion) return false;
    const status = motion.decisionRecord?.outcome || motion.status;
    if (status !== "passed") return false;
    const vote = getExistingVoteForMotion(motion);
    return vote?.choice === "support";
  }

  const canEditSettings = ["owner", "chair"].includes(memberRecord?.role);
  const canModerateHands = canEditSettings;
  const userHandRaise = (handRaises || []).find((entry) => isEntryByCurrentUser(entry));

  function handleSettingsChange(field, value) {
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (!canEditSettings) return;
    const normalizedSettings = {
      ...defaultCommitteeSettings,
      ...settingsForm,
      minSpeakersBeforeVote: Math.max(
        0,
        Number.isFinite(Number(settingsForm.minSpeakersBeforeVote))
          ? Number(settingsForm.minSpeakersBeforeVote)
          : 0
      ),
    };
    try {
      await api.updateCommitteeSettings(committeeId, normalizedSettings);
      setStatus("Chair settings updated.");
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to update settings.");
    }
  }

  function handleHandRaiseChange(field, value) {
    setHandRaiseDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function raiseHand(event) {
    event.preventDefault();
    if (!canPerform("discussion")) {
      alert("You need discussion permissions to join the speaker queue.");
      return;
    }
    const stance = handRaiseDraft.stance || "pro";
    const note = (handRaiseDraft.note || "").trim();
    try {
      await api.raiseHand(committeeId, { stance, note });
      setStatus("Hand raised for the chair queue.");
      setHandRaiseDraft((prev) => ({ ...prev, note: "" }));
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to raise hand.");
    }
  }

  async function lowerOwnHand() {
    if (!userHandRaise) return;
    try {
      await api.lowerHand(committeeId, userHandRaise._id || userHandRaise.id);
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to lower hand.");
    }
  }

  async function moderateHandRaise(entryId) {
    try {
      await api.lowerHand(committeeId, entryId);
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to update queue.");
    }
  }

  function toggleMotionExpansion(motionId) {
    if (!motionId) return;
    setExpandedMotions((prev) => ({
      ...prev,
      [motionId]: !prev[motionId],
    }));
  }

  async function createMotion(e) {
    e.preventDefault();
    setStatus("");
    const title = form.title.trim();
    const description = form.description.trim();
    if (!title) {
      setError("Motion title is required.");
      return;
    }
    if (!canPerform("createMotion")) {
      setError("You do not have permission to raise motions in this committee.");
      return;
    }
    if (form.type === "special" && !committeeSettings.allowSpecialMotions) {
      setError("Special motions are disabled for this committee.");
      return;
    }

    try {
      await api.createMotion(committeeId, {
        title,
        description,
        type: form.type,
      });
      setForm({ title: "", description: "", type: "standard" });
      setError("");
      setStatus("Motion submitted and awaiting discussion.");
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to create motion.");
    }
  }

  function handleDiscussionDraftChange(motionId, field, value) {
    setDiscussionDrafts((prev) => {
      const base = prev[motionId] || { stance: "neutral", message: "" };
      return { ...prev, [motionId]: { ...base, [field]: value } };
    });
  }

  async function submitDiscussion(event, motionId) {
    event.preventDefault();
    const draft = discussionDrafts[motionId] || { stance: "neutral", message: "" };
    const message = draft.message?.trim();
    const stance = draft.stance || "neutral";

    if (!message) {
      alert("Add a discussion note before submitting.");
      return;
    }

    if (!canPerform("discussion")) {
      alert("You do not have permission to participate in discussion.");
      return;
    }

    try {
      await api.addDiscussion(motionId, { stance, content: message });
      setDiscussionDrafts((prev) => ({
        ...prev,
        [motionId]: { stance: "neutral", message: "" },
      }));
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to submit discussion.");
    }
  }

  function handleVoteDraftChange(motionId, value) {
    setVoteDrafts((prev) => ({
      ...prev,
      [motionId]: { choice: value },
    }));
  }

  async function submitVote(event, motionId, previousChoice) {
    event.preventDefault();
    if (!canPerform("vote")) {
      alert("You do not have permission to vote in this committee.");
      return;
    }
    const selection =
      voteDrafts[motionId]?.choice ||
      previousChoice ||
      "support";

    try {
      await api.castVote(motionId, { choice: selection });
      setVoteDrafts((prev) => ({
        ...prev,
        [motionId]: { choice: selection },
      }));
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to submit vote.");
    }
  }

  function handleDecisionDraftChange(motionId, field, value) {
    setDecisionDrafts((prev) => {
      const base =
        prev[motionId] ||
        {
          outcome: "pending",
          summary: "",
          pros: "",
          cons: "",
        };
      return { ...prev, [motionId]: { ...base, [field]: value } };
    });
  }

  function handleSubMotionDraftChange(motionId, field, value) {
    setSubMotionDrafts((prev) => {
      const base =
        prev[motionId] || {
          title: "",
          description: "",
          variant: "revision",
        };
      return { ...prev, [motionId]: { ...base, [field]: value } };
    });
  }

  async function submitDecisionRecord(event, motionId, existingRecord) {
    event.preventDefault();
    if (!canRecordDecision()) {
      alert("Only the owner or chair can record decisions.");
      return;
    }
    const draft =
      decisionDrafts[motionId] ||
      existingRecord || {
        outcome: "pending",
        summary: "",
        pros: "",
        cons: "",
      };
    const outcome = draft.outcome;
    if (!outcome || outcome === "pending") {
      alert("Select an outcome before saving.");
      return;
    }
    const record = {
      outcome,
      summary: draft.summary?.trim() || "",
      pros: draft.pros?.trim() || "",
      cons: draft.cons?.trim() || "",
      recordedAt: new Date().toISOString(),
      recordedBy: currentUser?.id ?? null,
      recordedByName: currentUser?.name ?? "Chair",
    };

    try {
      await api.recordDecision(motionId, {
        outcome,
        summary: record.summary,
        pros: record.pros,
        cons: record.cons,
      });
      setStatus("Decision recorded for this motion.");
      setDecisionDrafts((prev) => ({
        ...prev,
        [motionId]: {
          outcome,
          summary: record.summary,
          pros: record.pros,
          cons: record.cons,
        },
      }));
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to record decision.");
    }
  }

  async function submitSubMotion(event, parentMotion) {
    event.preventDefault();
    if (!canPerform("createMotion")) {
      alert("You do not have permission to raise sub-motions.");
      return;
    }

    const draft =
      subMotionDrafts[parentMotion.id || parentMotion._id] || {
        title: "",
        description: "",
        variant: "revision",
      };

    const title = draft.title.trim();
    const description = draft.description.trim();
    if (!title) {
      alert("Provide a title for the sub-motion.");
      return;
    }

    const variant = draft.variant || "revision";
    try {
      await api.createSubMotion(parentMotion.id || parentMotion._id, {
        title,
        description,
        variantOf: variant,
        committeeId,
      });
      setSubMotionDrafts((prev) => ({
        ...prev,
        [parentMotion.id || parentMotion._id]: { title: "", description: "", variant },
      }));
      setStatus("Sub-motion created.");
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to create sub-motion.");
    }
  }

  function handleOverturnDraftChange(motionId, field, value) {
    setOverturnDrafts((prev) => {
      const base =
        prev[motionId] || {
          title: "",
          justification: "",
        };
      return { ...prev, [motionId]: { ...base, [field]: value } };
    });
  }

  async function submitOverturnRequest(event, motion) {
    event.preventDefault();
    if (!canRequestOverturn(motion)) {
      alert("Only supporters of a passed motion can request an overturn.");
      return;
    }
    const motionKey = motion.id || motion._id;
    const draft =
      overturnDrafts[motionKey] || {
        title: "",
        justification: "",
      };
    const title = (draft.title || `Overturn: ${motion.title}`).trim();
    const justification = draft.justification?.trim();
    if (!justification) {
      alert("Provide justification for overturning this decision.");
      return;
    }

    try {
      await api.submitOverturn(motionKey, {
        title,
        justification,
      });
      setOverturnDrafts((prev) => ({
        ...prev,
        [motionKey]: { title: "", justification: "" },
      }));
      setStatus("Overturn request submitted for review.");
      fetchCommittee();
    } catch (err) {
      setError(err.message || "Unable to submit overturn request.");
    }
  }

  function displayType(value) {
    switch (value) {
      case "procedure":
        return "Procedure change (2/3 vote)";
      case "special":
        return "Special motion";
      default:
        return "Standard motion (majority)";
    }
  }

  function formatTimestamp(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-sand">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/committees"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-wine shadow-soft transition hover:-translate-y-0.5"
            >
              Back to committees
            </Link>
            <Link
              to="/profile"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-wine/20 bg-white/70 px-4 py-2 text-sm font-semibold text-wine shadow-soft transition hover:-translate-y-0.5"
            >
              Profile
            </Link>
          </div>
          <div className="card flex-1 border border-cream/80 bg-white/85 p-6 text-wine">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="badge">Committee</span>
                <h1 className="mt-2 text-3xl font-bold">{committee.name}</h1>
              </div>
          <div className="flex gap-4 text-sm text-wine/80">
            <div className="rounded-2xl border border-cream/60 bg-white/70 px-4 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-wine/60">Members</p>
              <p className="text-lg font-semibold text-wine">{committee.members?.length || 0}</p>
            </div>
                <div className="rounded-2xl border border-cream/60 bg-white/70 px-4 py-2 text-center">
                  <p className="text-xs uppercase tracking-wide text-wine/60">Motions</p>
                  <p className="text-lg font-semibold text-wine">{committee.motions?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text/65">
            Chair controls are tucked away to keep the workspace clear.
          </p>
          <button
            type="button"
            onClick={() => setShowChairPanel(true)}
            className="inline-flex items-center gap-2 rounded-full border border-wine/30 bg-white/80 px-4 py-2 text-sm font-semibold text-wine shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
          >
            Open chair panel
            <span aria-hidden>↗</span>
          </button>
        </div>

        {showChairPanel && (
          <div className="fixed inset-0 z-30 flex items-start justify-center bg-black/25 px-4 py-8 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cream/80 bg-white/95 p-6 shadow-card">
              <button
                type="button"
                onClick={() => setShowChairPanel(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/80 text-lg font-semibold text-wine transition hover:bg-rose/10"
                aria-label="Close chair panel"
              >
                ×
              </button>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-wine">Chair Control Panel</h2>
                  <p className="text-sm text-text/65">
                    Toggle offline options, speaker thresholds, and vote recording preferences.
                  </p>
                </div>
                <span className="mr-10 rounded-full bg-rose/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose">
                  {canEditSettings ? "Editable" : "View only"}
                </span>
              </div>
              <form onSubmit={saveSettings} className="mt-6 grid gap-6 md:grid-cols-2">
                <label className="flex items-start gap-3 text-sm font-semibold text-wine">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-cream/80 text-wine focus:ring-rose/40"
                    checked={settingsForm.offlineMode}
                    disabled={!canEditSettings}
                    onChange={(e) => handleSettingsChange("offlineMode", e.target.checked)}
                  />
                  <span>Offline Mode • allow asynchronous participation</span>
                </label>
                <label className="flex items-start gap-3 text-sm font-semibold text-wine">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-cream/80 text-wine focus:ring-rose/40"
                    checked={settingsForm.recordNamesInVotes}
                    disabled={!canEditSettings}
                    onChange={(e) => handleSettingsChange("recordNamesInVotes", e.target.checked)}
                  />
                  <span>Show voter names in results (toggle before voting)</span>
                </label>
                <label className="flex items-start gap-3 text-sm font-semibold text-wine">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-cream/80 text-wine focus:ring-rose/40"
                    checked={settingsForm.allowSpecialMotions}
                    disabled={!canEditSettings}
                    onChange={(e) => handleSettingsChange("allowSpecialMotions", e.target.checked)}
                  />
                  <span>Allow special motions (no discussion)</span>
                </label>
                <label className="flex flex-col text-sm font-semibold text-wine">
                  Minimum speakers before vote
                  <input
                    type="number"
                    min="0"
                    className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-4 py-3 text-sm text-text shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                    value={settingsForm.minSpeakersBeforeVote}
                    disabled={!canEditSettings}
                    onChange={(e) => handleSettingsChange("minSpeakersBeforeVote", e.target.value)}
                  />
                </label>
                {canEditSettings ? (
                  <button type="submit" className="btn-primary mt-2 w-full justify-center md:w-auto">
                    Save chair settings
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-text/60 md:col-span-2">
                    Settings are controlled by the committee owner or chair.
                  </p>
                )}
              </form>
            </div>
          </div>
        )}

        <section className="card mt-8 border border-cream/70 bg-white/90 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-wine">Speaker Queue</h2>
              <p className="text-sm text-text/65">
                Members can raise their hands with a stance. Chairs can mark speakers as finished.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-text/60">
              <span className="inline-flex h-2 w-2 rounded-full bg-rose" />
              {handRaises.length} waiting
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { key: "pro", label: "Pro" },
              { key: "con", label: "Con" },
              { key: "neutral", label: "Neutral" },
            ].map((lane) => (
              <div
                key={lane.key}
                className="rounded-2xl border border-cream/70 bg-white/85 p-4 text-sm text-text/75"
              >
                <p className="font-semibold text-wine">{lane.label} queue</p>
                {(groupedHandRaises[lane.key] || []).length === 0 ? (
                  <p className="mt-3 text-xs text-text/60">No one waiting.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-xs">
                    {groupedHandRaises[lane.key].map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-xl border border-cream/60 bg-white/90 px-3 py-2 text-text/70"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-wine">{entry.createdByName || "Member"}</span>
                          <span className="text-[10px] text-text/50">{formatTimestamp(entry.createdAt)}</span>
                        </div>
                        {entry.note && <p className="mt-1 text-[11px]">{entry.note}</p>}
                        {(canModerateHands || isEntryByCurrentUser(entry)) && (
                          <button
                            type="button"
                            onClick={() =>
                              isEntryByCurrentUser(entry) ? lowerOwnHand() : moderateHandRaise(entry.id)
                            }
                            className="mt-2 inline-flex rounded-full border border-rose/40 px-3 py-1 text-[11px] font-semibold text-rose transition hover:bg-rose/10"
                          >
                            {isEntryByCurrentUser(entry) ? "Lower my hand" : "Mark spoke"}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {userHandRaise ? (
            <div className="mt-6 rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-wine">
              You are in the queue as <strong>{userHandRaise.createdByName || "Member"}</strong>. Lower
              your hand when you are done speaking.
              <button
                type="button"
                onClick={lowerOwnHand}
                className="btn-secondary mt-3 w-full justify-center md:w-auto"
              >
                Lower my hand
              </button>
            </div>
          ) : (
            <form className="mt-6 grid gap-4 md:grid-cols-[0.6fr_1.4fr_auto]" onSubmit={raiseHand}>
              <label className="text-sm font-semibold text-wine">
                Stance
                <select
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-3 py-2 text-sm text-text focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  value={handRaiseDraft.stance}
                  onChange={(e) => handleHandRaiseChange("stance", e.target.value)}
                >
                  <option value="pro">Pro</option>
                  <option value="con">Con</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-wine">
                Note (optional)
                <input
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Topic or amendment"
                  value={handRaiseDraft.note}
                  onChange={(e) => handleHandRaiseChange("note", e.target.value)}
                />
              </label>
              <button type="submit" className="btn-primary mt-auto w-full justify-center md:w-auto">
                Raise hand
              </button>
            </form>
          )}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="card border border-cream/70 bg-white/90 p-6">
            <h2 className="text-lg font-semibold text-wine">Members & Roles</h2>
            <p className="mt-2 text-sm text-text/65">
              Ensure at least one owner and balance permissions for each voice.
            </p>
            <ul className="mt-6 space-y-3">
              {(committee.members || []).map((member, index) => (
                <li
                  key={`${member.id || member.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-cream/60 bg-peach/30 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-wine">{member.name}</p>
                    <p className="text-xs text-text/60">
                      Permissions: {(member.permissions || []).join(", ") || "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-rose/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose">
                    {formatRole(member.role)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card flex flex-col gap-8 border border-cream/70 bg-white/90 p-6">
            <div>
              <h2 className="text-lg font-semibold text-wine">Raise a Motion</h2>
              <p className="mt-1 text-sm text-text/65">
                Submit new business for consideration. Procedure changes need a two-thirds vote.
              </p>
              {error && (
                <p className="mt-4 rounded-2xl border border-rose/40 bg-rose/20 px-4 py-3 text-sm text-wine">
                  {error}
                </p>
              )}
              {status && (
                <p className="mt-4 rounded-2xl border border-peach/50 bg-peach/40 px-4 py-3 text-sm text-wine">
                  {status}
                </p>
              )}
            </div>
            <form className="space-y-6" onSubmit={createMotion}>
              <label className="block text-sm font-semibold text-wine" htmlFor="motionTitle">
                Motion title
                <input
                  id="motionTitle"
                  value={form.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Summarize the motion"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-wine" htmlFor="motionDescription">
                Description
                <textarea
                  id="motionDescription"
                  value={form.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="mt-2 min-h-[140px] w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Provide details, amendments, or supporting context (optional)"
                />
              </label>

              <label className="block text-sm font-semibold text-wine" htmlFor="motionType">
                Motion type
                <select
                  id="motionType"
                  value={form.type}
                  onChange={(e) => handleFormChange("type", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                >
                  <option value="standard">Standard motion (majority)</option>
                  <option value="procedure">Procedure change (2/3 vote)</option>
                  <option value="special">Special motion</option>
                </select>
              </label>

              <button type="submit" className="btn-primary w-full justify-center">
                Submit motion
              </button>
            </form>
          </section>
        </div>

        <section className="card mt-10 border border-cream/70 bg-white/90 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-wine">Motions log</h2>
              <p className="text-sm text-text/65">
                Track every proposal and return to previous business when needed.
              </p>
            </div>
          </div>

          {rootMotions.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-cream/60 bg-peach/30 p-6 text-center text-sm text-text/70">
              No motions raised yet.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {rootMotions.map((motion) => {
                const motionId = motion.id || motion._id;
                const discussionDraft =
                  discussionDrafts[motionId] || { stance: "neutral", message: "" };
                const existingVote = getExistingVoteForMotion(motion);
                const currentChoice =
                  voteDrafts[motionId]?.choice || existingVote?.choice || "support";
                const decisionRecord = motion.decisionRecord || null;
                const decisionOutcome = decisionRecord?.outcome || motion.status || "pending";
                const decisionDraft =
                  decisionDrafts[motionId] ||
                  (decisionRecord
                    ? {
                        outcome: decisionRecord.outcome || motion.status || "pending",
                        summary: decisionRecord.summary || "",
                        pros: decisionRecord.pros || "",
                        cons: decisionRecord.cons || "",
                      }
                    : {
                        outcome: motion.status || "pending",
                        summary: "",
                        pros: "",
                        cons: "",
                      });
                const parentMotion = motion.parentMotionId
                  ? motionsById[String(motion.parentMotionId)] || null
                  : null;
                const subMotionDraft =
                  subMotionDrafts[motionId] || { title: "", description: "", variant: "revision" };
                const overturnDraft =
                  overturnDrafts[motionId] || { title: "", justification: "" };
                const childMotions = sortedMotions.filter(
                  (candidate) => String(candidate.parentMotionId) === String(motionId)
                );
                const isExpanded = Boolean(expandedMotions[motionId]);
                const discussionCount = (motion.discussion || []).length;
                const voteCount = (motion.votes || []).length;
                return (
                  <li
                    key={motionId}
                    className="rounded-3xl border border-cream/60 bg-white/80 p-5 shadow-inner"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-wine">{motion.title}</h3>
                        <p className="text-sm text-text/65">
                          {displayType(motion.type)}
                          {motion.variantOf && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-rose/10 px-2 py-0.5 text-xs font-semibold text-rose">
                              {formatVariantLabel(motion.variantOf)}
                              {parentMotion ? ` of “${parentMotion.title}”` : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-full bg-rose/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose">
                          {formatStatus(motion.status || "pending")}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleMotionExpansion(motionId)}
                          aria-expanded={isExpanded}
                          className="inline-flex items-center rounded-full border border-wine/30 bg-white/80 px-3 py-1 text-xs font-semibold text-wine transition hover:-translate-y-0.5 hover:shadow-soft"
                        >
                          {isExpanded ? "Collapse" : "Open motion"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-text/75">
                      {isExpanded
                        ? motion.description || "No description provided."
                        : motionPreviewText(motion)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text/60">
                      <span>Discussion: {discussionCount}</span>
                      <span>Votes: {voteCount}</span>
                      <span>Linked: {childMotions.length}</span>
                      <span>Updated {formatTimestamp(motion.updatedAt || motion.createdAt)}</span>
                    </div>

                    {isExpanded && (
                      <>
                        <p className="mt-3 text-xs text-text/60">
                          Proposed by {motion.createdByName || "Member"} •{" "}
                          {formatTimestamp(motion.createdAt)}
                        </p>

                        <div className="mt-5 rounded-2xl border border-cream/70 bg-white/85 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-wine">Discussion</p>
                            <span className="text-xs text-text/60">{discussionCount} replies</span>
                          </div>
                          {motion.type === "special" ? (
                            <p className="mt-4 text-sm text-text/65">
                              This special motion does not require open discussion. Chairs will record the
                              outcome directly.
                            </p>
                          ) : (
                            <>
                              <div className="mt-4 space-y-3">
                                {discussionCount === 0 ? (
                                  <p className="text-sm text-text/65">
                                    No discussion yet. Be the first to weigh in with a pro, con, or neutral note.
                                  </p>
                                ) : (
                                  (motion.discussion || []).map((entry) => (
                                    <article
                                      key={entry.id}
                                      className="rounded-2xl border border-cream/70 bg-white/90 p-3"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-wine">
                                          {entry.createdByName || "Member"}
                                        </p>
                                        <span
                                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${stanceChipClass(entry.stance)}`}
                                        >
                                          {formatStance(entry.stance)}
                                        </span>
                                      </div>
                                      <p className="mt-2 text-sm text-text/75">{entry.content}</p>
                                      <p className="mt-2 text-[11px] text-text/55">
                                        {formatTimestamp(entry.createdAt)}
                                      </p>
                                    </article>
                                  ))
                                )}
                              </div>
                              <form
                                className="mt-5 space-y-3"
                                onSubmit={(event) => submitDiscussion(event, motionId)}
                              >
                                <label className="block text-xs font-semibold uppercase tracking-wide text-text/60">
                                  Perspective
                                  <select
                                    className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-3 py-2 text-sm text-text focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                    value={discussionDraft.stance}
                                    onChange={(e) =>
                                      handleDiscussionDraftChange(motionId, "stance", e.target.value)
                                    }
                                  >
                                    <option value="pro">Pro</option>
                                    <option value="con">Con</option>
                                    <option value="neutral">Neutral</option>
                                  </select>
                                </label>
                                <label
                                  className="block text-sm font-semibold text-wine"
                                  htmlFor={`discussion-${motionId}`}
                                >
                                  Contribution
                                  <textarea
                                    id={`discussion-${motionId}`}
                                    className="mt-2 min-h-[110px] w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                    placeholder="Share a perspective with context or references."
                                    value={discussionDraft.message}
                                    onChange={(e) =>
                                      handleDiscussionDraftChange(motionId, "message", e.target.value)
                                    }
                                  />
                                </label>
                                <button type="submit" className="btn-secondary w-full justify-center">
                                  Add reply
                                </button>
                              </form>
                            </>
                          )}
                        </div>

                        <div className="mt-5 rounded-2xl border border-cream/70 bg-white/85 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-wine">Voting</p>
                            <span className="text-xs text-text/60">{voteCount} total</span>
                          </div>
                          {renderVoteSummary(motion)}
                          <form
                            className="mt-4 space-y-3"
                            onSubmit={(event) => submitVote(event, motionId, existingVote?.choice)}
                          >
                            <label className="block text-sm font-semibold text-wine">
                              Cast your vote
                              <select
                                className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-3 py-2 text-sm text-text focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                value={currentChoice}
                                onChange={(e) => handleVoteDraftChange(motionId, e.target.value)}
                              >
                                <option value="support">In favor</option>
                                <option value="against">Opposed</option>
                                <option value="abstain">Abstain</option>
                              </select>
                            </label>
                            <button type="submit" className="btn-primary w-full justify-center">
                              {existingVote ? "Update vote" : "Submit vote"}
                            </button>
                            {existingVote && (
                              <p className="text-xs text-text/60">
                                You last voted {formatVoteChoice(existingVote.choice)} on{" "}
                                {formatTimestamp(existingVote.createdAt)}.
                              </p>
                            )}
                          </form>
                        </div>

                        <div className="mt-5 rounded-2xl border border-cream/70 bg-white/85 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-wine">Decision record</p>
                            {decisionRecord && (
                              <span className="text-xs text-text/60">
                                Updated {formatTimestamp(decisionRecord.recordedAt)}
                              </span>
                            )}
                          </div>
                          {decisionRecord ? (
                            <div className="mt-4 space-y-3 text-sm text-text/75">
                              {decisionRecord.summary && (
                                <p>
                                  <span className="font-semibold text-wine">Summary:</span>{" "}
                                  {decisionRecord.summary}
                                </p>
                              )}
                              {decisionRecord.pros && (
                                <p>
                                  <span className="font-semibold text-wine">Pros:</span>{" "}
                                  {decisionRecord.pros}
                                </p>
                              )}
                              {decisionRecord.cons && (
                                <p>
                                  <span className="font-semibold text-wine">Cons:</span>{" "}
                                  {decisionRecord.cons}
                                </p>
                              )}
                              <p className="text-xs text-text/60">
                                Recorded by {decisionRecord.recordedByName || "Chair"}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-text/65">
                              No decision recorded yet. Chairs can summarize outcomes for future reference.
                            </p>
                          )}

                          {canRecordDecision() ? (
                            <form
                              className="mt-5 space-y-4"
                              onSubmit={(event) => submitDecisionRecord(event, motionId, decisionRecord)}
                            >
                              <label className="block text-sm font-semibold text-wine">
                                Outcome
                                <select
                                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-3 py-2 text-sm text-text focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                  value={decisionDraft.outcome}
                                  onChange={(e) =>
                                    handleDecisionDraftChange(motionId, "outcome", e.target.value)
                                  }
                                >
                                  <option value="pending">Pending</option>
                                  <option value="passed">Passed</option>
                                  <option value="failed">Failed</option>
                                  <option value="postponed">Postponed</option>
                                </select>
                              </label>
                              <label className="block text-sm font-semibold text-wine">
                                Decision summary
                                <textarea
                                  className="mt-2 min-h-[90px] w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                  placeholder="Describe the rationale, amendments, or chair notes."
                                  value={decisionDraft.summary}
                                  onChange={(e) =>
                                    handleDecisionDraftChange(motionId, "summary", e.target.value)
                                  }
                                />
                              </label>
                              <label className="block text-sm font-semibold text-wine">
                                Pros captured
                                <textarea
                                  className="mt-2 min-h-[70px] w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                  placeholder="Highlight supporting arguments or benefits."
                                  value={decisionDraft.pros}
                                  onChange={(e) =>
                                    handleDecisionDraftChange(motionId, "pros", e.target.value)
                                  }
                                />
                              </label>
                              <label className="block text-sm font-semibold text-wine">
                                Cons captured
                                <textarea
                                  className="mt-2 min-h-[70px] w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                  placeholder="Document concerns, trade-offs, or objections."
                                  value={decisionDraft.cons}
                                  onChange={(e) =>
                                    handleDecisionDraftChange(motionId, "cons", e.target.value)
                                  }
                                />
                              </label>
                              <button type="submit" className="btn-secondary w-full justify-center">
                                {decisionRecord ? "Update decision record" : "Save decision record"}
                              </button>
                            </form>
                          ) : (
                            <p className="mt-4 text-xs text-text/60">
                              Only the owner or chair can finalize motions.
                            </p>
                          )}
                          {decisionOutcome === "passed" && (
                            <div className="mt-6 rounded-2xl border border-cream/70 bg-white/80 p-4">
                              <p className="text-sm font-semibold text-wine">Overturn this decision</p>
                              <p className="text-xs text-text/60">
                                Only members who voted in favor may request overturning the result.
                              </p>
                              {canRequestOverturn(motion) ? (
                                <form
                                  className="mt-4 space-y-3"
                                  onSubmit={(event) => submitOverturnRequest(event, motion)}
                                >
                                  <label className="block text-sm font-semibold text-wine">
                                    Request title
                                    <input
                                      className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                      placeholder={`Overturn: ${motion.title}`}
                                      value={overturnDraft.title}
                                      onChange={(e) =>
                                        handleOverturnDraftChange(motionId, "title", e.target.value)
                                      }
                                    />
                                  </label>
                                  <label className="block text-sm font-semibold text-wine">
                                    Justification
                                    <textarea
                                      className="mt-2 min-h-[80px] w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                      placeholder="Explain why the decision should be reconsidered."
                                      value={overturnDraft.justification}
                                      onChange={(e) =>
                                        handleOverturnDraftChange(motionId, "justification", e.target.value)
                                      }
                                    />
                                  </label>
                                  <button type="submit" className="btn-primary w-full justify-center">
                                    Submit overturn request
                                  </button>
                                </form>
                              ) : (
                                <p className="mt-3 text-xs text-text/60">
                                  You must have voted in favor to raise an overturn request.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 rounded-2xl border border-cream/70 bg-white/85 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-wine">Sub-motions & revisions</p>
                            <span className="text-xs text-text/60">{childMotions.length} linked</span>
                          </div>
                          {childMotions.length === 0 ? (
                            <p className="mt-3 text-sm text-text/65">
                              None recorded yet. Use this area to propose revisions or postponements.
                            </p>
                          ) : (
                            <ul className="mt-4 space-y-3 text-sm text-text/75">
                              {childMotions.map((child) => (
                                <li
                                  key={child.id}
                                  className="rounded-2xl border border-cream/70 bg-white/90 p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <p className="font-semibold text-wine">{child.title}</p>
                                      <p className="text-xs text-text/60">
                                        {formatVariantLabel(child.variantOf || "revision")} •{" "}
                                        {formatStatus(child.status || "pending")}
                                      </p>
                                    </div>
                                    <span className="text-[11px] text-text/55">
                                      {formatTimestamp(child.createdAt)}
                                    </span>
                                  </div>
                                  {child.description && (
                                    <p className="mt-2 text-sm text-text/70">{child.description}</p>
                                  )}
                                  {child.decisionRecord?.summary && (
                                    <p className="mt-2 text-xs text-text/60">
                                      Summary: {child.decisionRecord.summary}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          {canPerform("createMotion") && (
                            <form
                              className="mt-5 space-y-4"
                              onSubmit={(event) => submitSubMotion(event, motion)}
                            >
                              <label className="block text-sm font-semibold text-wine">
                                Sub-motion type
                                <select
                                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-3 py-2 text-sm text-text focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                  value={subMotionDraft.variant}
                                  onChange={(e) =>
                                    handleSubMotionDraftChange(motionId, "variant", e.target.value)
                                  }
                                >
                                  <option value="revision">Revision</option>
                                  <option value="amendment">Amendment</option>
                                  <option value="postpone">Postpone</option>
                                </select>
                              </label>
                              <label className="block text-sm font-semibold text-wine">
                                Title
                                <input
                                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                  placeholder="Summarize the revision or postponement"
                                  value={subMotionDraft.title}
                                  onChange={(e) =>
                                    handleSubMotionDraftChange(motionId, "title", e.target.value)
                                  }
                                />
                              </label>
                              <label className="block text-sm font-semibold text-wine">
                                Description
                                <textarea
                                  className="mt-2 min-h-[90px] w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                                  placeholder="Provide context or proposed changes (optional)"
                                  value={subMotionDraft.description}
                                  onChange={(e) =>
                                    handleSubMotionDraftChange(motionId, "description", e.target.value)
                                  }
                                />
                              </label>
                              <button type="submit" className="btn-primary w-full justify-center">
                                Add sub-motion
                              </button>
                            </form>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card mt-10 border border-cream/70 bg-white/90 p-6">
          <h2 className="text-lg font-semibold text-wine">Decision archive</h2>
          <p className="text-sm text-text/65">
            Reference finalized outcomes, summaries, and overturn activity to brief new members.
          </p>
          {decidedMotions.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-cream/60 bg-peach/30 p-6 text-center text-sm text-text/70">
              No decisions have been recorded for this committee yet.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {decidedMotions.map((motion) => (
                <li
                  key={`decision-${motion._id || motion.id}`}
                  className="rounded-2xl border border-cream/70 bg-white/85 p-5 text-sm text-text/75"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-wine">{motion.title}</p>
                      <p className="text-xs text-text/60">
                        {formatStatus(motion.decisionRecord?.outcome)} •{" "}
                        {formatTimestamp(motion.decisionRecord?.recordedAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-rose/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose">
                      {displayType(motion.type)}
                    </span>
                  </div>
                  {motion.decisionRecord?.summary && (
                    <p className="mt-3 text-sm text-text/75">
                      Summary: {motion.decisionRecord.summary}
                    </p>
                  )}
                  {(motion.decisionRecord?.pros || motion.decisionRecord?.cons) && (
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      {motion.decisionRecord?.pros && (
                        <p className="rounded-2xl border border-cream/70 bg-peach/25 p-3 text-xs text-text/70">
                          <span className="font-semibold text-wine">Pros:</span>{" "}
                          {motion.decisionRecord.pros}
                        </p>
                      )}
                      {motion.decisionRecord?.cons && (
                        <p className="rounded-2xl border border-cream/70 bg-peach/25 p-3 text-xs text-text/70">
                          <span className="font-semibold text-wine">Cons:</span>{" "}
                          {motion.decisionRecord.cons}
                        </p>
                      )}
                    </div>
                  )}
                  {sortedMotions.some(
                    (child) =>
                      String(child.parentMotionId) === String(motion._id || motion.id) &&
                      child.variantOf === "overturn"
                  ) && (
                    <p className="mt-3 text-xs text-text/55">
                      Overturn requests pending for this decision.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
  function formatRole(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }

  function formatStatus(value) {
    switch (value) {
      case "passed":
        return "Passed";
      case "failed":
        return "Failed";
      case "postponed":
        return "Postponed";
      default:
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Pending";
    }
  }

  function formatVariantLabel(value) {
    switch (value) {
      case "amendment":
        return "Amendment";
      case "postpone":
        return "Postpone";
      case "overturn":
        return "Overturn";
      case "revision":
      default:
        return "Revision";
    }
  }

  function formatStance(value) {
    switch (value) {
      case "pro":
        return "Pro";
      case "con":
        return "Con";
      default:
        return "Neutral";
    }
  }

  function stanceChipClass(value) {
    switch (value) {
      case "pro":
        return "bg-rose/20 text-rose";
      case "con":
        return "bg-wine/20 text-wine";
      default:
        return "bg-sand/60 text-text/70";
    }
  }

  function formatVoteChoice(choice) {
    switch (choice) {
      case "against":
        return "Opposed";
      case "abstain":
        return "Abstain";
      default:
        return "In favor";
    }
  }

  function motionPreviewText(motion) {
    if (!motion) return "No description provided.";
    const base =
      motion.description ||
      (motion.decisionRecord?.summary ? `Decision: ${motion.decisionRecord.summary}` : "") ||
      displayType(motion.type);
    if (!base) return "No description provided.";
    const condensed = base.replace(/\s+/g, " ").trim();
    return condensed.length > 180 ? `${condensed.slice(0, 177)}...` : condensed;
  }

  function renderVoteSummary(motion) {
    const votes = motion.votes || [];
    const tallies = computeVoteTallies(votes);
    const listNames = Boolean(committee?.settings?.recordNamesInVotes);
    return (
      <>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { key: "support", label: "In favor", accent: "text-wine" },
            { key: "against", label: "Opposed", accent: "text-rose" },
            { key: "abstain", label: "Abstain", accent: "text-text/70" },
          ].map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-cream/70 bg-white/90 px-4 py-3 text-center"
            >
              <p className={`text-sm font-semibold ${item.accent}`}>{item.label}</p>
              <p className="text-2xl font-bold text-wine">{tallies[item.key]}</p>
            </div>
          ))}
        </div>
        {!listNames && (
          <p className="mt-3 text-xs text-text/60">
            Votes are anonymous; voter names are hidden per chair setting.
          </p>
        )}
        {listNames && votes.length > 0 && (
          <div className="mt-4 rounded-2xl border border-cream/60 bg-peach/25 p-3 text-sm text-text/75">
            <p className="font-semibold text-wine">Recorded votes</p>
            <ul className="mt-2 space-y-1">
              {votes.map((vote) => (
                <li key={vote.id} className="flex items-center justify-between text-xs">
                  <span>{vote.createdByName || "Member"}</span>
                  <span className="font-semibold">{formatVoteChoice(vote.choice)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  function computeVoteTallies(list = []) {
    return list.reduce(
      (acc, vote) => {
        const key = vote.choice || "support";
        if (acc[key] === undefined) acc[key] = 0;
        acc[key] += 1;
        return acc;
      },
      { support: 0, against: 0, abstain: 0 }
    );
  }

  function getExistingVoteForMotion(motion) {
    return (motion.votes || []).find((vote) => isVoteByCurrentUser(vote)) || null;
  }

  function isVoteByCurrentUser(vote) {
    if (!currentUser || !vote) return false;
    if (vote.createdBy != null && currentUser.id != null) return vote.createdBy === currentUser.id;
    if (vote.createdByEmail && currentUser.email) {
      return vote.createdByEmail.toLowerCase() === currentUser.email.toLowerCase();
    }
    return false;
  }

  function isEntryByCurrentUser(entry) {
    if (!currentUser || !entry) return false;
    if (entry.createdBy != null && currentUser.id != null) return entry.createdBy === currentUser.id;
    if (entry.createdByEmail && currentUser.email) {
      return entry.createdByEmail.toLowerCase() === currentUser.email.toLowerCase();
    }
    if (entry.createdByName && currentUser.name) {
      return entry.createdByName.toLowerCase() === currentUser.name.toLowerCase();
    }
    return false;
  }

  function isSameUser(entry, other) {
    if (!entry || !other) return false;
    if (entry.createdBy != null && other.createdBy != null) return entry.createdBy === other.createdBy;
    if (entry.createdByEmail && other.createdByEmail) {
      return entry.createdByEmail.toLowerCase() === other.createdByEmail.toLowerCase();
    }
    if (entry.createdByName && other.createdByName) {
      return entry.createdByName.toLowerCase() === other.createdByName.toLowerCase();
    }
    return false;
  }

  function safeId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
