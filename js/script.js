document.addEventListener('DOMContentLoaded', function() {

    // --- Side Menu Logic ---
    const openMenuBtn = document.getElementById('open-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const submenuToggle = document.querySelector('.submenu-toggle');

    if (openMenuBtn) {
        openMenuBtn.addEventListener('click', () => { sideMenu.style.width = '250px'; });
    }
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', () => { sideMenu.style.width = '0'; });
    }
    if (submenuToggle) {
        submenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const submenu = e.target.closest('.nav-submenu').querySelector('.submenu-content');
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        });
    }

    // --- Booking Form Tab Logic ---
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');

            tabLinks.forEach(item => item.classList.remove('active'));
            tabContents.forEach(item => item.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Autocomplete Logic (Simplified for brevity, assuming it's here) ---
    // ... (existing autocomplete code) ...


    // --- Form Submission Logic ---
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const activeTab = document.querySelector('.tab-link.active').getAttribute('data-tab');
            let message = '*New Cab Booking Request*\n\n';

            const customerName = document.getElementById('customer-name').value;
            const contactNumber = document.getElementById('contact-number').value;
            const carType = document.getElementById('car-type').value;

            if (!customerName || !contactNumber) {
                alert('Please enter your name and contact number.');
                return;
            }

            message += `*Customer:* ${customerName}\n`;
            message += `*Contact:* ${contactNumber}\n`;
            message += `*Car Type:* ${carType}\n\n`;

            if (activeTab === 'outstation') {
                const pickup = document.getElementById('pickup').value;
                const drop = document.getElementById('drop').value;
                const pickupDate = new Date(document.getElementById('pickup-date').value).toLocaleString();
                if (!pickup || !drop || !document.getElementById('pickup-date').value) {
                    alert('Please fill all fields for Outstation trip.');
                    return;
                }
                message += `*Trip Type:* Outstation\n`;
                message += `*From:* ${pickup}\n*To:* ${drop}\n`;
                message += `*Pickup Time:* ${pickupDate}\n`;

            } else if (activeTab === 'local') {
                const localPickup = document.getElementById('local-pickup').value;
                const localPackage = document.getElementById('local-package').value;
                if (!localPickup) {
                    alert('Please fill all fields for Local trip.');
                    return;
                }
                message += `*Trip Type:* Local\n`;
                message += `*Pickup Area:* ${localPickup}\n`;
                message += `*Package:* ${localPackage}\n`;

            } else if (activeTab === 'airport') {
                const tripType = document.getElementById('airport-trip-type').value;
                const airport = document.getElementById('airport-location').value;
                 if (!airport) {
                    alert('Please fill all fields for Airport trip.');
                    return;
                }
                message += `*Trip Type:* Airport Transfer (${tripType})\n`;
                message += `*Airport:* ${airport}\n`;
            }

            const encodedMessage = encodeURIComponent(message.trim());
            const whatsappURL = `https://wa.me/919503257249?text=${encodedMessage}`;

            window.open(whatsappURL, '_blank');

            const confirmationMessageDiv = document.getElementById('confirmation-message');
            confirmationMessageDiv.innerHTML = "<h4>Thank you!</h4><p>Your booking details are being sent via WhatsApp. Please press 'Send' in the new tab.</p>";
            confirmationMessageDiv.style.display = 'block';
            bookingForm.reset();
        });
    }
});
