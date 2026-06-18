export type PageUpdateStatus = 'up_to_date' | 'needs_update';

export interface PageStatusRegistryItem {
  key: string;
  label: string;
  routePath: string | null;
  kind: 'page' | 'form';
  headerMenuLabel?: string;
  footerMenuLabel?: string;
  defaultUpdateStatus: PageUpdateStatus;
  defaultIsOnline: boolean;
  defaultNotes: string;
}

export const pageStatusRegistry: PageStatusRegistryItem[] = [
  { key: 'home_page', label: 'Home', routePath: '/', kind: 'page', headerMenuLabel: 'Home', footerMenuLabel: 'Home', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'about_page', label: 'About', routePath: '/about', kind: 'page', headerMenuLabel: 'About', footerMenuLabel: 'About', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'gear_page', label: 'Gear', routePath: '/gear', kind: 'page', headerMenuLabel: 'Gear', footerMenuLabel: 'Gear', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'brands_page', label: 'Brands', routePath: '/brands', kind: 'page', headerMenuLabel: 'Brands', footerMenuLabel: 'Brands', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'piaa_hub_page', label: 'PIAA', routePath: '/brands/piaa', kind: 'page', headerMenuLabel: 'PIAA', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'gallery_page', label: 'Gallery', routePath: '/gallery', kind: 'page', headerMenuLabel: 'Gallery', footerMenuLabel: 'Gallery', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'events_page', label: 'Events', routePath: '/events', kind: 'page', headerMenuLabel: 'Events', footerMenuLabel: 'Events', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'news_page', label: 'News', routePath: '/news', kind: 'page', headerMenuLabel: 'News', footerMenuLabel: 'News', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'dealers_page', label: 'Dealers', routePath: '/dealers', kind: 'page', headerMenuLabel: 'Dealers', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'dealer_application_page', label: 'Dealer Application', routePath: '/dealer-application', kind: 'page', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'contact_page', label: 'Contact', routePath: '/contact', kind: 'page', headerMenuLabel: 'Contact', footerMenuLabel: 'Contact', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'shop_page', label: 'Shop', routePath: '/shop', kind: 'page', headerMenuLabel: 'Shop', defaultUpdateStatus: 'needs_update', defaultIsOnline: false, defaultNotes: 'Not needed yet. Keep offline.' },
  { key: 'cart_page', label: 'Cart', routePath: '/cart', kind: 'page', headerMenuLabel: 'Cart', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'checkout_page', label: 'Checkout', routePath: '/checkout', kind: 'page', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'terms_page', label: 'Terms & Conditions', routePath: '/terms', kind: 'page', footerMenuLabel: 'Terms & Conditions', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'privacy_policy', label: 'Privacy Policy', routePath: '/terms#privacy-policy', kind: 'page', footerMenuLabel: 'Privacy Policy', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },

  { key: 'contact_form', label: 'Contact Form', routePath: '/contact', kind: 'form', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'dealer_application_form', label: 'Dealer Application Form', routePath: '/dealer-application', kind: 'form', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'checkout_form', label: 'Checkout Form', routePath: '/checkout', kind: 'form', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
  { key: 'piaa_contact_form', label: 'PIAA Contact / Enquiry Form', routePath: '/brands/piaa', kind: 'form', defaultUpdateStatus: 'up_to_date', defaultIsOnline: true, defaultNotes: '' },
];

export const getDefaultOnlineByRoute = (): Map<string, boolean> => {
  const map = new Map<string, boolean>();
  pageStatusRegistry.forEach((item) => {
    if (item.kind === 'page' && item.routePath) {
      map.set(item.routePath, item.defaultIsOnline);
    }
  });
  return map;
};
