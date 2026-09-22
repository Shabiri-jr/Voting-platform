type CandidateAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "compact" | "ballot";
};

const sizeStyles = {
  compact: {
    dimension: 48,
    frame: "size-12 rounded-xl",
    initials: "text-xs",
  },
  ballot: {
    dimension: 64,
    frame: "size-14 rounded-xl sm:size-16",
    initials: "text-sm",
  },
} as const;

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function CandidateAvatar({
  name,
  photoUrl,
  size = "compact",
}: CandidateAvatarProps) {
  const styles = sizeStyles[size];

  if (photoUrl) {
    return (
      // Candidate images use administrator-controlled runtime URLs.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        width={styles.dimension}
        height={styles.dimension}
        loading="lazy"
        decoding="async"
        className={`${styles.frame} shrink-0 bg-slate-100 object-cover`}
      />
    );
  }

  return (
    <span
      className={`${styles.frame} ${styles.initials} grid shrink-0 place-items-center bg-navy font-bold text-white`}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
