import { IdentificationBadgeIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusPage } from "@/components/student/StatusPage";

export default function NotEligiblePage() {
  return (
    <StatusPage
      icon={IdentificationBadgeIcon}
      eyebrow="Verification unsuccessful"
      title="You are not eligible to vote."
      description="The details provided could not be matched to an eligible voter. Please check them with the election officer."
      actionLabel="Try verification again"
      actionHref="/verify"
    />
  );
}
