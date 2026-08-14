document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const mototaxistaFields = document.getElementById('mototaxista-fields');
    const submitBtnText = document.getElementById('submit-text');
    const submitBtnIcon = document.querySelector('.submit-btn .btn-icon');
    
    // Inputs specific to mototaxista
    const startPoint = document.getElementById('startPoint');
    const plateNumber = document.getElementById('plateNumber');
    const license = document.getElementById('license');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent default form behavior if buttons are inside form (they aren't here, but good practice)
            e.preventDefault();

            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked tab
            btn.classList.add('active');

            const target = btn.getAttribute('data-target');

            if (target === 'mototaxista') {
                mototaxistaFields.classList.remove('hidden');
                
                // Update Button
                submitBtnText.textContent = 'Registrarme y verificar mis datos';
                submitBtnIcon.className = 'fa-solid fa-user-check btn-icon';
                
                // Make fields required
                startPoint.required = true;
                plateNumber.required = true;
                license.required = true;

            } else {
                mototaxistaFields.classList.add('hidden');
                
                // Update Button
                submitBtnText.textContent = 'Crear mi cuenta';
                submitBtnIcon.className = 'fa-solid fa-user-plus btn-icon';
                
                // Remove required
                startPoint.required = false;
                plateNumber.required = false;
                license.required = false;
            }
        });
    });
});
