import React from 'react';
import mobilepayLogo from '@/assets/payment/mobilepay.png';
import applePayLogo from '@/assets/payment/apple-pay.png';
import paypalLogo from '@/assets/payment/paypal.png';
import dankortVisaLogo from '@/assets/payment/dankort-visa.png';
import mastercardLogo from '@/assets/payment/mastercard.png';

export const PaymentLogos = () => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <img src={dankortVisaLogo} alt="Dankort & Visa" className="h-8 w-auto object-contain" />
      <img src={mastercardLogo} alt="Mastercard" className="h-8 w-auto object-contain" />
      <img src={mobilepayLogo} alt="MobilePay" className="h-8 w-auto object-contain" />
      <img src={applePayLogo} alt="Apple Pay" className="h-8 w-auto object-contain" />
      <img src={paypalLogo} alt="PayPal" className="h-8 w-auto object-contain" />
    </div>
  );
};

export default PaymentLogos;
