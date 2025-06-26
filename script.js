document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // === "PABRIK BALOK LEGO" (COMPONENT FACTORY) ===
    // ==========================================================
    const componentFactory = {
        mempelai: (data) => `
            <section class="intro-section animate-me">
                <h2 class="script-font">The Happy Couple</h2>
                <p class="quote">Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:</p>
                <div class="profile-container">
                    <div class="profile-card">
                        <div class="profile-image"><img id="groom-photo" src="${data.couple_data?.groom?.photo || 'https://placehold.co/400x560/a29bfe/ffffff?text=Pria'}" alt="Foto Mempelai Pria"></div>
                        <h3 class="profile-name">${data.couple_data?.groom?.nick || ''}</h3>
                        <p class="profile-fullname">${data.couple_data?.groom?.name || ''}</p>
                        <p class="profile-parents">Putra dari Bapak <span>${data.couple_data?.groom?.father || ''}</span> & Ibu <span>${data.couple_data?.groom?.mother || ''}</span></p>
                    </div>
                    <div class="profile-card">
                        <div class="profile-image"><img id="bride-photo" src="${data.couple_data?.bride?.photo || 'https://placehold.co/400x560/a29bfe/ffffff?text=Wanita'}" alt="Foto Mempelai Wanita"></div>
                        <h3 class="profile-name">${data.couple_data?.bride?.nick || ''}</h3>
                        <p class="profile-fullname">${data.couple_data?.bride?.name || ''}</p>
                        <p class="profile-parents">Putri dari Bapak <span>${data.couple_data?.bride?.father || ''}</span> & Ibu <span>${data.couple_data?.bride?.mother || ''}</span></p>
                    </div>
                </div>
            </section>
        `,
        acara: () => `
            <section class="event-section animate-me">
                <h2 class="script-font">Save The Date</h2>
                <div id="countdown" class="countdown"></div>
                <div id="event-container" class="event-container"></div>
            </section>
        `,
        cerita: (data) => {
            if (!data.story) return '';
            return `<section class="story-section animate-me"><h2 class="script-font">Our Love Story</h2><p class="story-text">${escapeHtml(data.story)}</p></section>`;
        },
        galeri: () => `
            <section class="gallery-section animate-me"><h2 class="script-font">Our Gallery</h2><div id="gallery-container" class="gallery"></div></section>
        `,
        hadiah: () => `
            <section class="gift-rsvp-section animate-me">
                <h2 class="script-font">Love Gift</h2>
                <p class="quote">Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih, Anda dapat memberi kado secara cashless.</p>
                <div id="gift-container" class="gift-container"></div>
            </section>
        `,
        rsvp: () => `
            <section class="gift-rsvp-section animate-me">
                 <div class="wishes-box">
                    <h3 class="script-font">Ucapan Selamat & Do'a</h3>
                    <form class="wishes-form">
                        <input type="text" id="guest-name" placeholder="Nama Anda" required>
                        <textarea id="guest-wish" rows="4" placeholder="Tulis ucapan dan doa Anda..." required></textarea>
                        <select id="attendance"><option value="Hadir">Konfirmasi: Hadir</option><option value="Tidak Hadir">Konfirmasi: Tidak Hadir</option></select>
                        <button type="submit">KIRIM</button>
                        <p id="rsvp-message"></p>
                    </form>
                    <div id="comment-list" class="comment-list"></div>
                </div>
            </section>
        `,
        penutup: (data) => `
            <footer class="closing animate-me">
                <p>Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.</p>
                <h3 class="script-font">Terima Kasih</h3>
                <h2 class="closing-names">${data.couple_data?.bride?.nick || ''} & ${data.couple_data?.groom?.nick || ''}</h2>
            </footer>
        `,
    };

    // ==========================================================
    // === "ARSITEK" & MESIN UTAMA ===
    // ==========================================================
    let currentInvitationId = null;

    async function loadInvitationData() {
        const urlParams = new URLSearchParams(window.location.search);
        currentInvitationId = urlParams.get('id');
        if (!currentInvitationId) { displayError('<h1>Error: ID Undangan tidak ditemukan.</h1><p>Pastikan URL Anda valid.</p>'); return; }
        try {
            const API_URL = `http://localhost/proyek_undangan/api/get_invitation_by_id.php?id=${currentInvitationId}`;
            const invitation = await handleFetchResponse(await fetch(API_URL));
            buildPage(invitation);
        } catch (error) { console.error('Gagal memuat data:', error); displayError(`<h1>Oops! Gagal Memuat Undangan</h1><p>${error.message}</p>`); }
    }

    function buildPage(invitation) {
        loadTemplateCss(invitation.template_id || 'classic');
        document.title = invitation.title || 'Undangan Pernikahan';
        const guestName = new URLSearchParams(window.location.search).get('to');
        setTextContent('landing-title', invitation.title);
        setTextContent('guest-name-to', guestName ? guestName.replace(/\+/g, ' ') : 'Tamu Undangan');
        setupCover(invitation.cover_image);
        const layout = invitation.layout_data && invitation.layout_data.length > 0 ? invitation.layout_data : ['mempelai', 'acara', 'cerita', 'galeri', 'hadiah', 'rsvp', 'penutup'];
        const mainContainer = document.getElementById('main-content-lego');
        if (!mainContainer) { console.error("Error: #main-content-lego tidak ditemukan!"); return; }
        mainContainer.innerHTML = '';
        layout.forEach(componentName => { if (componentFactory[componentName]) mainContainer.innerHTML += componentFactory[componentName](invitation); });
        fillComponentDetails(invitation);
        setupEventListeners(invitation);
    }
    
    function setupEventListeners(invitation) {
        const openButton = document.getElementById('open-invitation');
        if (openButton) {
            openButton.addEventListener('click', () => openInvitation(invitation));
        }

        const rsvpForm = document.querySelector('.wishes-form');
        if (rsvpForm) {
            rsvpForm.addEventListener('submit', (e) => handleRsvpSubmit(e, currentInvitationId));
        }

        const musicToggleBtn = document.getElementById('music-toggle-btn');
        if (musicToggleBtn) {
            const music = document.getElementById('bg-music');
            if (music && invitation.music_url) {
                music.src = invitation.music_url;
                setupMusicControls(music, musicToggleBtn);
            }
        }
    }
    
    function openInvitation(invitation) {
        const landingPage = document.getElementById('landing');
        const mainContent = document.getElementById('main-content-lego');
        const music = document.getElementById('bg-music');
        const musicToggleBtn = document.getElementById('music-toggle-btn');
        
        if (landingPage) landingPage.classList.add('hidden');
        if (mainContent) mainContent.style.display = 'block';
        if (musicToggleBtn) musicToggleBtn.classList.add('visible');
        
        if (music && music.src) {
            music.volume = 0.3; 
            music.play().catch(e => {
                console.warn("Autoplay musik dicegah oleh browser.");
            });
        }
        
        window.scrollTo(0, 0);
        startAnimations();
    }

    function setupMusicControls(music, button) {
        const musicIcon = button.querySelector('i');
        
        button.addEventListener('click', () => {
            if (music.paused) {
                music.play();
            } else {
                music.pause();
            }
        });

        music.addEventListener('play', () => {
            button.classList.add('playing');
            musicIcon.classList.remove('fa-volume-xmark');
            musicIcon.classList.add('fa-volume-high');
        });
        
        music.addEventListener('pause', () => {
            button.classList.remove('playing');
            musicIcon.classList.remove('fa-volume-high');
            musicIcon.classList.add('fa-volume-xmark');
        });
    }

    function fillComponentDetails(invitation) {
        fillEvents(invitation.event_data);
        fillGallery(invitation.gallery_data);
        fillGifts(invitation.gift_data);
        loadRsvps(currentInvitationId);
        startCountdown(invitation.event_data?.[0]?.date);
    }
    
    // --- FUNGSI HELPER YANG LENGKAP ---
    function loadTemplateCss(templateId) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = `templates/${templateId}.css`; document.head.appendChild(link); }
    function setupCover(coverImages = []) { const slideshowContainer = document.getElementById('cover-slideshow-container'); if (!slideshowContainer) return; if (Array.isArray(coverImages) && coverImages.length > 0) { slideshowContainer.innerHTML = ''; if (coverImages.length === 1) { slideshowContainer.style.backgroundImage = `url('${coverImages[0]}')`; } else { slideshowContainer.style.backgroundImage = 'none'; coverImages.forEach((url, index) => { const slide = document.createElement('div'); slide.className = 'cover-slide'; slide.style.backgroundImage = `url('${url}')`; if (index === 0) slide.classList.add('active'); slideshowContainer.appendChild(slide); }); let currentSlide = 0; setInterval(() => { const slides = slideshowContainer.querySelectorAll('.cover-slide'); if (slides.length > 1) { slides[currentSlide].classList.remove('active'); currentSlide = (currentSlide + 1) % slides.length; slides[currentSlide].classList.add('active'); } }, 5000); } } }
    function fillEvents(eventData = []) { const eventContainer = document.getElementById('event-container'); if (eventContainer && Array.isArray(eventData) && eventData.length > 0) { eventContainer.innerHTML = ''; eventData.forEach((event) => { const eventCard = document.createElement('div'); eventCard.className = 'event-card'; const eventDate = new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); eventCard.innerHTML = `<h3 class="script-font">${escapeHtml(event.type)}</h3><p style="font-weight:bold;">${eventDate.toUpperCase()}</p><p>Pukul ${escapeHtml(event.time)} WIB</p><p style="margin-top:10px;">${escapeHtml(event.venue)}</p><a href="${escapeHtml(event.mapLink)}" target="_blank" class="map-button"><i class="fa-solid fa-map-location-dot"></i> Lihat Peta</a>`; eventContainer.appendChild(eventCard); }); } }
    function fillGallery(galleryData = []) { const galleryContainer = document.getElementById('gallery-container'); if (!galleryContainer) return; galleryContainer.innerHTML = ''; if (Array.isArray(galleryData) && galleryData.length > 0) { galleryData.forEach((url) => { if (!url) return; const isVideo = ['.mp4', '.webm', '.ogg'].some(ext => url.toLowerCase().endsWith(ext)); const mediaWrapper = document.createElement('div'); mediaWrapper.className = 'media-item'; if (isVideo) { const videoElement = document.createElement('video'); videoElement.src = url; videoElement.controls = true; videoElement.classList.add('animate-me'); mediaWrapper.appendChild(videoElement); } else { const imgElement = document.createElement('img'); imgElement.dataset.src = url; imgElement.src = "https://placehold.co/10x10/f0f0f0/f0f0f0.png"; imgElement.alt = `Media Galeri`; imgElement.classList.add('lazy-load', 'animate-me'); imgElement.setAttribute('onclick', `showImage('${url}')`); mediaWrapper.appendChild(imgElement); } galleryContainer.appendChild(mediaWrapper); }); } else { galleryContainer.innerHTML = '<p>Galeri akan segera hadir.</p>'; } }
    function fillGifts(giftData = []) { const giftContainer = document.getElementById('gift-container'); if (giftContainer && Array.isArray(giftData) && giftData.length > 0) { giftContainer.innerHTML = ''; giftData.forEach((gift) => { const giftCard = document.createElement('div'); giftCard.className = 'gift-card'; giftCard.innerHTML = `<p><b>${escapeHtml(gift.bank)}</b></p><p>${escapeHtml(gift.number)}</p><p>a.n ${escapeHtml(gift.name)}</p><button class="copy-button" onclick="copyToClipboard('${escapeHtml(gift.number)}', this)">Salin</button>`; giftContainer.appendChild(giftCard); }); } }
    async function loadRsvps(invitationId) { const commentList = document.getElementById('comment-list'); if (!commentList) return; const API_URL = `http://localhost/proyek_undangan/api/get_rsvps.php?id=${invitationId}`; try { const response = await fetch(API_URL); if (!response.ok) throw new Error('Gagal memuat ucapan.'); const rsvps = await response.json(); commentList.innerHTML = '<p style="font-weight:bold;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px;">Ucapan & Doa</p>'; if (rsvps.length > 0) { rsvps.forEach(rsvp => { const newComment = document.createElement('div'); newComment.className = 'comment'; const attendanceClass = rsvp.attendance_status.toLowerCase().replace(/\s/g, '-'); newComment.innerHTML = `<strong>${escapeHtml(rsvp.guest_name)} <span class="attendance-status ${attendanceClass}">${escapeHtml(rsvp.attendance_status)}</span></strong><p>${escapeHtml(rsvp.message)}</p><span class="comment-time">${new Date(rsvp.created_at).toLocaleString('id-ID',{dateStyle:'long',timeStyle:'short'})}</span>`; commentList.appendChild(newComment); }); } else { commentList.innerHTML += '<p>Jadilah yang pertama memberikan ucapan.</p>'; } } catch (error) { console.error("Gagal memuat RSVP:", error); if(commentList) commentList.innerHTML += '<p>Gagal memuat ucapan.</p>'; } }
    async function handleRsvpSubmit(event, invitationId) { event.preventDefault(); const rsvpMessageEl = document.getElementById('rsvp-message'); if (!invitationId) { if (rsvpMessageEl) { rsvpMessageEl.textContent = 'Error: ID Undangan tidak ditemukan.'; rsvpMessageEl.style.color = 'red'; } return; } const guestNameInput = document.getElementById('guest-name'); const messageInput = document.getElementById('guest-wish'); const attendanceInput = document.getElementById('attendance'); const submitButton = event.target.querySelector('button[type="submit"]'); submitButton.disabled = true; rsvpMessageEl.textContent = 'Mengirim...'; rsvpMessageEl.style.color = 'blue'; const rsvpData = { invitation_id: invitationId, guest_name: guestNameInput.value, message: messageInput.value, attendance_status: attendanceInput.value }; const API_URL = 'http://localhost/proyek_undangan/api/save_rsvp.php'; try { const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rsvpData) }); const result = await response.json(); if (response.ok && result.status === 'success') { rsvpMessageEl.textContent = result.message; rsvpMessageEl.style.color = 'green'; event.target.reset(); loadRsvps(invitationId); } else { throw new Error(result.message || 'Gagal mengirim.'); } } catch (error) { rsvpMessageEl.textContent = `Error: ${error.message}`; rsvpMessageEl.style.color = 'red'; } finally { submitButton.disabled = false; } }
    function handleFetchResponse(response) { if (!response.ok) { return response.json().then(err => { throw new Error(err.message || 'Error Server'); }); } return response.json(); }
    function setTextContent(id, text) { const element = document.getElementById(id); if (element) { element.textContent = text || ''; } }
    function displayError(message) { const errorContainer = document.getElementById('error-container'); if(errorContainer) { errorContainer.style.display = 'block'; errorContainer.innerHTML = message; } const landingPage = document.getElementById('landing'); if (landingPage) landingPage.style.display = 'none'; const mainContent = document.getElementById('main-content-lego'); if (mainContent) mainContent.style.display = 'none'; }
    function startCountdown(targetDate) { const countdownElement = document.getElementById('countdown'); if(!targetDate || !countdownElement) return; const timer = setInterval(() => { const now = new Date().getTime(); const distance = new Date(targetDate).getTime() - now; if (distance < 0) { countdownElement.innerHTML = "<h3>Acara Telah Berlangsung</h3>"; clearInterval(timer); return; } const days = Math.floor(distance / (1000*60*60*24)); const hours = Math.floor((distance % (1000*60*60*24)) / (1000*60*60)); const minutes = Math.floor((distance % (1000*60*60)) / (1000*60)); const seconds = Math.floor((distance % (1000*60)) / 1000); countdownElement.innerHTML = `<div><span>${days}</span><span>Hari</span></div><div><span>${hours}</span><span>Jam</span></div><div><span>${minutes}</span><span>Menit</span></div><div><span>${seconds}</span><span>Detik</span></div>`; }, 1000); }
    function startAnimations() { const animatedElements = document.querySelectorAll('.animate-me'); const animationObserver = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); animatedElements.forEach(el => animationObserver.observe(el)); setupLazyLoading(); }
    function setupLazyLoading() { const lazyImages = document.querySelectorAll('img.lazy-load'); if (!lazyImages.length) return; const lazyLoadObserver = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { const img = entry.target; img.src = img.dataset.src; img.classList.remove('lazy-load'); observer.unobserve(img); } }); }, { rootMargin: "0px 0px 200px 0px" }); lazyImages.forEach(img => lazyLoadObserver.observe(img)); }
    function escapeHtml(text = '') { const div = document.createElement('div'); div.innerText = text; return div.innerHTML; }
    
    loadInvitationData();
});

