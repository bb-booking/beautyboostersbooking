import React from 'react';

// Visa Logo
const VisaLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect fill="#1A1F71" width="48" height="32" rx="4"/>
    <path fill="#fff" d="M18.5 20.6l1.4-9.1h2.3l-1.4 9.1h-2.3zm9.9-8.9c-.5-.2-1.2-.4-2.1-.4-2.3 0-4 1.1-4 2.7 0 1.2 1.1 1.8 2 2.2.9.4 1.2.7 1.2 1 0 .6-.7.8-1.4.8-1 0-1.5-.1-2.3-.5l-.3-.1-.3 2c.6.3 1.6.5 2.7.5 2.5 0 4.1-1.1 4.1-2.8 0-.9-.6-1.6-1.9-2.2-.8-.4-1.3-.6-1.3-1 0-.3.4-.7 1.3-.7.7 0 1.3.1 1.7.3l.2.1.4-1.9zm6.1-.2h-1.8c-.6 0-1 .2-1.2.7l-3.5 7.4h2.5l.5-1.3h3c.1.3.3 1.3.3 1.3h2.2l-2-8.1zm-2.7 5.3c.2-.5 1-2.4 1-2.4l.1-.4.2.7.6 2.1h-1.9zm-17.3-5.1l-2.2 6.2-.2-1.2c-.4-1.3-1.7-2.7-3.1-3.4l2.1 7.3h2.5l3.8-8.9h-2.9z"/>
    <path fill="#F9A533" d="M10.8 11.5h-4l-.1.2c3 .7 5 2.4 5.8 4.4l-.8-3.8c-.1-.6-.5-.7-1-.8z"/>
  </svg>
);

// Mastercard Logo
const MastercardLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect fill="#fff" width="48" height="32" rx="4" stroke="#e5e5e5"/>
    <circle fill="#ED0006" cx="18" cy="16" r="9"/>
    <circle fill="#F9A000" cx="30" cy="16" r="9"/>
    <path fill="#FF5E00" d="M24 9.3a9 9 0 0 0 0 13.4 9 9 0 0 0 0-13.4z"/>
  </svg>
);

// Dankort Logo
const DankortLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect fill="#fff" width="48" height="32" rx="4" stroke="#e5e5e5"/>
    <rect fill="#D1232A" x="6" y="8" width="36" height="16" rx="2"/>
    <text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">DANKORT</text>
  </svg>
);

// MobilePay Logo
const MobilePayLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect fill="#5A78FF" width="48" height="32" rx="4"/>
    <path fill="#fff" d="M14 10h4v12h-4V10zm8 0h4c4 0 6 2 6 6s-2 6-6 6h-4V10zm4 9c2 0 3-.8 3-3s-1-3-3-3h-1v6h1z"/>
  </svg>
);

// Apple Pay Logo
const ApplePayLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect fill="#000" width="48" height="32" rx="4"/>
    <g fill="#fff" transform="translate(8, 9) scale(0.12)">
      <path d="M45.1 20.4c-.4-3.4-2.9-5.6-6.1-5.6-1.6 0-3 .6-4.1 1.6-1-1-2.4-1.6-4-1.6-1.3 0-2.4.4-3.4 1.1v-.8h-4.2v15.6h4.4V22c0-1.7 1-2.7 2.4-2.7 1.3 0 2.2 1 2.2 2.6v8.8h4.4V22c0-1.7 1-2.7 2.4-2.7 1.3 0 2.2 1 2.2 2.6v8.8h4.4v-9c0-.4 0-.9-.1-1.3zm17.9 2.9c0-4.7-3.3-8.5-8.2-8.5-5 0-8.5 3.8-8.5 8.7 0 5 3.6 8.5 8.8 8.5 2.9 0 5.3-1 6.9-2.9l-2.8-2.4c-1.1 1.1-2.4 1.7-4 1.7-2.3 0-4-1.2-4.5-3.5h12.1c.1-.5.2-1.1.2-1.6zm-12.2-1.5c.4-2 1.9-3.4 4-3.4 2 0 3.4 1.4 3.8 3.4H50.8z"/>
      <path d="M88.7 15.3h-4.5l-4.7 11.3-4.7-11.3h-4.7l7.1 15.2-4.1 8.5h4.5l10.1-23.7z"/>
      <path d="M17.4 10.6c-1.6 0-2.8-.6-3.7-1.6-.9 1-2.1 1.6-3.7 1.6-2.8 0-5-2.1-5-5.3C5 2.2 7.1 0 10 0c1.6 0 2.8.6 3.7 1.6.9-1 2.1-1.6 3.7-1.6 2.9 0 5 2.2 5 5.3 0 3.2-2.1 5.3-5 5.3z"/>
    </g>
    <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">Pay</text>
  </svg>
);

// Google Pay Logo
const GooglePayLogo = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect fill="#fff" width="48" height="32" rx="4" stroke="#e5e5e5"/>
    <g transform="translate(6, 8)">
      <path fill="#4285F4" d="M17.5 9.8v4.8h-2V0h5.3c1.3 0 2.4.4 3.3 1.3.9.9 1.4 2 1.4 3.2 0 1.3-.5 2.4-1.4 3.2-.9.9-2 1.3-3.3 1.3h-3.3v.8zm0-6v4.4h3.4c.8 0 1.4-.3 1.9-.7.5-.5.8-1.1.8-1.8 0-.7-.3-1.3-.8-1.8-.5-.5-1.1-.7-1.9-.7h-3.4v.6z"/>
      <path fill="#34A853" d="M32.3 5.6c1.5 0 2.7.4 3.6 1.2.9.8 1.3 1.9 1.3 3.3v6.5h-1.9v-1.5h-.1c-.8 1.2-1.9 1.8-3.3 1.8-1.2 0-2.2-.4-3-.1-1.8-.8-1.1-1.9-1.1-3.1 0-1.3.5-2.3 1.4-3 .9-.7 2.1-1.1 3.6-1.1 1.3 0 2.3.2 3 .7v-.5c0-.7-.3-1.3-.8-1.8-.5-.5-1.2-.7-1.9-.7-.1 0-2 .4-2.5 1.3l-1.7-1.1c.7-1.2 1.9-1.8 3.4-1.8v-.1zm-2.6 7c0 .5.2 1 .6 1.3.4.4.9.5 1.5.5.8 0 1.5-.3 2.1-.9.6-.6.9-1.2.9-2-.6-.5-1.5-.8-2.7-.8-.9 0-1.6.2-2.1.6-.5.4-.7.9-.7 1.4l.4-.1z"/>
      <path fill="#4285F4" d="M42 16l-5-12h2.1l3.4 8.5h.1l3.3-8.5H48l-5 12h-1z"/>
    </g>
  </svg>
);

export const PaymentLogos = () => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <VisaLogo />
      <MastercardLogo />
      <DankortLogo />
      <MobilePayLogo />
      <ApplePayLogo />
      <GooglePayLogo />
    </div>
  );
};

export default PaymentLogos;
