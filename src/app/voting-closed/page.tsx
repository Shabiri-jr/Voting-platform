import { ClockCountdownIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusPage } from "@/components/student/StatusPage";

export default function VotingClosedPage() {
  return (
    <StatusPage
      icon={ClockCountdownIcon}
      tone="warning"
      eyebrow="Election status"
      title="Voting is currently closed."
      description="Ballots can only be submitted while the election is open. Contact the election officer if you believe this is an error."
    />
  );
}
