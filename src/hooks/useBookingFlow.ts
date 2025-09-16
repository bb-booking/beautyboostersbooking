import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface BookingDetails {
  serviceId?: string;
  area?: string;
  address?: string;
  date?: string;
  time?: string;
  boosterId?: string;
  [key: string]: any;
}

export const useBookingFlow = () => {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({});
  const navigate = useNavigate();

  // Load booking details from sessionStorage on mount
  useEffect(() => {
    const loadBookingDetails = () => {
      try {
        // Check for quick booking first
        const quickBooking = sessionStorage.getItem('quickBooking');
        if (quickBooking) {
          const details = JSON.parse(quickBooking);
          setBookingDetails(details);
          return;
        }

        // Fallback to regular booking details
        const regularBooking = sessionStorage.getItem('bookingDetails');
        if (regularBooking) {
          const details = JSON.parse(regularBooking);
          setBookingDetails(details);
        }
      } catch (error) {
        console.error('Error loading booking details:', error);
      }
    };

    loadBookingDetails();
  }, []);

  // Update booking details and persist to sessionStorage
  const updateBookingDetails = (updates: Partial<BookingDetails>) => {
    const newDetails = { ...bookingDetails, ...updates };
    setBookingDetails(newDetails);
    
    try {
      sessionStorage.setItem('bookingDetails', JSON.stringify(newDetails));
    } catch (error) {
      console.error('Error saving booking details:', error);
    }
  };

  // Clear booking details
  const clearBookingDetails = () => {
    setBookingDetails({});
    try {
      sessionStorage.removeItem('bookingDetails');
      sessionStorage.removeItem('quickBooking');
      sessionStorage.removeItem('selectedCounts');
    } catch (error) {
      console.error('Error clearing booking details:', error);
    }
  };

  // Navigation helpers for the booking flow
  const goToServices = (clientType?: 'privat' | 'virksomhed') => {
    if (clientType) {
      sessionStorage.setItem('selectedClientType', clientType);
    }
    navigate('/services');
  };

  const goToAddress = (serviceId?: string) => {
    if (serviceId) {
      updateBookingDetails({ serviceId });
    }
    navigate(`/address${serviceId ? `?service=${serviceId}` : ''}`);
  };

  const goToBooking = (serviceId?: string, boosterId?: string) => {
    if (serviceId) {
      updateBookingDetails({ serviceId });
    }
    
    const params = new URLSearchParams();
    if (serviceId) params.set('service', serviceId);
    if (boosterId) params.set('booster', boosterId);
    
    navigate(`/booking${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const goToCheckout = (bookingData: any) => {
    navigate('/checkout', { state: bookingData });
  };

  return {
    bookingDetails,
    updateBookingDetails,
    clearBookingDetails,
    goToServices,
    goToAddress,
    goToBooking,
    goToCheckout,
  };
};