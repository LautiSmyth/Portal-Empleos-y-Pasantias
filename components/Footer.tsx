
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} UniJobs Connect. All rights reserved.</p>
          <p className="mt-1">Connecting Talent with Opportunity.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
