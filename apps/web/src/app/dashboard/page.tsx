"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentMeetings } from "@/components/dashboard/RecentMeetings";
import { RecordingBar } from "@/components/recording/RecordingBar";
import { useMeetingsList } from "@/hooks/meeting/useMeetingsList";

export default function DashboardPage() {
  const router = useRouter();
  const { data: meetings = [], isLoading } = useMeetingsList();
  const [showRecordingBar, setShowRecordingBar] = useState(false);

  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter((m) => m.status === "completed").length;
  const totalActionItems = 0;

  function handleUploadSuccess(meetingId: string) {
    router.push(`/dashboard/meetings/${meetingId}`);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafafa",
      display: "flex",
      flexDirection: "column",
      fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      boxSizing: "border-box",
      width: "100%",
      position: "relative",
    }}>
      <div style={{
        flex: 1,
        overflowY: "auto",
        // Extra bottom padding when bar is visible so content isn't hidden under it
        padding: showRecordingBar
          ? "40px 58px 160px 48px"
          : "40px 58px 32px 48px",
        boxSizing: "border-box",
        width: "100%",
        transition: "padding 0.3s ease",
      }}>
        <GreetingHeader />
        <QuickActions
          recordingBarVisible={showRecordingBar}
          onToggleRecordingBar={() => setShowRecordingBar((v) => !v)}
        />
        <RecentMeetings meetings={meetings} isLoading={isLoading} />
        <StatsCards
          totalMeetings={totalMeetings}
          completedMeetings={completedMeetings}
          totalActionItems={totalActionItems}
        />
      </div>

      {showRecordingBar && (
        <RecordingBar
          onUploadSuccess={handleUploadSuccess}
          onDismiss={() => setShowRecordingBar(false)}
        />
      )}
    </div>
  );
}