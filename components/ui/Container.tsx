import React from 'react';

export type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
};

export const Container: React.FC<ContainerProps> = ({ as = 'div', className, children, ...rest }) => {
  const Component = as as any;
  const classes = ['ui-container', className || ''].filter(Boolean).join(' ');
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
};

export default Container;