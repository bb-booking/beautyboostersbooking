/**
 * BeautyBoosters Booking Widget for Shopify
 * Integrates with Supabase backend
 */

class BookingWidget {
  constructor() {
    this.supabaseUrl = 'https://your-project.supabase.co';
    this.supabaseKey = 'your-anon-key';
    this.selectedService = null;
    this.selectedDate = null;
    this.selectedTime = null;
    this.selectedBooster = null;
    this.selectedLocation = null;
    this.boosters = [];
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.initializeService();
    this.setupCalendar();
    this.setupLocationInput();
  }

  initializeService() {
    if (window.shopifyProduct) {
      this.selectedService = {
        id: window.shopifyProduct.id,
        name: window.shopifyProduct.title,
        price: window.shopifyProduct.price
      };
      this.updateServiceDisplay();
    }
  }

  setupEventListeners() {
    // Date selection
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('calendar-date')) {
        this.selectDate(e.target.dataset.date);
      }
    });

    // Time selection
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('time-slot')) {
        this.selectTime(e.target.dataset.time);
      }
    });

    // Booster selection
    document.addEventListener('click', (e) => {
      if (e.target.closest('.booster-card')) {
        const boosterCard = e.target.closest('.booster-card');
        const boosterId = boosterCard.dataset.boosterId;
        this.selectBooster(boosterId);
      }
    });

    // Proceed to checkout
    document.getElementById('proceed-to-checkout').addEventListener('click', () => {
      this.proceedToCheckout();
    });

    // Inquiry modal
    document.getElementById('send-inquiry').addEventListener('click', () => {
      this.showInquiryModal();
    });

    document.getElementById('close-inquiry').addEventListener('click', () => {
      this.hideInquiryModal();
    });

    document.getElementById('inquiry-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendInquiry();
    });
  }

  setupCalendar() {
    const calendarContainer = document.getElementById('booking-calendar');
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let calendarHtml = '<div class="calendar-grid">';
    
    // Add day headers
    const dayHeaders = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
    dayHeaders.forEach(day => {
      calendarHtml += `<div class="calendar-header">${day}</div>`;
    });
    
    // Add dates
    for (let i = 1; i <= nextMonth.getDate(); i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), i);
      if (date >= today) {
        const dateStr = date.toISOString().split('T')[0];
        calendarHtml += `<div class="calendar-date" data-date="${dateStr}">${i}</div>`;
      }
    }
    
    calendarHtml += '</div>';
    calendarContainer.innerHTML = calendarHtml;
  }

  setupLocationInput() {
    const addressInput = document.getElementById('address');
    const suggestions = document.getElementById('address-suggestions');
    
    let debounceTimer;
    addressInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.getAddressSuggestions(e.target.value);
      }, 300);
    });
  }

  async getAddressSuggestions(query) {
    if (query.length < 3) return;
    
    // Danish address API (DAWA)
    try {
      const response = await fetch(`https://api.dataforsyningen.dk/adresser?q=${encodeURIComponent(query)}&per_side=5`);
      const addresses = await response.json();
      
      const suggestions = document.getElementById('address-suggestions');
      suggestions.innerHTML = addresses.map(addr => 
        `<div class="address-suggestion" data-address="${addr.adgangsadresse.adressebetegnelse}">
          ${addr.adgangsadresse.adressebetegnelse}
        </div>`
      ).join('');
      
      // Add click listeners
      suggestions.querySelectorAll('.address-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
          this.selectLocation(suggestion.dataset.address);
        });
      });
    } catch (error) {
      console.error('Address lookup failed:', error);
    }
  }

  selectDate(date) {
    // Remove previous selection
    document.querySelectorAll('.calendar-date').forEach(el => el.classList.remove('selected'));
    
    // Add selection to clicked date
    document.querySelector(`[data-date="${date}"]`).classList.add('selected');
    
    this.selectedDate = date;
    this.generateTimeSlots();
    this.updateBookingSummary();
    
    // Fetch available boosters for this date/time
    if (this.selectedTime) {
      this.fetchAvailableBoosters();
    }
  }

  selectTime(time) {
    // Remove previous selection
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    
    // Add selection to clicked time
    document.querySelector(`[data-time="${time}"]`).classList.add('selected');
    
    this.selectedTime = time;
    this.updateBookingSummary();
    this.fetchAvailableBoosters();
  }

  selectLocation(address) {
    this.selectedLocation = address;
    document.getElementById('address').value = address;
    document.getElementById('address-suggestions').innerHTML = '';
    this.updateBookingSummary();
  }

  generateTimeSlots() {
    const timeSlotsContainer = document.getElementById('time-slots');
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    timeSlotsContainer.innerHTML = timeSlots.map(time => 
      `<div class="time-slot" data-time="${time}">${time}</div>`
    ).join('');
  }

  async fetchAvailableBoosters() {
    if (!this.selectedDate || !this.selectedTime || !this.selectedService) return;
    
    const boosterList = document.getElementById('booster-list');
    const boosterLoading = document.getElementById('booster-loading');
    const noBoosters = document.getElementById('no-boosters');
    
    boosterLoading.style.display = 'block';
    boosterList.style.display = 'none';
    noBoosters.style.display = 'none';
    
    try {
      // Mock data for now - replace with actual Supabase call
      const mockBoosters = [
        {
          id: '1',
          name: 'Angelica Bloch',
          specialties: ['Makeup', 'Hair'],
          rating: 4.9,
          reviews: 127,
          image: '/assets/profiles/angelica-profile.png',
          price: this.selectedService.price
        },
        {
          id: '2', 
          name: 'Marie Hansen',
          specialties: ['SFX', 'Makeup'],
          rating: 4.8,
          reviews: 89,
          image: '/assets/profiles/marie.png',
          price: this.selectedService.price
        }
      ];
      
      setTimeout(() => {
        this.boosters = mockBoosters;
        this.renderBoosters();
        boosterLoading.style.display = 'none';
        
        if (mockBoosters.length > 0) {
          boosterList.style.display = 'grid';
        } else {
          noBoosters.style.display = 'block';
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching boosters:', error);
      boosterLoading.style.display = 'none';
      noBoosters.style.display = 'block';
    }
  }

  renderBoosters() {
    const boosterList = document.getElementById('booster-list');
    
    boosterList.innerHTML = this.boosters.map(booster => `
      <div class="booster-card" data-booster-id="${booster.id}">
        <div class="booster-image">
          <img src="${booster.image}" alt="${booster.name}" loading="lazy">
        </div>
        <div class="booster-info">
          <h4>${booster.name}</h4>
          <div class="booster-rating">
            <span class="stars">★★★★★</span>
            <span>${booster.rating} (${booster.reviews})</span>
          </div>
          <div class="booster-specialties">
            ${booster.specialties.map(specialty => `<span class="specialty">${specialty}</span>`).join('')}
          </div>
          <div class="booster-price">${booster.price.toFixed(0)} kr</div>
          <button class="btn-select-booster">Vælg Booster</button>
        </div>
      </div>
    `).join('');
  }

  selectBooster(boosterId) {
    const booster = this.boosters.find(b => b.id === boosterId);
    if (!booster) return;
    
    // Remove previous selection
    document.querySelectorAll('.booster-card').forEach(card => card.classList.remove('selected'));
    
    // Add selection to clicked booster
    document.querySelector(`[data-booster-id="${boosterId}"]`).classList.add('selected');
    
    this.selectedBooster = booster;
    this.updateBookingSummary();
    this.checkBookingComplete();
  }

  updateServiceDisplay() {
    if (this.selectedService) {
      document.getElementById('selected-service').textContent = this.selectedService.name;
    }
  }

  updateBookingSummary() {
    if (this.selectedService) {
      document.getElementById('selected-service').textContent = this.selectedService.name;
    }
    
    if (this.selectedDate) {
      const date = new Date(this.selectedDate);
      document.getElementById('selected-date').textContent = date.toLocaleDateString('da-DK');
    }
    
    if (this.selectedTime) {
      document.getElementById('selected-time').textContent = this.selectedTime;
    }
    
    if (this.selectedBooster) {
      document.getElementById('selected-booster').textContent = this.selectedBooster.name;
    }
    
    if (this.selectedLocation) {
      document.getElementById('selected-location').textContent = this.selectedLocation;
    }
    
    // Update total price
    if (this.selectedService) {
      document.getElementById('total-price').textContent = `${this.selectedService.price.toFixed(0)} kr`;
    }
  }

  checkBookingComplete() {
    const isComplete = this.selectedService && this.selectedDate && this.selectedTime && 
                      this.selectedBooster && this.selectedLocation;
    
    document.getElementById('proceed-to-checkout').disabled = !isComplete;
  }

  proceedToCheckout() {
    // Create booking data
    const bookingData = {
      service: this.selectedService,
      date: this.selectedDate,
      time: this.selectedTime,
      booster: this.selectedBooster,
      location: this.selectedLocation,
      total: this.selectedService.price
    };
    
    // Store booking data in session storage
    sessionStorage.setItem('beautybosters_booking', JSON.stringify(bookingData));
    
    // Add product to Shopify cart with booking metadata
    this.addToCartWithBooking(bookingData);
  }

  async addToCartWithBooking(bookingData) {
    try {
      const formData = {
        'items': [{
          'id': window.shopifyProduct.id,
          'quantity': 1,
          'properties': {
            'Booking Date': `${bookingData.date} ${bookingData.time}`,
            'Booster': bookingData.booster.name,
            'Location': bookingData.location,
            'Booking ID': `BB-${Date.now()}`
          }
        }]
      };
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        // Redirect to cart or checkout
        window.location.href = '/cart';
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Der skete en fejl. Prøv igen.');
    }
  }

  showInquiryModal() {
    document.getElementById('inquiry-modal').style.display = 'flex';
  }

  hideInquiryModal() {
    document.getElementById('inquiry-modal').style.display = 'none';
  }

  async sendInquiry() {
    const formData = {
      name: document.getElementById('inquiry-name').value,
      email: document.getElementById('inquiry-email').value,
      phone: document.getElementById('inquiry-phone').value,
      message: document.getElementById('inquiry-message').value,
      service: this.selectedService?.name,
      date: this.selectedDate,
      time: this.selectedTime,
      location: this.selectedLocation
    };
    
    try {
      // Send inquiry to Supabase function
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-inquiry-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Din forespørgsel er sendt! Vi kontakter dig snarest.');
        this.hideInquiryModal();
      } else {
        throw new Error('Failed to send inquiry');
      }
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert('Der skete en fejl. Prøv igen senere.');
    }
  }
}

// Initialize booking widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BookingWidget();
});