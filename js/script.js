document.addEventListener('DOMContentLoaded', function() {
    // --- Autocomplete Logic ---
    const cities = [
        // Maharashtra
        "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Thane", "Shirdi",
        // Major Indian Cities
        "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Jaipur", "Lucknow"
    ];

    const pickupInput = document.getElementById('pickup');
    const dropInput = document.getElementById('drop');
    const pickupSuggestions = document.getElementById('pickup-suggestions');
    const dropSuggestions = document.getElementById('drop-suggestions');

    function showSuggestions(input, suggestionsContainer) {
        const value = input.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        if (!value) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const filteredCities = cities.filter(city => city.toLowerCase().startsWith(value));

        filteredCities.forEach(city => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.textContent = city;
            suggestionItem.addEventListener('click', () => {
                input.value = city;
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'none';
            });
            suggestionsContainer.appendChild(suggestionItem);
        });
        suggestionsContainer.style.display = filteredCities.length > 0 ? 'block' : 'none';
    }

    pickupInput.addEventListener('input', () => showSuggestions(pickupInput, pickupSuggestions));
    dropInput.addEventListener('input', () => showSuggestions(dropInput, dropSuggestions));

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.autocomplete-container')) {
            pickupSuggestions.style.display = 'none';
            dropSuggestions.style.display = 'none';
        }
    });


    // --- Form Submission Logic ---
    const bookingForm = document.getElementById('booking-form');

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(event) {
            // Prevent the default form submission
            event.preventDefault();

            // Get form values
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const pickupDate = new Date(document.getElementById('pickup-date').value).toLocaleString();
            const returnDate = document.getElementById('return-date').value ? new Date(document.getElementById('return-date').value).toLocaleString() : "Not specified";
            const carType = document.getElementById('car-type').value;
            const customerName = document.getElementById('customer-name').value;
            const contactNumber = document.getElementById('contact-number').value;
            const instructions = document.getElementById('special-instructions').value || "None";

            // Basic validation
            if (!pickup || !drop || !document.getElementById('pickup-date').value || !customerName || !contactNumber) {
                alert('Please fill out all required fields.');
                return;
            }

            // Construct the WhatsApp message
            const message = `
*New Cab Booking Request*

*Customer Name:* ${customerName}
*Contact Number:* ${contactNumber}

*Pickup Location:* ${pickup}
*Drop Location:* ${drop}
*Pickup Date & Time:* ${pickupDate}
*Return Date & Time:* ${returnDate}

*Car Type:* ${carType}
*Special Instructions:* ${instructions}
            `;

            // URL-encode the message
            const encodedMessage = encodeURIComponent(message.trim());
            const whatsappURL = `https://wa.me/919503257249?text=${encodedMessage}`;

            // Open WhatsApp in a new tab
            window.open(whatsappURL, '_blank');

            // Optional: Show a confirmation on the page as well
            const confirmationMessageDiv = document.getElementById('confirmation-message');
            confirmationMessageDiv.innerHTML = "<h4>Thank you!</h4><p>Your booking details are being sent via WhatsApp. Please press 'Send' in the new tab.</p>";
            confirmationMessageDiv.style.display = 'block';
            bookingForm.reset(); // Clear the form
        });
    }
});
