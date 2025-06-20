document.addEventListener('DOMContentLoaded', () => {

    // --- Pemanggilan Elemen Utama ---
    const openButton = document.getElementById('open-invitation');
    const landingPage = document.getElementById('landing');
    const mainContent = document.getElementById('main-content');
    const music = document.getElementById('bg-music');
    const musicToggleBtn = document.getElementById('music-toggle-btn');
    const errorContainer = document.getElementById('error-container');
    const rsvpForm = document.querySelector('.wishes-form');
    const commentList = document.getElementById('comment-list');
    
    let currentInvitationId = null;

    // --- Logika Tombol Buka Undangan & Musik ---
    if (openButton && landingPage && mainContent) {
        openButton.addEventListener('click', () => {
            landingPage.classList.add('hidden');
            mainContent.style.display = 'block';
            if (musicToggleBtn) musicToggleBtn.classList.add('visible');
            if (music) {
                music.play().catch(e => console.warn("Autoplay dicegah oleh browser."));
            }
            window.scrollTo(0, 0);
            startAnimations();
        });
    }

    if (musicToggleBtn && music) {
        const musicIcon = musicToggleBtn.querySelector('i');
        musicToggleBtn.addEventListener('click', () => {
            if (music.paused) {
                music.play();
                musicIcon.classList.remove('fa-volume-xmark');
                musicIcon.classList.add('fa-volume-high');
            } else {
                music.pause();
                musicIcon.classList.remove('fa-volume-high');
                musicIcon.classList.add('fa-volume-xmark');
            }
        });
    }

    // --- Fungsi Utama: Pengambilan & Pengisian Data ---
    const loadInvitationData = () => {
        const urlParams = new URLSearchParams(window.location.search);
        currentInvitationId = urlParams.get('id');

        if (!currentInvitationId) {
            displayError('<h1>Error: ID Undangan tidak ditemukan di URL.</h1><p>Contoh: undangan.html?id=1</p>');
            return;
        }

        const API_URL = `http://localhost/proyek_undangan/api/get_invitation_by_id.php?id=${currentInvitationId}`;

        fetch(API_URL)
            .then(handleFetchResponse)
            .then(invitation => {
                fillPageWithData(invitation);
                loadRsvps(currentInvitationId);
            })
            .catch(error => {
                console.error('Terjadi kesalahan final:', error);
                displayError(`<h1>Oops! Terjadi Kesalahan</h1><p>${error.message}</p>`);
            });
    };
    
    // Panggil fungsi utama untuk memuat data
    loadInvitationData();

    // --- Logika RSVP ---
    const loadRsvps = async (invitationId) => {
        if (!commentList) return;
        const API_URL = `http://localhost/proyek_undangan/api/get_rsvps.php?id=${invitationId}`;
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Gagal memuat daftar ucapan.');
            const rsvps = await response.json();
            
            commentList.innerHTML = '<p style="font-weight:bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Ucapan & Doa</p>';
            
            if (rsvps.length > 0) {
                rsvps.forEach(rsvp => {
                    const newComment = document.createElement('div');
                    newComment.className = 'comment';
                    const attendanceClass = rsvp.attendance_status.toLowerCase().replace(/\s/g, '-');
                    newComment.innerHTML = `
                        <strong>${escapeHtml(rsvp.guest_name)} <span class="attendance-status ${attendanceClass}">${escapeHtml(rsvp.attendance_status)}</span></strong>
                        <p>${escapeHtml(rsvp.message)}</p>
                        <span class="comment-time">${new Date(rsvp.created_at).toLocaleString('id-ID')}</span>
                    `;
                    commentList.appendChild(newComment);
                });
            } else {
                commentList.innerHTML += '<p>Jadilah yang pertama memberikan ucapan.</p>';
            }
        } catch (error) {
            console.error("Gagal memuat RSVP:", error);
            commentList.innerHTML += '<p>Gagal memuat daftar ucapan.</p>';
        }
    };
    
    const handleRsvpSubmit = async (event) => {
        event.preventDefault();
        const guestNameInput = document.getElementById('guest-name');
        const messageInput = document.getElementById('guest-wish');
        const attendanceInput = document.getElementById('attendance');
        const rsvpMessageEl = document.getElementById('rsvp-message');
        const submitButton = event.target.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        rsvpMessageEl.textContent = 'Mengirim...';
        rsvpMessageEl.style.color = 'blue';

        const rsvpData = { invitation_id: currentInvitationId, guest_name: guestNameInput.value, message: messageInput.value, attendance_status: attendanceInput.value };
        const API_URL = 'http://localhost/proyek_undangan/api/save_rsvp.php';
        
        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rsvpData) });
            const result = await response.json();
            if (response.ok && result.status === 'success') {
                rsvpMessageEl.textContent = result.message;
                rsvpMessageEl.style.color = 'green';
                event.target.reset();
                loadRsvps(currentInvitationId);
            } else {
                throw new Error(result.message || 'Terjadi kesalahan saat mengirim.');
            }
        } catch (error) {
            rsvpMessageEl.textContent = `Error: ${error.message}`;
            rsvpMessageEl.style.color = 'red';
        } finally {
            submitButton.disabled = false;
        }
    };

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', handleRsvpSubmit);
    }

    // --- Fungsi-Fungsi Pembantu Lainnya ---
    function handleFetchResponse(response) { 
        if (!response.ok) { 
            return response.json().then(errData => { throw new Error(errData.message || 'Data undangan tidak ditemukan.'); }); 
        } 
        return response.json(); 
    }
    
    function fillPageWithData(invitation) {
         document.title = invitation.title;
         setTextContent('landing-title', invitation.title);
         setTextContent('closing-names', `${invitation.couple_data.bride.nick} & ${invitation.couple_data.groom.nick}`);
         setTextContent('bride-nick', invitation.couple_data.bride.nick);
         setTextContent('bride-name', invitation.couple_data.bride.name);
         setTextContent('bride-father', invitation.couple_data.bride.father);
         setTextContent('bride-mother', invitation.couple_data.bride.mother);
         setTextContent('groom-nick', invitation.couple_data.groom.nick);
         setTextContent('groom-name', invitation.couple_data.groom.name);
         setTextContent('groom-father', invitation.couple_data.groom.father);
         setTextContent('groom-mother', invitation.couple_data.groom.mother);
         setTextContent('story-content', invitation.story);
         
         const eventContainer = document.getElementById('event-container'); 
         if (eventContainer && invitation.event_data) { 
            eventContainer.innerHTML = ''; 
            invitation.event_data.forEach((event, index) => { 
                const eventCard = document.createElement('div'); 
                eventCard.className = 'event-card animate-me zoom-in card-hover'; 
                eventCard.style.transitionDelay = `${300 + (index * 150)}ms`; 
                eventCard.innerHTML = ` <h3 class="script-font" style="font-size: 2.5rem;">${escapeHtml(event.type)}</h3> <p style="font-size: 1.2rem; font-weight: bold; margin-top: 10px;">${new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</p> <p style="margin-top: 5px;">${escapeHtml(event.time)} WIB s.d. Selesai</p> <p style="margin-top: 15px;"><strong>Bertempat di:</strong><br>${escapeHtml(event.venue)}</p> <a href="${escapeHtml(event.mapLink)}" target="_blank" class="map-button"><i class="fa-solid fa-map-location-dot"></i> Google Map</a> `; 
                eventContainer.appendChild(eventCard); 
            }); 
         }
         
         const giftContainer = document.getElementById('gift-container'); 
         if (giftContainer && invitation.gift_data) { 
            giftContainer.innerHTML = ''; 
            invitation.gift_data.forEach((gift, index) => { 
                const giftCard = document.createElement('div'); 
                giftCard.className = 'gift-card animate-me zoom-in card-hover'; 
                giftCard.style.transitionDelay = `${200 + (index * 100)}ms`; 
                giftCard.innerHTML = `<p><b>${escapeHtml(gift.bank)}</b></p><p>${escapeHtml(gift.number)}</p><p>a.n ${escapeHtml(gift.name)}</p><button class="copy-button" onclick="copyToClipboard('${escapeHtml(gift.number)}', this)"><i class="fa-regular fa-copy"></i> Copy</button>`; 
                giftContainer.appendChild(giftCard); 
            }); 
         }

         if (invitation.event_data && invitation.event_data.length > 0) { 
             const mainEventDate = invitation.event_data[0].date; 
             const targetDate = new Date(`${mainEventDate}T00:00:00`).getTime(); 
             startCountdown(targetDate); 
         }
    }

    function setTextContent(id, text) { const element = document.getElementById(id); if (element) { element.textContent = text || ''; } }
    function displayError(message) { if(errorContainer) { errorContainer.style.display = 'block'; errorContainer.innerHTML = message; } if (landingPage) landingPage.style.display = 'none'; if (mainContent) mainContent.style.display = 'none'; }
    function startCountdown(targetDate) { const countdownElement = document.getElementById('countdown'); if(!countdownElement) return; const timer = setInterval(() => { const now = new Date().getTime(); const distance = targetDate - now; if (distance < 0) { countdownElement.innerHTML = "<h3>Acara Telah Berlangsung</h3>"; clearInterval(timer); return; } const days = Math.floor(distance / (1000 * 60 * 60 * 24)); const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)); const seconds = Math.floor((distance % (1000 * 60)) / 1000); countdownElement.innerHTML = `<div><span>${days}</span><span>Hari</span></div><div><span>${hours}</span><span>Jam</span></div><div><span>${minutes}</span><span>Menit</span></div><div><span>${seconds}</span><span>Detik</span></div>`; }, 1000); }
    function startAnimations() { const animatedElements = document.querySelectorAll('.animate-me'); const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); animatedElements.forEach(el => observer.observe(el)); }
    function escapeHtml(text) { const div = document.createElement('div'); div.innerText = text; return div.innerHTML; }
});

// --- Fungsi Global ---
function showImage(src) { const lightbox = document.getElementById('lightbox'); const lightboxImg = lightbox.querySelector('img'); if (lightbox && lightboxImg) { lightboxImg.src = src; lightbox.classList.add('active'); } }
function copyToClipboard(text, buttonElement) { if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => { const copyTextEl = buttonElement.querySelector('.copy-text'); if (copyTextEl) { const originalText = copyTextEl.textContent; copyTextEl.textContent = 'Tersalin!'; setTimeout(() => { copyTextEl.textContent = originalText; }, 2000); } else { buttonElement.textContent = 'Tersalin!'; setTimeout(() => { buttonElement.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000); } }).catch(err => console.error('Gagal menyalin: ', err)); } }
