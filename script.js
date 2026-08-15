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

    // Password visibility toggle
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });

    // Toggle logic for Login / Register
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const registerSection = document.getElementById('register-section');
    const loginSection = document.getElementById('login-section');
    const formTitle = document.querySelector('.form-title');

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        formTitle.textContent = 'INICIAR SESIÓN';
    });

    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
        formTitle.textContent = 'REGÍSTRATE EN MOTOTAXI HUARMEY';
    });
});
