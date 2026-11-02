"use client";

import { useEffect, useState } from "react";
import styles from "@/app/public-operations.module.css";

type AttendanceState = {
  id?: number;
  present?: boolean | null;
};

type MemberRow = {
  departmentName: string;
  firstName: string;
  fullName: string;
  id: number;
  record?: AttendanceState;
};

type SaveResponse = {
  saved?: {
    id?: number;
    member?: number;
    present?: boolean | null;
  }[];
};

export function AttendanceSearch({
  date,
}: {
  date: string;
}) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingMembers, setSavingMembers] = useState<Record<number, boolean>>({});
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) {
      setMembers([]);
      setIsLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          date,
          query: trimmed,
        });
        const response = await fetch(`/api/public-attendance?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Attendance search failed.");
        }

        const data = (await response.json()) as { members?: MemberRow[] };
        setMembers(data.members ?? []);
        setSavingMembers({});
      } catch (err) {
        if (!controller.signal.aborted) {
          setMembers([]);
          setError("Search could not load. Try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [date, trimmed]);

  const saveMemberAttendance = async (member: MemberRow, present: boolean) => {
    setSavingMembers((current) => ({
      ...current,
      [member.id]: true,
    }));
    setError("");

    const formData = new FormData();
    formData.set("date", date);
    formData.append("memberIds", String(member.id));
    formData.set(`existing_${member.id}`, member.record?.id ? String(member.record.id) : "");

    if (present) {
      formData.append("presentMembers", String(member.id));
    }

    try {
      const response = await fetch("/api/public-attendance", {
        body: formData,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "attendance-autosave",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Attendance autosave failed.");
      }

      const data = (await response.json()) as SaveResponse;
      const savedRecord = data.saved?.find((record) => record.member === member.id);

      setMembers((current) =>
        current.map((item) => {
          if (item.id !== member.id) {
            return item;
          }

          return {
            ...item,
            record: savedRecord
              ? {
                  id: savedRecord.id,
                  present: savedRecord.present,
                }
              : item.record
                ? {
                    ...item.record,
                    present,
                  }
                : undefined,
          };
        }),
      );
    } catch {
      setError("Attendance could not save. Try again.");
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id
            ? {
                ...item,
                record: member.record,
              }
            : item,
        ),
      );
    } finally {
      setSavingMembers((current) => {
        const next = { ...current };
        delete next[member.id];
        return next;
      });
    }
  };

  return (
    <>
      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search members or departments..."
          type="search"
          value={query}
        />
      </div>

      <form action="/api/public-attendance" className={styles.form} method="post">
        <div aria-hidden="true" style={{ height: 1, left: "-10000px", overflow: "hidden", position: "absolute", width: 1 }}>
          <label htmlFor="companyWebsite">Leave this field empty</label>
          <input autoComplete="off" id="companyWebsite" name="companyWebsite" tabIndex={-1} type="text" />
        </div>
        <input name="date" type="hidden" value={date} />
        {error ? <div role="alert" className={`${styles.banner} ${styles.bannerWarn}`}>{error}</div> : null}
        <div className={styles.memberGrid}>
          {trimmed.length < 2 ? (
            <div className={styles.empty}>Type at least 2 letters to load matching members.</div>
          ) : isLoading ? (
            <div className={styles.empty}>Loading matching members...</div>
          ) : members.length === 0 ? (
            <div className={styles.empty}>No members matched the current search.</div>
          ) : (
            members.map((member) => (
              <article className={styles.memberCard} key={member.id}>
                <input name="memberIds" type="hidden" value={member.id} />
                <input name={`existing_${member.id}`} type="hidden" value={member.record?.id ?? ""} />
                <div className={styles.memberTop}>
                  <div className={styles.memberIdentity}>
                    <div className={styles.avatar}>{member.firstName.slice(0, 1) || "M"}</div>
                    <div>
                      <span className={styles.memberName}>{member.fullName}</span>
                      <span className={styles.memberMeta}>{member.departmentName}</span>
                    </div>
                  </div>
                  <input
                    className={styles.checkbox}
                    checked={member.record?.present ?? false}
                    disabled={Boolean(savingMembers[member.id])}
                    name="presentMembers"
                    onChange={(event) => {
                      const present = event.currentTarget.checked;
                      setMembers((current) =>
                        current.map((item) =>
                          item.id === member.id
                            ? {
                                ...item,
                                record: {
                                  id: item.record?.id,
                                  present,
                                },
                              }
                            : item,
                        ),
                      );
                      void saveMemberAttendance(member, present);
                    }}
                    type="checkbox"
                    value={member.id}
                  />
                </div>

                <div className={styles.triple}>
                  <div>
                    <label className={styles.fieldLabel}>Status</label>
                    <span className={`${styles.statusPill} ${member.record?.present ? styles.statusPresent : styles.statusMissing}`}>
                      {savingMembers[member.id] ? "Saving..." : member.record?.present ? "Present" : "Not marked"}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {members.length > 0 ? (
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit">
              Save Attendance
            </button>
          </div>
        ) : null}
      </form>
    </>
  );
}
