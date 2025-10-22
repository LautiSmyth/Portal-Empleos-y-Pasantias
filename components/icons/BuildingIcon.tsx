
import React from 'react';

const BuildingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <line x1="9" y1="9" x2="9.01" y2="9"></line>
    <line x1="15" y1="9" x2="15.01" y2="9"></line>
    <line x1="9" y1="12" x2="9.01" y2="12"></line>
    <line x1="15" y1="12" x2="15.01" y2="12"></line>
    <line x1="9" y1="15" x2="9.01" y2="15"></line>
    <line x1="15" y1="15" x2="15.01" y2="15"></line>
  </svg>
);

export default BuildingIcon;
