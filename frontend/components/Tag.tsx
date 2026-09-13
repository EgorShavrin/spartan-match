/** A plain label for an interest, topic, role, or technology. */

interface TagProps {
  children: React.ReactNode;
  /** Highlights a topic or technology the member actually matched. */
  highlighted?: boolean;
}

export default function Tag({ children, highlighted = false }: TagProps) {
  const style = highlighted
    ? "border-green-200 bg-green-50 text-green-800"
    : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${style}`}>
      {children}
    </span>
  );
}
