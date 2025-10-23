import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'action' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  className,
  children,
  disabled,
  ...rest
}) => {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    block ? 'w-full' : '',
    disabled || loading ? 'btn--disabled' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span aria-hidden="true" style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          borderRadius: 9999,
          border: '2px solid rgba(255,255,255,0.6)',
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
      ) : null}
      <span>{children}</span>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </button>
  );
};

export default Button;