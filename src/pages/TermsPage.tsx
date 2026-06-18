import React from 'react';
import { useLocation } from 'react-router-dom';

const TermsPage: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash === '#privacy-policy') {
      const el = document.getElementById('privacy-policy');
      if (el) {
        // Delay ensures navigation/layout has settled before scrolling from other routes.
        window.requestAnimationFrame(() => {
          const yOffset = 180;
          const y = el.getBoundingClientRect().top + window.scrollY - yOffset;
          window.scrollTo({ top: y, behavior: 'auto' });
        });
      }
    }
  }, [location.hash]);

  const contents = [
    '1. Business Information',
    '2. Website Use',
    '3. Products and Availability',
    '4. Pricing and Payments',
    '5. Orders',
    '6. Shipping and Delivery',
    '7. International Shipping',
    '8. Returns and Refunds',
    '9. Warranty Information',
    '10. Motorsport and Competition Use',
    '11. Privacy Policy',
    '12. Cookie Policy',
    '13. Third-Party Services',
    '14. Intellectual Property',
    '15. Limitation of Liability',
    '16. Governing Law',
    '17. Contact Information',
  ];

  return (
    <div className="min-h-screen bg-black">
      <section className="relative bg-gray-950 overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="relative z-10 container-narrow px-4 md:px-6 py-20 md:py-24">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">Terms &amp; Conditions</h1>
          <div className="max-w-4xl space-y-4 text-gray-300 leading-relaxed">
            <p>Welcome to Race &amp; Rally Australia.</p>
            <p>
              By accessing this website and/or purchasing products from Race &amp; Rally Australia, you agree to
              be bound by these Terms &amp; Conditions.
            </p>
            <p>
              These Terms &amp; Conditions govern the use of this website, the purchase of products and associated
              policies including shipping, returns, warranties, privacy and cookie usage.
            </p>
            <p>These Terms &amp; Conditions are governed by the laws of Victoria, Australia.</p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 mb-10">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Contents</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
              {contents.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-10 text-gray-300 leading-relaxed">
            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">1. Business Information</h3>
              <p>Race &amp; Rally Australia</p>
              <p>ABN: 31 686 146 083</p>
              <p className="mt-3">Contact Email:</p>
              <p>manager@raceandrallyaustralia.com.au</p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">2. Website Use</h3>
              <p>Users of this website agree to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>use the website lawfully and responsibly;</li>
                <li>not interfere with website functionality or security;</li>
                <li>not attempt unauthorised access to systems or data;</li>
                <li>not upload malicious code or harmful content.</li>
              </ul>
              <p className="mt-3">
                Race &amp; Rally Australia reserves the right to restrict or terminate website access where misuse,
                abuse or unlawful activity is identified.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">3. Products and Availability</h3>
              <p>
                Race &amp; Rally Australia supplies automotive, motorsport and rally-related products including
                lighting systems, accessories and related equipment.
              </p>
              <p className="mt-2">
                Products may include items manufactured by PIAA Japan and other automotive brands.
              </p>
              <p className="mt-2">While every effort is made to ensure accuracy:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>product specifications may change without notice;</li>
                <li>images may vary from actual products;</li>
                <li>colours and finishes may appear differently depending on display devices;</li>
                <li>stock availability may change at any time.</li>
              </ul>
              <p className="mt-2">Race &amp; Rally Australia reserves the right to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>modify pricing;</li>
                <li>discontinue products;</li>
                <li>limit quantities;</li>
                <li>correct errors or inaccuracies.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">4. Pricing and Payments</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>All prices are displayed in Australian Dollars (AUD).</li>
                <li>Prices may include GST where applicable unless otherwise stated.</li>
                <li>Shipping costs are calculated separately during checkout unless specified otherwise.</li>
                <li>Payment must be successfully received before products are dispatched.</li>
                <li>Race &amp; Rally Australia reserves the right to correct pricing or listing errors prior to shipment.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">5. Orders</h3>
              <p>Submission of an order does not constitute automatic acceptance of that order.</p>
              <p className="mt-2">Race &amp; Rally Australia reserves the right to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>refuse or cancel orders;</li>
                <li>request additional verification;</li>
                <li>limit quantities purchased;</li>
                <li>cancel orders where fraud or pricing issues are suspected.</li>
              </ul>
              <p className="mt-3">Where payment has already been processed for a cancelled order, a full refund will be issued.</p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">6. Shipping and Delivery</h3>
              <p>
                Race &amp; Rally Australia aims to dispatch all online orders promptly following successful payment
                confirmation.
              </p>
              <p className="mt-2">
                Orders placed and paid before 2:00pm AEST are generally processed the same business day where stock
                is available.
              </p>
              <p className="mt-2">Estimated Australian delivery timeframes are:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>East Coast Capital Cities: approximately 3 business days</li>
                <li>Inland Eastern States: approximately 5 business days</li>
                <li>Rest of Australia: approximately 5–10 business days</li>
              </ul>
              <p className="mt-2">Delivery estimates are indicative only and may vary due to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>freight carrier availability;</li>
                <li>regional delivery constraints;</li>
                <li>weather events;</li>
                <li>supplier delays;</li>
                <li>public holidays;</li>
                <li>high freight demand periods.</li>
              </ul>
              <p className="mt-2">If products are placed on back order:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>customers will be notified via email;</li>
                <li>estimated delivery timeframes will be advised where available.</li>
              </ul>
              <p className="mt-3">All shipping services remain subject to freight availability.</p>
              <p>Risk in goods passes to the customer upon delivery.</p>
              <p>Customers are responsible for ensuring shipping details are accurate at the time of ordering.</p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">7. International Shipping</h3>
              <p>International shipping is available to selected regions.</p>
              <p className="mt-2">Estimated delivery timeframes include:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>New Zealand Express: approximately 2–3 business days</li>
                <li>Pacific Region Express: approximately 4–5 business days</li>
              </ul>
              <p className="mt-2">
                International orders placed and paid before 2:00pm AEST are generally processed the same business
                day where stock is available.
              </p>
              <p className="mt-2">International delivery estimates are indicative only and remain subject to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>freight availability;</li>
                <li>customs processing;</li>
                <li>destination country requirements;</li>
                <li>international transport conditions.</li>
              </ul>
              <p className="mt-2">Customers are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>customs duties;</li>
                <li>import taxes;</li>
                <li>local fees;</li>
                <li>destination country compliance requirements.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">8. Returns and Refunds</h3>
              <p>Race &amp; Rally Australia complies fully with Australian Consumer Law.</p>
              <p className="mt-2">
                Customers are entitled to remedies including repair, replacement or refund where products fail to
                meet applicable consumer guarantees.
              </p>
              <p className="mt-3 font-semibold text-white">Incorrect Product Ordered / Change of Mind</p>
              <p>Where a customer has:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>ordered an incorrect product;</li>
                <li>selected an unsuitable product;</li>
                <li>requested a change of mind return;</li>
              </ul>
              <p className="mt-2">the following conditions may apply:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>return requests must first be discussed and approved by Race &amp; Rally Australia;</li>
                <li>products should generally be unused, uninstalled and in original packaging;</li>
                <li>return shipping costs may be charged to the customer;</li>
                <li>original shipping costs may not be refundable;</li>
                <li>restocking charges may apply where permitted by law.</li>
              </ul>
              <p className="mt-3">Customers are encouraged to confirm vehicle compatibility and product suitability prior to ordering.</p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">9. Warranty Information</h3>
              <p>Race &amp; Rally Australia complies with applicable Australian Consumer Law consumer guarantees.</p>
              <p className="mt-2">Manufacturer warranty periods include:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Lamps, Horns and Wipers: 2 Years from Date of Purchase</li>
                <li>LED Globes: 3 Years from Date of Purchase</li>
              </ul>
              <p className="mt-2">Warranty claims may require:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>proof of purchase;</li>
                <li>inspection of the product;</li>
                <li>evidence of correct installation and usage.</li>
              </ul>
              <p className="mt-2">Warranty coverage does not generally apply to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>misuse;</li>
                <li>accidental damage;</li>
                <li>improper installation;</li>
                <li>unauthorised modification;</li>
                <li>normal wear and tear.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">10. Motorsport and Competition Use</h3>
              <p>Certain products sold by Race &amp; Rally Australia may be intended for:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>motorsport use;</li>
                <li>rally competition;</li>
                <li>off-road applications.</li>
              </ul>
              <p className="mt-2">Products supplied for motorsport or competition use are supplied fit for purpose only.</p>
              <p className="mt-2">Unless otherwise required under Australian Consumer Law:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>no warranty is provided for products used in racing, rallying, competition or extreme off-road applications;</li>
                <li>motorsport use may significantly increase wear, stress and the likelihood of component failure.</li>
              </ul>
              <p className="mt-3">Customers are responsible for ensuring:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>vehicle legality;</li>
                <li>compliance with local laws and regulations;</li>
                <li>suitability for intended use.</li>
              </ul>
            </section>

            <section id="privacy-policy" className="scroll-mt-36">
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">11. Privacy Policy</h3>
              <p>
                Race &amp; Rally Australia respects customer privacy and takes reasonable steps to protect personal
                information in accordance with Australian privacy laws.
              </p>
              <p className="mt-2">Information collected may include:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>name;</li>
                <li>address;</li>
                <li>email address;</li>
                <li>phone number;</li>
                <li>order history;</li>
                <li>payment-related information;</li>
                <li>website usage data.</li>
              </ul>
              <p className="mt-2">Personal information may be used for:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>order processing;</li>
                <li>shipping and delivery;</li>
                <li>customer support;</li>
                <li>warranty claims;</li>
                <li>website improvements;</li>
                <li>marketing communications where permitted.</li>
              </ul>
              <p className="mt-3">Race &amp; Rally Australia does not sell customer information to third parties.</p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">12. Cookie Policy</h3>
              <p>Race &amp; Rally Australia uses cookies and similar technologies to support:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>website functionality;</li>
                <li>shopping cart and checkout processes;</li>
                <li>analytics;</li>
                <li>security;</li>
                <li>customer experience improvements.</li>
              </ul>
              <p className="mt-2">
                Third-party services including payment providers and analytics providers may also place cookies on
                user devices.
              </p>
              <p className="mt-2">
                By using this website, users acknowledge the use of cookies and similar technologies as described in
                this policy.
              </p>
              <p className="mt-3 font-semibold text-white">Types of Cookies Used:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><span className="font-semibold text-white">Essential Cookies</span><br />Required for website functionality, navigation and security.</li>
                <li><span className="font-semibold text-white">Security / Authentication Cookies</span><br />Help protect customer accounts, login sessions and payment security.</li>
                <li><span className="font-semibold text-white">Shopping Cart Cookies</span><br />Remember shopping cart contents and checkout information during visits.</li>
                <li><span className="font-semibold text-white">Analytics Cookies</span><br />Help understand website traffic and improve customer experience and website performance.</li>
                <li><span className="font-semibold text-white">Advertising / Remarketing Cookies</span><br />May be used in future for advertising performance measurement and remarketing campaigns.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">13. Third-Party Services</h3>
              <p>Race &amp; Rally Australia may utilise trusted third-party providers including:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>payment processors;</li>
                <li>freight carriers;</li>
                <li>analytics providers;</li>
                <li>marketing platforms;</li>
                <li>website hosting providers.</li>
              </ul>
              <p className="mt-3">Third-party providers may have their own terms, privacy policies and cookie practices.</p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">14. Intellectual Property</h3>
              <p>All website content including:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>logos;</li>
                <li>branding;</li>
                <li>graphics;</li>
                <li>text;</li>
                <li>photographs;</li>
                <li>product descriptions;</li>
                <li>website design elements;</li>
              </ul>
              <p className="mt-2">remain the property of Race &amp; Rally Australia or respective rights holders.</p>
              <p className="mt-2">Content may not be copied, reproduced or distributed without prior written permission.</p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">15. Limitation of Liability</h3>
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>liability is limited to repair, replacement or refund of products where applicable;</li>
                <li>Race &amp; Rally Australia excludes liability for indirect, incidental or consequential loss or damage.</li>
              </ul>
              <p className="mt-3">
                Nothing within these Terms &amp; Conditions excludes rights or guarantees that cannot lawfully be excluded
                under Australian Consumer Law.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">16. Governing Law</h3>
              <p>These Terms &amp; Conditions are governed by the laws of Victoria, Australia.</p>
              <p className="mt-2">
                Any disputes arising from use of this website or purchases made through the website will be subject to
                the jurisdiction of Victorian courts.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-heading font-bold mb-3 text-white">17. Contact Information</h3>
              <p>Race &amp; Rally Australia</p>
              <p>ABN: 31 686 146 083</p>
              <p className="mt-3">Email:</p>
              <p>manager@raceandrallyaustralia.com.au</p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
