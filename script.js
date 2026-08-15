document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_USER_NAME = 'Usuario';
    const DEFAULT_USER_ZONE = 'Centro de Huarmey';

    function getFirstName(fullName) {
        const trimmed = (fullName || '').trim();
        if (!trimmed) return DEFAULT_USER_NAME;
        const firstName = trimmed.split(/\s+/)[0];
        return firstName || DEFAULT_USER_NAME;
    }

    function getSelectedZoneText(selectEl) {
        if (!selectEl || selectEl.selectedIndex < 0) return DEFAULT_USER_ZONE;
        const selected = selectEl.options[selectEl.selectedIndex];
        if (!selected || !selected.value) return DEFAULT_USER_ZONE;
        return selected.text.trim() || DEFAULT_USER_ZONE;
    }

    function savePassengerProfile(fullName, zoneSelect) {
        localStorage.setItem('mototaxi_userName', getFirstName(fullName));
        localStorage.setItem('mototaxi_userZone', getSelectedZoneText(zoneSelect));
    }

    function loadPassengerProfile() {
        const greetingName = document.querySelector('#user-greeting span');
        const greetingZone = document.querySelector('#user-zone span');

        if (!greetingName || !greetingZone) return;

        greetingName.textContent = localStorage.getItem('mototaxi_userName') || DEFAULT_USER_NAME;
        greetingZone.textContent = localStorage.getItem('mototaxi_userZone') || DEFAULT_USER_ZONE;
    }

    loadPassengerProfile();

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

    if (showLoginBtn && showRegisterBtn && registerSection && loginSection && formTitle) {
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
    }

    // Password match validation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (password && confirmPassword) {
        function validatePassword() {
            if (password.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity("Las contraseñas no coinciden");
            } else {
                confirmPassword.setCustomValidity('');
            }
        }

        password.addEventListener('change', validatePassword);
        confirmPassword.addEventListener('keyup', validatePassword);
    }

    // Redirect to Dashboard on Form Submit and Save Data
    const registrationForm = document.getElementById('registration-form');
    if(registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value;
            const zoneSelect = document.getElementById('zone');

            savePassengerProfile(fullName, zoneSelect);
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

    const lazyMap = document.querySelector('.map-container iframe[data-src]');
    if (lazyMap) {
        const loadMap = () => {
            if (!lazyMap.dataset.src) return;
            lazyMap.src = lazyMap.dataset.src;
            lazyMap.removeAttribute('data-src');
        };

        if ('IntersectionObserver' in window) {
            const mapObserver = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    loadMap();
                    mapObserver.disconnect();
                }
            }, { rootMargin: '300px' });
            mapObserver.observe(lazyMap);
        } else {
            loadMap();
        }
    }
});
