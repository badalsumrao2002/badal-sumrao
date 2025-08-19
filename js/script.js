document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and content
            tabs.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activate the clicked tab and its content
            const target = document.getElementById(tab.dataset.tab);
            tab.classList.add('active');
            if (target) {
                target.classList.add('active');
            }
        });
    });

    // Handle all booking form submissions
    const bookingForms = document.querySelectorAll('.booking-form');
    bookingForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            const formData = new FormData(this);
            const data = new URLSearchParams(formData);

            fetch('/api/booking', {
                method: 'POST',
                body: data
            })
            .then(response => response.json())
            .then(result => {
                alert(result.message); // Show success message
                form.reset(); // Clear the form
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        });
    });
});
