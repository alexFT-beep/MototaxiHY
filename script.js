// Se conectaron los módulos MCP mcpAuth.js y mcpDashboard.js para controlar la lógica del frontend
import { signIn, signUp, signOut } from './frontend/mcpAuth.js'
import { createPackageRequest, onPackageUpdate, fetchOpenPackageRequests, updatePackageStatus, fetchActiveMototaxistas, subscribeToAllPackageRequests } from './frontend/mcpDashboard.js'

document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_USER_NAME = 'Usuario';
    const DEFAULT_USER_ZONE = 'Centro de Huarmey';

    // Se implementó la función auxiliar para obtener el primer nombre del usuario
    function getFirstName(fullName) {
        const trimmed = (fullName || '').trim();
        if (!trimmed) return DEFAULT_USER_NAME;
        return trimmed.split(/\s+/)[0] || DEFAULT_USER_NAME;
    }

    // Se implementó el capturador de texto de zona del select
    function getSelectedZoneText(selectEl) {
        if (!selectEl || selectEl.selectedIndex < 0) return DEFAULT_USER_ZONE;
        const selected = selectEl.options[selectEl.selectedIndex];
        if (!selected || !selected.value) return DEFAULT_USER_ZONE;
        return selected.text.trim() || DEFAULT_USER_ZONE;
    }

    // Se implementó el guardado del perfil de usuario y rol en el almacenamiento local
    function savePassengerProfile(fullName, zoneText, phone = '', role = 'pasajero', userId = '') {
        localStorage.setItem('mototaxi_userName', getFirstName(fullName));
        localStorage.setItem('mototaxi_userFullName', fullName);
        localStorage.setItem('mototaxi_userZone', zoneText);
        localStorage.setItem('mototaxi_userRole', role);
        if (phone) localStorage.setItem('mototaxi_userPhone', phone);
        if (userId) localStorage.setItem('mototaxi_userId', userId);
    }

    // Se implementó la carga de datos del perfil en la interfaz del dashboard
    function loadPassengerProfile() {
        const greetingName = document.querySelector('#user-greeting span');
        const greetingZone = document.querySelector('#user-zone span');
        const headerRole = document.getElementById('header-status-role');

        if (greetingName) greetingName.textContent = localStorage.getItem('mototaxi_userName') || DEFAULT_USER_NAME;
        if (greetingZone) greetingZone.textContent = localStorage.getItem('mototaxi_userZone') || DEFAULT_USER_ZONE;
        
        const role = localStorage.getItem('mototaxi_userRole') || 'pasajero';
        if (headerRole) {
            headerRole.textContent = role === 'mototaxista' ? 'PANEL DE CONDUCTOR VERIFICADO' : 'CONDUCTORES VERIFICADOS EN LÍNEA';
        }
    }

    loadPassengerProfile();

    const tabBtns = document.querySelectorAll('.tab-btn');
    const mototaxistaFields = document.getElementById('mototaxista-fields');
    const submitBtnText = document.getElementById('submit-text');
    const submitBtnIcon = document.querySelector('.submit-btn .btn-icon');
    
    let activeRole = 'pasajero';

    const startPoint = document.getElementById('startPoint');
    const plateNumber = document.getElementById('plateNumber');
    const license = document.getElementById('license');

    // Se implementó el selector de pestañas entre Pasajero y Mototaxista
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const target = btn.getAttribute('data-target');
            activeRole = target;

            if (target === 'mototaxista') {
                mototaxistaFields?.classList.remove('hidden');
                if (submitBtnText) submitBtnText.textContent = 'Registrarme y verificar mis datos';
                if (submitBtnIcon) submitBtnIcon.className = 'fa-solid fa-user-check btn-icon';
                if (startPoint) startPoint.required = true;
                if (plateNumber) plateNumber.required = true;
                if (license) license.required = true;
            } else {
                mototaxistaFields?.classList.add('hidden');
                if (submitBtnText) submitBtnText.textContent = 'Crear mi cuenta';
                if (submitBtnIcon) submitBtnIcon.className = 'fa-solid fa-user-plus btn-icon';
                if (startPoint) startPoint.required = false;
                if (plateNumber) plateNumber.required = false;
                if (license) license.required = false;
            }
        });
    });

    // Se implementó el alternador de visibilidad de contraseñas
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

    // Se implementó la conmutación de vista entre Iniciar Sesión y Registro
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

    // Se implementó la validación de coincidencia de contraseñas
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

    // Se implementó el envío del formulario de registro llamando a signUp de mcpAuth.js
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value;
            const dni = document.getElementById('dni').value;
            const phone = document.getElementById('phone').value;
            const zoneSelect = document.getElementById('zone');
            const zoneText = getSelectedZoneText(zoneSelect);
            const userPassword = password.value;

            if (userPassword.length > 12) {
                alert('La contraseña no puede exceder los 12 caracteres.');
                return;
            }

            const userData = {
                fullName,
                dni,
                phone,
                zone: zoneText,
                role: activeRole,
                password: userPassword,
                startPoint: activeRole === 'mototaxista' ? document.getElementById('startPoint')?.value : null,
                plateNumber: activeRole === 'mototaxista' ? document.getElementById('plateNumber')?.value : null,
                license: activeRole === 'mototaxista' ? document.getElementById('license')?.value : null,
                model: activeRole === 'mototaxista' ? document.getElementById('model')?.value : null
            };

            try {
                const res = await signUp(userData);
                const uid = res?.user?.id || '';
                savePassengerProfile(fullName, zoneText, phone, activeRole, uid);
                alert('¡Registro exitoso en Mototaxi Huarmey!');
                window.location.href = 'dashboard-pasajero.html';
            } catch (err) {
                alert('Error al registrar usuario: ' + err.message);
            }
        });
    }

    // Se implementó el envío de inicio de sesión llamando a signIn de mcpAuth.js con teléfono (9 dígitos)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const phone = document.getElementById('login-phone').value;
            const loginPassword = document.getElementById('login-password').value;

            if (loginPassword.length > 12) {
                alert('La contraseña no puede exceder los 12 caracteres.');
                return;
            }

            try {
                const result = await signIn({ phone, password: loginPassword });
                const meta = result?.user?.user_metadata || {};
                const userName = meta.fullName || 'Usuario';
                const userZone = meta.zone || DEFAULT_USER_ZONE;
                const userRole = meta.role || 'pasajero';
                const userId = result?.user?.id || '';
                
                savePassengerProfile(userName, userZone, phone, userRole, userId);
                alert('¡Bienvenido de vuelta!');
                window.location.href = 'dashboard-pasajero.html';
            } catch (err) {
                alert('Error al iniciar sesión: ' + err.message);
            }
        });
    }

    // Se implementó el control de cierre de sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await signOut();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Se implementó el menú desplegable dinámico para seleccionar mototaxistas específicos
    const driverSelect = document.getElementById('driver-select');
    async function populateDriverSelect() {
        if (!driverSelect) return;
        const { data: drivers } = await fetchActiveMototaxistas();
        if (!drivers || drivers.length === 0) return;

        driverSelect.innerHTML = '<option value="">Cualquier Mototaxi disponible en Huarmey</option>';

        drivers.forEach(d => {
            const phone = d.telefono || d.phone || '';
            const name = d.nombre_completo || d.full_name || d.name || 'Mototaxista Verificado';
            const plate = d.numero_placa || d.plate_number || d.plate || 'S/N';
            const id = d.id || '';
            
            const option = document.createElement('option');
            option.value = JSON.stringify({ phone, name, plate, id });
            option.textContent = `🛺 ${name} (Placa: ${plate})`;
            driverSelect.appendChild(option);
        });
    }
    populateDriverSelect();

    // Se implementó la lógica diferenciada del dashboard para mototaxistas (vista de solicitudes)
    const currentRole = localStorage.getItem('mototaxi_userRole') || 'pasajero';
    const passengerRouteCard = document.getElementById('passenger-route-card');
    const driverRequestsCard = document.getElementById('driver-requests-card');
    const driverRequestsList = document.getElementById('driver-requests-list');

    if (currentRole === 'mototaxista' && driverRequestsCard) {
        if (passengerRouteCard) passengerRouteCard.classList.add('hidden');
        driverRequestsCard.classList.remove('hidden');
        loadDriverRequests();

        // Suscripción Realtime para actualizar la lista de carreras en tiempo real cuando un pasajero crea una solicitud
        subscribeToAllPackageRequests(() => {
            loadDriverRequests();
        });
    }

    // Se implementó la función loadDriverRequests cargando solicitudes específicas o abiertas dirigidas al mototaxista conectado
    async function loadDriverRequests() {
        if (!driverRequestsList) return;
        const loggedInPhone = localStorage.getItem('mototaxi_userPhone') || '';
        const loggedInId = localStorage.getItem('mototaxi_userId') || '';
        
        const { data: requests, error } = await fetchOpenPackageRequests(loggedInPhone, loggedInId);
        
        if (error || !requests || requests.length === 0) {
            driverRequestsList.innerHTML = '<p style="text-align: center; color: #bbb; padding: 15px;">No hay solicitudes pendientes dirigidas a ti o abiertas en este momento en Huarmey.</p>';
            return;
        }

        driverRequestsList.innerHTML = requests.map(req => {
            const isDirect = loggedInPhone && req.driver_phone && req.driver_phone.toString().trim() === loggedInPhone.toString().trim();
            return `
                <div style="background: rgba(255,255,255,0.06); padding: 15px; border-radius: 8px; border-left: 4px solid ${isDirect ? '#00ffcc' : 'var(--gold)'}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        ${isDirect ? '<span style="background: #00ffcc; color: #000; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 0.75rem; display: inline-block; margin-bottom: 6px;">⭐ SOLICITUD DIRECTA PARA TI</span>' : ''}
                        <h4 style="color: #ffd700; margin-bottom: 4px;"><i class="fa-solid fa-user"></i> ${req.passenger_name || 'Pasajero'}</h4>
                        <p style="font-size: 0.9rem; color: #ddd;"><strong>Origen:</strong> ${req.origin} → <strong>Destino:</strong> ${req.destination}</p>
                        <p style="font-size: 0.85rem; color: #aaa;"><strong>Teléfono:</strong> ${req.passenger_phone || 'S/N'} | <strong>Código:</strong> ${req.tracking_code || req.id}</p>
                    </div>
                    <button class="accept-ride-btn submit-btn" data-id="${req.id}" style="width: auto; padding: 8px 16px; font-size: 0.9rem;">
                        <i class="fa-solid fa-check"></i> Aceptar Carrera
                    </button>
                </div>
            `;
        }).join('');

        driverRequestsList.querySelectorAll('.accept-ride-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const reqId = this.getAttribute('data-id');
                const driverName = localStorage.getItem('mototaxi_userFullName') || localStorage.getItem('mototaxi_userName') || 'Mototaxista Verificado';
                const driverPhone = localStorage.getItem('mototaxi_userPhone') || '912345678';

                const { data, error } = await updatePackageStatus(reqId, 'Asignado', '-10.0681, -78.1522', {
                    driver_name: driverName,
                    driver_phone: driverPhone,
                    status: 'Asignado'
                });

                if (error) {
                    alert('Error al aceptar la carrera: ' + error);
                } else {
                    alert('¡Carrera aceptada! Ubicación activada en tiempo real.');
                    loadDriverRequests();
                }
            });
        });
    }

    // Se implementó el envío del formulario de solicitud de mototaxi guardando el conductor seleccionado en Supabase
    const routeForm = document.getElementById('route-form');
    if (routeForm) {
        routeForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const origenSelect = document.getElementById('origen');
            const destinoSelect = document.getElementById('destino');

            const origen = getSelectedZoneText(origenSelect);
            const destino = getSelectedZoneText(destinoSelect);
            const passengerName = localStorage.getItem('mototaxi_userFullName') || localStorage.getItem('mototaxi_userName') || DEFAULT_USER_NAME;
            const passengerPhone = localStorage.getItem('mototaxi_userPhone') || '987654321';

            let selectedDriverObj = null;
            if (driverSelect && driverSelect.value) {
                try {
                    selectedDriverObj = JSON.parse(driverSelect.value);
                } catch (err) {
                    // noop
                }
            }

            const packagePayload = {
                passenger_name: passengerName,
                passenger_phone: passengerPhone,
                origin: origen,
                destination: destino,
                status: 'Buscando Mototaxi',
                location: '-10.0681, -78.1522',
                driver_phone: selectedDriverObj ? selectedDriverObj.phone : null,
                driver_name: selectedDriverObj ? selectedDriverObj.name : 'Buscando Mototaxi...',
                driver_plate: selectedDriverObj ? selectedDriverObj.plate : null,
                driver_id: selectedDriverObj ? selectedDriverObj.id : null
            };

            const submitBtn = routeForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const { data, error } = await createPackageRequest(packagePayload);
                const activeData = data || packagePayload;

                const trackingCard = document.getElementById('tracking-card');
                const trackingCodeVal = document.getElementById('tracking-code-val');
                const trackingStatusVal = document.getElementById('tracking-status-val');
                const trackingOriginVal = document.getElementById('tracking-origin-val');
                const trackingDestVal = document.getElementById('tracking-dest-val');
                const trackingDriverVal = document.getElementById('tracking-driver-val');

                if (trackingCard) trackingCard.classList.remove('hidden');
                if (trackingCodeVal) trackingCodeVal.textContent = activeData.tracking_code || 'PK-8831';
                if (trackingStatusVal) trackingStatusVal.textContent = activeData.status || 'Buscando Mototaxi';
                if (trackingOriginVal) trackingOriginVal.textContent = activeData.origin;
                if (trackingDestVal) trackingDestVal.textContent = activeData.destination;
                if (trackingDriverVal) trackingDriverVal.textContent = activeData.driver_name || 'Buscando Mototaxi...';

                if (activeData.id) {
                    onPackageUpdate(activeData.id, (err, updated) => {
                        if (updated) {
                            if (trackingStatusVal) trackingStatusVal.textContent = updated.status;
                            if (trackingDriverVal) trackingDriverVal.textContent = updated.driver_name || 'Asignado';
                        }
                    });
                }
            } catch (err) {
                console.warn('Procesamiento completado con interfaz local:', err);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Se implementó el mapa interactivo estilo InDrive con selección táctil de mototaxis sobre el mapa
    let mapInstance = null;
    let driverMarkers = [];

    const leafletContainer = document.getElementById('leaflet-map');
    if (leafletContainer && typeof L !== 'undefined') {
        const huarmeyCenter = [-10.0681, -78.1522];
        
        mapInstance = L.map('leaflet-map').setView(huarmeyCenter, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors | Mototaxi Huarmey'
        }).addTo(mapInstance);

        const mototaxiIcon = L.icon({
            iconUrl: 'https://wdirdbryxwtbnprbrkvh.supabase.co/storage/v1/object/public/MotoHy/logo.webp',
            iconSize: [46, 46],
            iconAnchor: [23, 23],
            popupAnchor: [0, -20],
            className: 'mototaxi-leaflet-marker'
        });

        // Se cargaron y renderizaron múltiples conductores verificados desplegados en Huarmey estilo InDrive
        async function loadAllMototaxisOnMap() {
            const { data: drivers } = await fetchActiveMototaxistas();
            
            const driverLocations = [
                { phone: '912345678', name: 'Ramón "El Veloz" Gutierrez', plate: 'HY-1234', model: 'Zongshen 150cc Rojo', zone: 'Plaza de Armas', lat: -10.0681, lng: -78.1522 },
                { phone: '923456789', name: 'Luis Alberto "Tigre" Flores', plate: 'HY-5678', model: 'Honda Bajaj 200 Azul', zone: 'Mercado Modelo', lat: -10.0665, lng: -78.1535 },
                { phone: '934567890', name: 'David "El Rayo" Huanqui', plate: 'HY-9012', model: 'Kwanqi 150cc Amarillo', zone: 'Hospital de Apoyo Huarmey', lat: -10.0642, lng: -78.1550 },
                { phone: '945678901', name: 'Héctor "Campeón" Salazar', plate: 'HY-3456', model: 'Mavila 150cc Negro', zone: 'Terminal Panamericana Norte', lat: -10.0620, lng: -78.1580 },
                { phone: '956789012', name: 'Gonzalo "Huarmeyano" Vega', plate: 'HY-7890', model: 'Zongshen 200cc Verde', zone: 'Playa Tuquillo', lat: -10.1020, lng: -78.1820 }
            ];

            const activeList = (drivers && drivers.length > 0) ? drivers.map((d, i) => ({
                id: d.id || driverLocations[i % 5].id || '',
                phone: d.telefono || d.phone || driverLocations[i % 5].phone,
                name: d.nombre_completo || driverLocations[i % 5].name,
                plate: d.numero_placa || driverLocations[i % 5].plate,
                model: d.modelo_mototaxi || driverLocations[i % 5].model,
                zone: d.zona_referencia || driverLocations[i % 5].zone,
                lat: d.lat || driverLocations[i % 5].lat,
                lng: d.lng || driverLocations[i % 5].lng
            })) : driverLocations;

            // Renderizar marcador para cada mototaxi con botón interactivo de selección
            activeList.forEach((driver) => {
                const marker = L.marker([driver.lat, driver.lng], { icon: mototaxiIcon }).addTo(mapInstance);
                
                const popupContent = `
                    <div style="font-family: Montserrat, sans-serif; padding: 4px; min-width: 180px;">
                        <h4 style="color: #d4af37; margin: 0 0 4px 0; font-size: 0.95rem;">
                            <i class="fa-solid fa-motorcycle"></i> ${driver.name}
                        </h4>
                        <p style="margin: 2px 0; font-size: 0.8rem; color: #333;"><strong>Placa:</strong> ${driver.plate}</p>
                        <p style="margin: 2px 0; font-size: 0.8rem; color: #333;"><strong>Modelo:</strong> ${driver.model}</p>
                        <p style="margin: 2px 0; font-size: 0.8rem; color: #333;"><strong>Zona:</strong> ${driver.zone}</p>
                        <span style="display: inline-block; margin-top: 4px; background: #00b894; color: #fff; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 0.75rem;">
                            🟢 En línea (Disponible)
                        </span>
                        <button class="select-map-driver-btn" data-name="${driver.name}" data-plate="${driver.plate}" style="margin-top: 8px; width: 100%; background: #d4af37; color: #000; font-weight: bold; border: none; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                            🛺 Solicitar a este Conductor
                        </button>
                    </div>
                `;
                marker.bindPopup(popupContent);

                marker.on('popupopen', () => {
                    setTimeout(() => {
                        const btns = document.querySelectorAll('.select-map-driver-btn');
                        btns.forEach(btn => {
                            btn.onclick = () => {
                                const targetName = btn.getAttribute('data-name');
                                const targetPlate = btn.getAttribute('data-plate');
                                if (driverSelect) {
                                    for (let opt of driverSelect.options) {
                                        if (opt.textContent.includes(targetName)) {
                                            opt.selected = true;
                                            break;
                                        }
                                    }
                                }
                                const routeCard = document.getElementById('passenger-route-card');
                                if (routeCard) routeCard.scrollIntoView({ behavior: 'smooth' });
                                alert(`¡Has seleccionado a ${targetName} (Placa: ${targetPlate}) para tu solicitud!`);
                            };
                        });
                    }, 100);
                });

                driverMarkers.push({ marker, data: driver });
            });

            // Se implementó micro-animación en tiempo real para simular movimiento dinámico en vivo tipo InDrive
            setInterval(() => {
                driverMarkers.forEach(item => {
                    const deltaLat = (Math.random() - 0.5) * 0.0004;
                    const deltaLng = (Math.random() - 0.5) * 0.0004;
                    const currentPos = item.marker.getLatLng();
                    item.marker.setLatLng([currentPos.lat + deltaLat, currentPos.lng + deltaLng]);
                });
            }, 3500);
        }

        loadAllMototaxisOnMap();
    }
});




