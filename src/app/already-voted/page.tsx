import { ShieldWarningIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusPage } from "@/components/student/StatusPage";

export default function AlreadyVotedPage() {
  return (
    <StatusPage
      icon={ShieldWarningIcon}
      tone="warning"
      eyebrow="Ballot unavailable"
      title="You have already cast your vote."
      description="Our records show that you have already voted. Each student is allowed to submit one ballot in this election."
    />
  );
}
