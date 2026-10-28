"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useFamilyMembers, type FamilyMemberData } from "@/features/family/api";

interface ActiveMemberContextType {
  activeMemberId: string | null;
  setActiveMemberId: (id: string) => void;
  selectedMember: FamilyMemberData | null;
  members: FamilyMemberData[];
  isLoading: boolean;
}

const ActiveMemberContext = createContext<ActiveMemberContextType | undefined>(undefined);

const STORAGE_KEY = "medlab_active_member_id";

export function ActiveMemberProvider({ children }: { children: React.ReactNode }) {
  const [activeMemberId, setActiveMemberIdState] = useState<string | null>(null);
  const { data: members = [], isLoading } = useFamilyMembers();

  // Load active member from localStorage or default to "Self" or first member
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && members.some((m) => m.id === saved)) {
        setActiveMemberIdState(saved);
        return;
      }
    }

    if (members.length > 0 && !activeMemberId) {
      // Find "Self" profile first, else first member
      const selfMember =
        members.find((m) => m.relationship?.toLowerCase() === "self") || members[0];
      setActiveMemberIdState(selfMember.id);
    }
  }, [members, activeMemberId]);

  const setActiveMemberId = (id: string) => {
    setActiveMemberIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  const selectedMember = members.find((m) => m.id === activeMemberId) || members[0] || null;

  return (
    <ActiveMemberContext.Provider
      value={{
        activeMemberId: selectedMember ? selectedMember.id : activeMemberId,
        setActiveMemberId,
        selectedMember,
        members,
        isLoading,
      }}
    >
      {children}
    </ActiveMemberContext.Provider>
  );
}

export function useActiveMember() {
  const context = useContext(ActiveMemberContext);
  if (!context) {
    throw new Error("useActiveMember must be used within an ActiveMemberProvider");
  }
  return context;
}
