import React from 'react';

interface PageTemplateProps {
  pageTitle: string;
  pageDescription?: string;
  children?: React.ReactNode;
}

const PageTemplate: React.FC<PageTemplateProps> = ({
  pageTitle,
  pageDescription,
  children
}) => {
  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
              {pageTitle}
            </h1>
            {pageDescription && (
              <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                {pageDescription}
              </p>
            )}
          </div>
          
          {/* Content Area */}
          <div className="bg-gray-900 border border-gray-800 p-8 md:p-12 rounded-lg">
            {children || (
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                  Content Area
                </h2>
                <p className="text-gray-400 mb-8">
                  This is a template page. Replace this content with your specific page content.
                </p>
                <div className="inline-block bg-motorsport-yellow/10 border border-motorsport-yellow/30 px-6 py-3 rounded">
                  <span className="text-motorsport-yellow font-medium">TEMPLATE</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PageTemplate;
