
import React from 'react';

interface NeumorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'accent';
}

const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  const baseClasses = "rounded-lg font-semibold transition-all duration-200 focus:outline-none";
  const variantClasses = {
    primary: 'bg-primary text-text-secondary shadow-neumorphic-sm hover:text-accent active:shadow-neumorphic-active active:text-accent',
    accent: 'bg-accent text-white shadow-md hover:bg-accent-dark',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default NeumorphicButton;