function showImage(src) { const lightbox = document.getElementById('lightbox'); const lightboxImg = lightbox.querySelector('img'); if (lightbox && lightboxImg) { lightboxImg.src = src; lightbox.classList.add('active'); } }
function copyToClipboard(text, buttonElement) { if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => { const originalHTML = buttonElement.innerHTML; buttonElement.innerHTML = 'Tersalin!'; buttonElement.style.backgroundColor = '#28a745'; setTimeout(() => { buttonElement.innerHTML = originalHTML; buttonElement.style.backgroundColor = ''; }, 2000); }).catch(err => { console.error('Gagal menyalin: ', err); fallbackCopyToClipboard(text, buttonElement); }); } else { fallbackCopyToClipboard(text, buttonElement); } }
function fallbackCopyToClipboard(text, buttonElement) { const textArea = document.createElement('textarea'); textArea.value = text; textArea.style.position = 'fixed'; textArea.style.top = '-9999px'; textArea.style.left = '-9999px'; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { document.execCommand('copy'); const originalHTML = buttonElement.innerHTML; buttonElement.innerHTML = 'Tersalin!'; buttonElement.style.backgroundColor = '#28a745'; setTimeout(() => { buttonElement.innerHTML = originalHTML; buttonElement.style.backgroundColor = ''; }, 2000); } catch (err) { console.error('Fallback gagal menyalin: ', err); alert('Gagal menyalin.'); } document.body.removeChild(textArea); }
