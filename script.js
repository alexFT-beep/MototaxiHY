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

    // Password match validation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    function validatePassword() {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity("Las contraseñas no coinciden");
        } else {
            confirmPassword.setCustomValidity('');
        }
    }

    password.addEventListener('change', validatePassword);
    confirmPassword.addEventListener('keyup', validatePassword);

    // Redirect to Dashboard on Form Submit and Save Data
    const registrationForm = document.getElementById('registration-form');
    if(registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get user data
            const fullName = document.getElementById('fullName').value.trim();
            const zoneSelect = document.getElementById('zone');
            
            // Validate that we have data
            if (fullName && zoneSelect.selectedIndex > 0) {
                const zoneText = zoneSelect.options[zoneSelect.selectedIndex].text;
                const firstName = fullName.split(' ')[0]; // Get the first name
                
                // Save to local storage
                localStorage.setItem('mototaxi_userName', firstName);
                localStorage.setItem('mototaxi_userZone', zoneText);
            }
            
            window.location.href = 'dashboard-pasajero.html';
        });
    }

    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Optional: simulate login logic here if needed
            window.location.href = 'dashboard-pasajero.html';
        });
    }
    
    // Dashboard data population
    const greetingName = document.querySelector('#user-greeting span');
    const greetingZone = document.querySelector('#user-zone span');
    
    if (greetingName && greetingZone) {
        const storedName = localStorage.getItem('mototaxi_userName');
        const storedZone = localStorage.getItem('mototaxi_userZone');
        
        if (storedName) {
            greetingName.textContent = storedName;
        }
        if (storedZone) {
            greetingZone.textContent = storedZone;
        }
    }
});
