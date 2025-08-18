document.addEventListener('DOMContentLoaded', function() {

    // --- FAQ Accordion Logic ---
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.nextElementSibling;

            // Close all other answers
            document.querySelectorAll('.faq-answer').forEach(ans => {
                if (ans !== answer) {
                    ans.style.display = 'none';
                }
            });

            // Toggle the clicked answer
            if (answer.style.display === 'block') {
                answer.style.display = 'none';
            } else {
                answer.style.display = 'block';
            }
        });
    });

    // --- (Future) Booking form logic can be added here ---
    const paymentSelect = document.getElementById('payment-method-select');
    const qrCodeContainer = document.getElementById('qr-code-container');

    if (paymentSelect && qrCodeContainer) {
        paymentSelect.addEventListener('change', function() {
            if (this.value === 'pay-qr') {
                qrCodeContainer.style.display = 'block';
            } else {
                qrCodeContainer.style.display = 'none';
            }
        });
    }
});
