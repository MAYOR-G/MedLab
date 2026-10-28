"use client";

import React, { useState } from "react";
import { ChevronDown, Check, Plus, User } from "lucide-react";
import { useActiveMember } from "@/features/family/active-member-context";
import { MemberFormDialog } from "@/features/family/member-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ProfileDropdown() {
  const { members, activeMemberId, setActiveMemberId, selectedMember } = useActiveMember();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const getBadgeColor = (rel?: string) => {
    const cleanRel = rel?.toLowerCase();
    if (cleanRel === "self") return "#2563EB";
    if (cleanRel === "spouse" || cleanRel === "partner") return "#7C3AED";
    if (cleanRel === "child") return "#059669";
    return "#4B5563";
  };

  const isSelf = selectedMember?.relationship?.toLowerCase() === "self";
  const currentInitial = selectedMember
    ? selectedMember.fullName.charAt(0).toUpperCase()
    : "P";
  const firstName = selectedMember ? selectedMember.fullName.split(" ")[0] : "Profile";
  const displayLabel = isSelf ? `${firstName} (You)` : firstName;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors shadow-2xs group focus:outline-none focus:ring-2 focus:ring-primary/20 select-none"
          >
            <span
              className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: getBadgeColor(selectedMember?.relationship) }}
            >
              {currentInitial}
            </span>

            <div className="text-left flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-800 tracking-tight truncate max-w-[130px] sm:max-w-[160px]">
                {displayLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform shrink-0" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-xl rounded-2xl">
          <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            Active Profile
          </DropdownMenuLabel>

          {/* Individual Members List */}
          {members.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No family profiles registered yet.
            </div>
          ) : (
            members.map((member) => {
              const isSelected = activeMemberId === member.id;
              const memberFirstName = member.fullName.split(" ")[0];
              const nameText =
                member.relationship?.toLowerCase() === "self"
                  ? `${memberFirstName} (You)`
                  : member.fullName;

              return (
                <DropdownMenuItem
                  key={member.id}
                  onClick={() => setActiveMemberId(member.id)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer",
                    isSelected
                      ? "bg-blue-50/80 text-primary font-bold"
                      : "text-slate-700 hover:bg-slate-100 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: getBadgeColor(member.relationship) }}
                    >
                      {member.fullName.charAt(0).toUpperCase()}
                    </span>
                    <div className="truncate">
                      <div className="leading-tight truncate">{nameText}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {member.relationship}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                </DropdownMenuItem>
              );
            })
          )}

          <DropdownMenuSeparator className="my-1" />

          {/* Add Profile Option */}
          <DropdownMenuItem
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-blue-50/70 cursor-pointer"
          >
            <div className="h-6 w-6 rounded-full border border-dashed border-primary/40 text-primary flex items-center justify-center">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span>Add Family Member</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MemberFormDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </>
  );
}
