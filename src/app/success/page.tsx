import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusPage } from "@/components/student/StatusPage";

export default function SuccessPage() {
  return (
    <StatusPage
      icon={CheckCircleIcon}
      tone="success"
      eyebrow="Ballot accepted"
      title="Your vote has been successfully submitted."
      description="Thank you for participating in the election. Your ballot is final and its vote rows are stored without your matric number or student identity."
    />
  );
}
