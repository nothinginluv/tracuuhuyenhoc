/**
 * Base UI components — "Vũ Trụ Tử Vi".
 *
 * Dùng class CSS thuần trong `design-system/ui.css` (không phải Tailwind):
 * dự án chỉ có một stylesheet biên dịch bằng Vite, nên mọi thứ ở đây là
 * `ds-*` class + biến CSS từ `styles.css`.
 *
 * Quy ước:
 * · Mọi id sinh bằng `useId` để ổn định giữa các lần render.
 * · Lỗi form luôn đi kèm `aria-invalid` + `aria-describedby`.
 * · Component chỉ lo hình thức; logic nằm ở nơi gọi.
 */

import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

/** Ghép class, bỏ giá trị rỗng/false. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ── Button ───────────────────────────────────────────── */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'ds-btn',
        `ds-btn--${variant}`,
        `ds-btn--${size}`,
        fullWidth && 'ds-btn--full',
        loading && 'is-loading',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="ds-spinner" aria-hidden="true" />
      ) : icon && iconPosition === 'left' ? (
        <span className="ds-btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="ds-btn__label">{children}</span>
      {icon && iconPosition === 'right' && !loading ? (
        <span className="ds-btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </button>
  );
});

/* ── Card ─────────────────────────────────────────────── */

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Nhấc nhẹ khi hover — chỉ dùng cho thẻ bấm được. */
  interactive?: boolean;
  bordered?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className,
  interactive = false,
  bordered = true,
  padding = 'md',
}: CardProps) {
  return (
    <article
      className={cx(
        'ds-card',
        bordered && 'ds-card--bordered',
        interactive && 'ds-card--interactive',
        `ds-card--pad-${padding}`,
        className,
      )}
    >
      {children}
    </article>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={cx('ds-card__header', className)}>{children}</header>;
}

export function CardTitle({
  children,
  className,
  as: Tag = 'h3',
}: {
  children: ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}) {
  return <Tag className={cx('ds-card__title', className)}>{children}</Tag>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('ds-card__desc', className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('ds-card__content', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <footer className={cx('ds-card__footer', className)}>{children}</footer>;
}

/* ── Field wrapper ────────────────────────────────────── */

interface FieldChrome {
  label?: string;
  hint?: string;
  error?: string;
  /** Ẩn nhãn bằng mắt nhưng vẫn cho trình đọc màn hình. */
  hideLabel?: boolean;
  containerClassName?: string;
}

function fieldA11y(errorId: string, hintId: string, error?: string, hint?: string) {
  const describedBy = [error ? errorId : null, hint && !error ? hintId : null]
    .filter(Boolean)
    .join(' ');
  return {
    invalid: error ? true : undefined,
    describedBy: describedBy || undefined,
  };
}

function FieldLabel({
  htmlFor,
  text,
  hide,
}: {
  htmlFor: string;
  text: string;
  hide?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={cx('ds-field__label', hide && 'sr-only')}>
      {text}
    </label>
  );
}

function FieldMessages({
  errorId,
  hintId,
  error,
  hint,
}: {
  errorId: string;
  hintId: string;
  error?: string;
  hint?: string;
}) {
  return (
    <>
      {error ? (
        <p id={errorId} className="ds-field__error" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="ds-field__hint">
          {hint}
        </p>
      ) : null}
    </>
  );
}

/* ── Input ────────────────────────────────────────────── */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldChrome {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    hideLabel,
    containerClassName,
    leadingIcon,
    trailingIcon,
    className,
    id,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `in-${autoId}`;
  const errorId = `${inputId}-err`;
  const hintId = `${inputId}-hint`;
  const a11y = fieldA11y(errorId, hintId, error, hint);

  return (
    <div className={cx('ds-field', containerClassName)}>
      {label ? <FieldLabel htmlFor={inputId} text={label} hide={hideLabel} /> : null}
      <div className={cx('ds-field__wrap', Boolean(leadingIcon) && 'has-leading', Boolean(trailingIcon) && 'has-trailing')}>
        {leadingIcon ? (
          <span className="ds-field__icon ds-field__icon--leading" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cx('ds-input', className)}
          aria-invalid={a11y.invalid}
          aria-describedby={a11y.describedBy}
          {...rest}
        />
        {trailingIcon ? (
          <span className="ds-field__icon ds-field__icon--trailing" aria-hidden="true">
            {trailingIcon}
          </span>
        ) : null}
      </div>
      <FieldMessages errorId={errorId} hintId={hintId} error={error} hint={hint} />
    </div>
  );
});

/* ── Textarea ─────────────────────────────────────────── */

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldChrome {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, hideLabel, containerClassName, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? `ta-${autoId}`;
  const errorId = `${fieldId}-err`;
  const hintId = `${fieldId}-hint`;
  const a11y = fieldA11y(errorId, hintId, error, hint);

  return (
    <div className={cx('ds-field', containerClassName)}>
      {label ? <FieldLabel htmlFor={fieldId} text={label} hide={hideLabel} /> : null}
      <textarea
        ref={ref}
        id={fieldId}
        className={cx('ds-textarea', className)}
        aria-invalid={a11y.invalid}
        aria-describedby={a11y.describedBy}
        {...rest}
      />
      <FieldMessages errorId={errorId} hintId={hintId} error={error} hint={hint} />
    </div>
  );
});

/* ── Select ───────────────────────────────────────────── */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldChrome {
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, hideLabel, containerClassName, options, placeholder, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? `sel-${autoId}`;
  const errorId = `${fieldId}-err`;
  const hintId = `${fieldId}-hint`;
  const a11y = fieldA11y(errorId, hintId, error, hint);

  return (
    <div className={cx('ds-field', containerClassName)}>
      {label ? <FieldLabel htmlFor={fieldId} text={label} hide={hideLabel} /> : null}
      <div className="ds-field__wrap ds-select">
        <select
          ref={ref}
          id={fieldId}
          className={cx('ds-select__control', className)}
          aria-invalid={a11y.invalid}
          aria-describedby={a11y.describedBy}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg className="ds-select__chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <FieldMessages errorId={errorId} hintId={hintId} error={error} hint={hint} />
    </div>
  );
});

/* ── Checkbox · Radio · Switch ────────────────────────── */

interface ChoiceProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(function Checkbox(
  { label, description, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? `cb-${autoId}`;
  return (
    <div className={cx('ds-choice', className)}>
      <input ref={ref} id={fieldId} type="checkbox" className="ds-choice__input" {...rest} />
      {label || description ? (
        <label htmlFor={fieldId} className="ds-choice__body">
          {label ? <span className="ds-choice__label">{label}</span> : null}
          {description ? <span className="ds-choice__desc">{description}</span> : null}
        </label>
      ) : null}
    </div>
  );
});

export const Radio = forwardRef<HTMLInputElement, ChoiceProps>(function Radio(
  { label, description, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? `rd-${autoId}`;
  return (
    <div className={cx('ds-choice', className)}>
      <input ref={ref} id={fieldId} type="radio" className="ds-choice__input ds-choice__input--radio" {...rest} />
      {label || description ? (
        <label htmlFor={fieldId} className="ds-choice__body">
          {label ? <span className="ds-choice__label">{label}</span> : null}
          {description ? <span className="ds-choice__desc">{description}</span> : null}
        </label>
      ) : null}
    </div>
  );
});

export const Switch = forwardRef<HTMLInputElement, ChoiceProps>(function Switch(
  { label, description, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? `sw-${autoId}`;
  return (
    <div className={cx('ds-choice ds-choice--switch', className)}>
      <input ref={ref} id={fieldId} type="checkbox" role="switch" className="ds-switch" {...rest} />
      {label || description ? (
        <label htmlFor={fieldId} className="ds-choice__body">
          {label ? <span className="ds-choice__label">{label}</span> : null}
          {description ? <span className="ds-choice__desc">{description}</span> : null}
        </label>
      ) : null}
    </div>
  );
});
