import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...rest },
  ref,
) {
  return (
    <label className="block text-sm" htmlFor={id}>
      {label ? (
        <span className="block mb-1 text-ink-black/70 font-medium">{label}</span>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-xl border border-ink-black/30 bg-canvas-white px-4 py-2 text-base text-ink-black focus:outline-none focus:border-ink-black transition-colors ${className}`}
        {...rest}
      />
      {error ? <span className="block mt-1 text-red-600 text-xs">{error}</span> : null}
    </label>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = '', rows = 3, ...rest },
  ref,
) {
  return (
    <label className="block text-sm" htmlFor={id}>
      {label ? (
        <span className="block mb-1 text-ink-black/70 font-medium">{label}</span>
      ) : null}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`w-full rounded-xl border border-ink-black/30 bg-canvas-white px-4 py-2 text-base text-ink-black focus:outline-none focus:border-ink-black transition-colors resize-y ${className}`}
        {...rest}
      />
      {error ? <span className="block mt-1 text-red-600 text-xs">{error}</span> : null}
    </label>
  );
});
