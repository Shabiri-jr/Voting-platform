type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "email" | "number" | "url" | "datetime-local";
  help?: string;
};

export function TextField({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
  help,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-navy">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm placeholder:text-slate-400 focus:border-accent focus:outline-none"
      />
      {help ? <p className="text-xs leading-5 text-slate-500">{help}</p> : null}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string | null;
  required?: boolean;
};

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-navy">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm focus:border-accent focus:outline-none"
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
};

export function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-navy">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm leading-6 text-navy shadow-sm placeholder:text-slate-400 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

export function FormSubmit({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-strong active:translate-y-px disabled:opacity-60"
    >
      {children}
    </button>
  );
}
