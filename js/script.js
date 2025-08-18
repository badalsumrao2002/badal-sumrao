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
    const confirmationMessageDiv = document.getElementById('confirmation-message');

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(event) {
            // Prevent the default form submission (page reload)
            event.preventDefault();

            // Get values from the form
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const pickupDate = document.getElementById('pickup-date').value;
            const carType = document.getElementById('car-type').value;
            const customerName = document.getElementById('customer-name').value;
            const contactNumber = document.getElementById('contact-number').value;

            // Basic validation to ensure required fields are filled
            if (!pickup || !drop || !pickupDate || !customerName || !contactNumber) {
                alert('Please fill out all required fields.');
                return;
            }

            // Create a summary of the booking
            const summary = `
                <h3>Booking Confirmation</h3>
                <p>Thank you, <strong>${customerName}</strong>! Your booking request has been received.</p>
                <ul>
                    <li><strong>From:</strong> ${pickup}</li>
                    <li><strong>To:</strong> ${drop}</li>
                    <li><strong>Pickup Time:</strong> ${new Date(pickupDate).toLocaleString()}</li>
                    <li><strong>Car Type:</strong> ${carType}</li>
                    <li><strong>Contact:</strong> ${contactNumber}</li>
                </ul>
                <p>We will call you shortly to confirm the details.</p>
            `;

            // Display the confirmation message
            confirmationMessageDiv.innerHTML = summary;
            confirmationMessageDiv.style.display = 'block';

            // Hide the form
            bookingForm.style.display = 'none';
        });
    }
});
