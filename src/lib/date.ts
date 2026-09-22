const lagosDateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "Africa/Lagos",
});

export function formatLagosDateTime(value: string | number | Date) {
  return `${lagosDateTimeFormatter.format(new Date(value))} WAT`;
}
