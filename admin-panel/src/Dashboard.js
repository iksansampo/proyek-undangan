import React, { useState, useEffect } from 'react';

// Default State untuk Form Kosong, sebagai "cetakan" yang aman dan lengkap
const defaultInvitationState = {
  title: '',
  template: 'template-classic',
  couple: {
    groom: { name: '', nick: '', father: '', mother: '' },
    bride: { name: '', nick: '', father: '', mother: '' }
  },
  events: [
    { type: 'Akad Nikah', date: '', time: '', venue: '', mapLink: '' }
  ],
  gifts: [
    { bank: 'BCA', number: '', name: '' }
  ],
  gallery: [''], // State untuk galeri
  story: '',
};

// Komponen UI Helper
const InputField = ({ label, ...props }) => (
    <label style={{ display: 'block', marginBottom: '1rem' }}>
        <span style={{ display: 'block', marginBottom: '0.25rem', color: '#555', fontWeight: '500' }}>{label}</span>
        <input {...props} style={{ width: 'calc(100% - 1rem)', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
    </label>
);
const TextAreaField = ({ label, ...props }) => (
    <label style={{ display: 'block', marginBottom: '1rem' }}>
        <span style={{ display: 'block', marginBottom: '0.25rem', color: '#555', fontWeight: '500' }}>{label}</span>
        <textarea {...props} style={{ width: 'calc(100% - 1rem)', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }} />
    </label>
);

// Komponen Halaman Dashboard
export default function Dashboard({ handleLogout }) {
    const [invitation, setInvitation] = useState(defaultInvitationState);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [invitations, setInvitations] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Fungsi untuk mengambil semua data undangan dari API
    const fetchInvitations = async () => {
        try {
            const API_URL = 'http://localhost/proyek_undangan/api/get_invitations.php';
            const response = await fetch(API_URL, { credentials: 'include' });
            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ message: 'Gagal mengambil daftar undangan.' }));
                throw new Error(errorResult.message);
            }
            const data = await response.json();
            setInvitations(data);
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message });
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    // Fungsi untuk menangani simpan data baru atau update data lama
    const handleSaveOrUpdate = async (e) => {
        e.preventDefault();
        
        // Saring semua data array yang kosong sebelum menyimpan
        const filteredEvents = invitation.events.filter(event => event.type && event.type.trim() !== '' && event.date && event.date.trim() !== '');
        const filteredGifts = invitation.gifts.filter(gift => gift.bank && gift.bank.trim() !== '' && gift.number && gift.number.trim() !== '');
        const filteredGallery = invitation.gallery.filter(url => url && url.trim() !== '');

        const dataToSave = { ...invitation, events: filteredEvents, gifts: filteredGifts, gallery: filteredGallery };
        
        const isEditing = editingId !== null;
        const API_URL = isEditing ? 'http://localhost/proyek_undangan/api/update_invitation.php' : 'http://localhost/proyek_undangan/api/save_invitation.php';
        setStatusMessage({ type: 'loading', text: isEditing ? 'Memperbarui...' : 'Menyimpan...' });
        
        const payload = isEditing ? { ...dataToSave, id: editingId } : dataToSave;

        try {
            const response = await fetch(API_URL, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.status === 'success') {
                setStatusMessage({ type: 'success', text: result.message });
                setInvitation(defaultInvitationState);
                setEditingId(null);
                fetchInvitations();
            } else { throw new Error(result.message); }
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message });
        }
    };

    const handleDelete = async (id) => { if (window.confirm(`Apakah Anda yakin ingin menghapus undangan dengan ID: ${id}?`)) { try { const API_URL = 'http://localhost/proyek_undangan/api/delete_invitation.php'; const response = await fetch(API_URL, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); const result = await response.json(); if (result.status === 'success') { setStatusMessage({ type: 'success', text: result.message }); fetchInvitations(); } else { throw new Error(result.message); } } catch (error) { setStatusMessage({ type: 'error', text: `Gagal menghapus: ${error.message}` }); } } };
    
    // handleEdit sekarang juga mengisi semua state
    const handleEdit = (id) => {
        const invitationToEdit = invitations.find(inv => inv.id === id);
        if (invitationToEdit) {
            const formState = { 
                ...defaultInvitationState, 
                title: invitationToEdit.title, 
                template: invitationToEdit.template_id, 
                story: invitationToEdit.story, 
                couple: invitationToEdit.couple_data || defaultInvitationState.couple, 
                events: invitationToEdit.event_data && invitationToEdit.event_data.length > 0 ? invitationToEdit.event_data : defaultInvitationState.events, 
                gifts: invitationToEdit.gift_data && invitationToEdit.gift_data.length > 0 ? invitationToEdit.gift_data : defaultInvitationState.gifts,
                gallery: invitationToEdit.gallery_data && invitationToEdit.gallery_data.length > 0 ? invitationToEdit.gallery_data : defaultInvitationState.gallery,
            };
            setInvitation(formState);
            setEditingId(id);
            window.scrollTo(0, 0);
        }
    };

    const handleCancelEdit = () => { setInvitation(defaultInvitationState); setEditingId(null); setStatusMessage({ type: '', text: '' }); };
    const handleChange = (e) => { const { name, value } = e.target; const keys = name.split('.'); if (keys.length > 1) { setInvitation(prev => { const newState = JSON.parse(JSON.stringify(prev)); let current = newState; for (let i = 0; i < keys.length - 1; i++) { current[keys[i]] = current[keys[i]] || {}; current = current[keys[i]]; } current[keys[keys.length - 1]] = value; return newState; }); } else { setInvitation(prev => ({ ...prev, [name]: value })); } };
    const handleEventChange = (index, field, value) => { const newEvents = [...(invitation.events || [])]; newEvents[index][field] = value; setInvitation(prev => ({...prev, events: newEvents})); };
    const addEvent = () => { setInvitation(prev => ({ ...prev, events: [...(prev.events || []), { type: 'Resepsi', date: '', time: '', venue: '', mapLink: '' }] })); };
    const removeEvent = (index) => { if (invitation.events.length > 1) { if (window.confirm('Hapus blok acara ini?')) { const newEvents = invitation.events.filter((_, i) => i !== index); setInvitation(prev => ({ ...prev, events: newEvents })); } } else { alert('Harus ada minimal satu blok acara.'); } };
    const handleGiftChange = (index, field, value) => { const newGifts = [...(invitation.gifts || [])]; newGifts[index][field] = value; setInvitation(prev => ({ ...prev, gifts: newGifts })); };
    const addGift = () => { setInvitation(prev => ({ ...prev, gifts: [...(prev.gifts || []), { bank: '', number: '', name: '' }] })); };
    const removeGift = (index) => { if (window.confirm('Hapus rekening ini?')) { const newGifts = invitation.gifts.filter((_, i) => i !== index); setInvitation(prev => ({ ...prev, gifts: newGifts })); } };
    const handleGalleryChange = (index, value) => { const newGallery = [...(invitation.gallery || [''])]; newGallery[index] = value; setInvitation(prev => ({ ...prev, gallery: newGallery })); };
    const addGalleryPhoto = () => { setInvitation(prev => ({ ...prev, gallery: [...(prev.gallery || []), ''] })); };
    const removeGalleryPhoto = (index) => { if (window.confirm('Hapus kolom foto ini?')) { const newGallery = invitation.gallery.filter((_, i) => i !== index); setInvitation(prev => ({ ...prev, gallery: newGallery.length > 0 ? newGallery : [''] })); } };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '2rem auto', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Dashboard Admin</h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
            </header>
            
            <h2 style={{ textAlign: 'center', color: '#333' }}>{editingId ? `Edit Undangan (ID: ${editingId})` : 'Buat Undangan Baru'}</h2>
            
            {statusMessage.text && ( <div style={{ padding: '1rem', margin: '1rem 0', borderRadius: '5px', color: 'white', backgroundColor: statusMessage.type === 'success' ? '#28a745' : statusMessage.type === 'error' ? '#dc3545' : '#6c757d' }}>{statusMessage.text}</div> )}
            
            <form onSubmit={handleSaveOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid #ddd', padding: '1.5rem', borderRadius: '5px', backgroundColor: 'white' }}>
                 <fieldset style={{border: '1px solid #eee', padding: '1rem', borderRadius: '4px'}}>
                    <legend style={{ fontWeight: 'bold', padding: '0 .5rem' }}>Informasi Dasar</legend>
                    <InputField label="Judul Undangan:" type="text" name="title" value={invitation.title || ''} onChange={handleChange} required />
                </fieldset>

                 <fieldset style={{border: '1px solid #eee', padding: '1rem', borderRadius: '4px'}}>
                    <legend style={{ fontWeight: 'bold', padding: '0 .5rem' }}>Informasi Mempelai</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h4 style={{marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '0.5rem'}}>Mempelai Pria</h4>
                            <InputField label="Nama Lengkap:" type="text" name="couple.groom.name" value={invitation.couple?.groom?.name || ''} onChange={handleChange} />
                            <InputField label="Nama Panggilan:" type="text" name="couple.groom.nick" value={invitation.couple?.groom?.nick || ''} onChange={handleChange} />
                            <InputField label="Nama Ayah:" type="text" name="couple.groom.father" value={invitation.couple?.groom?.father || ''} onChange={handleChange} />
                            <InputField label="Nama Ibu:" type="text" name="couple.groom.mother" value={invitation.couple?.groom?.mother || ''} onChange={handleChange} />
                        </div>
                        <div>
                            <h4 style={{marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '0.5rem'}}>Mempelai Wanita</h4>
                            <InputField label="Nama Lengkap:" type="text" name="couple.bride.name" value={invitation.couple?.bride?.name || ''} onChange={handleChange} />
                            <InputField label="Nama Panggilan:" type="text" name="couple.bride.nick" value={invitation.couple?.bride?.nick || ''} onChange={handleChange} />
                            <InputField label="Nama Ayah:" type="text" name="couple.bride.father" value={invitation.couple?.bride?.father || ''} onChange={handleChange} />
                            <InputField label="Nama Ibu:" type="text" name="couple.bride.mother" value={invitation.couple?.bride?.mother || ''} onChange={handleChange} />
                        </div>
                    </div>
                </fieldset>

                <fieldset style={{border: '1px solid #eee', padding: '1rem', borderRadius: '4px'}}>
                    <legend style={{ fontWeight: 'bold', padding: '0 .5rem' }}>Detail Acara</legend>
                    {invitation.events && invitation.events.map((event, index) => (
                        <div key={index} style={{border: '1px dashed #ccc', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', position: 'relative'}}>
                             <button type="button" onClick={() => removeEvent(index)} style={{position: 'absolute', top: '10px', right: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', lineHeight: '25px', fontWeight: 'bold', fontSize: '14px'}}>✖</button>
                            <InputField label={`Jenis Acara ${index+1}`} type="text" value={event.type || ''} onChange={(e) => handleEventChange(index, 'type', e.target.value)} />
                            <InputField label="Tanggal" type="date" value={event.date || ''} onChange={(e) => handleEventChange(index, 'date', e.target.value)} />
                            <InputField label="Waktu" type="text" placeholder="Contoh: 09:00 - 11:00" value={event.time || ''} onChange={(e) => handleEventChange(index, 'time', e.target.value)} />
                            <InputField label="Nama Tempat" type="text" value={event.venue || ''} onChange={(e) => handleEventChange(index, 'venue', e.target.value)} />
                            <InputField label="Link Google Maps" type="text" value={event.mapLink || ''} onChange={(e) => handleEventChange(index, 'mapLink', e.target.value)} />
                        </div>
                    ))}
                    <button type="button" onClick={addEvent} style={{padding: '0.5rem 1rem', border: '1px solid #007bff', backgroundColor: 'white', color: '#007bff', borderRadius: '4px', cursor: 'pointer'}}>+ Tambah Acara</button>
                </fieldset>
                
                <fieldset style={{border: '1px solid #eee', padding: '1rem', borderRadius: '4px'}}>
                    <legend style={{ fontWeight: 'bold', padding: '0 .5rem' }}>Amplop Digital / Hadiah</legend>
                    {invitation.gifts && invitation.gifts.map((gift, index) => (
                        <div key={index} style={{border: '1px dashed #ccc', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', position: 'relative'}}>
                            {invitation.gifts.length > 0 && ( <button type="button" onClick={() => removeGift(index)} style={{position: 'absolute', top: '5px', right: '5px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', lineHeight: '20px', fontSize: '12px'}}>✖</button> )}
                            <InputField label={`Tipe Hadiah ${index+1}`} type="text" placeholder="Contoh: Bank BCA / GoPay" value={gift.bank || ''} onChange={(e) => handleGiftChange(index, 'bank', e.target.value)} />
                            <InputField label="Nomor Rekening / Telp" type="text" placeholder="Contoh: 1234567890" value={gift.number || ''} onChange={(e) => handleGiftChange(index, 'number', e.target.value)} />
                            <InputField label="Atas Nama" type="text" placeholder="Contoh: Budi Santoso" value={gift.name || ''} onChange={(e) => handleGiftChange(index, 'name', e.target.value)} />
                        </div>
                    ))}
                    <button type="button" onClick={addGift} style={{padding: '0.5rem 1rem', border: '1px solid #28a745', backgroundColor: 'white', color: '#28a745', borderRadius: '4px', cursor: 'pointer'}}>+ Tambah Hadiah</button>
                </fieldset>
                
                <fieldset style={{border: '1px solid #eee', padding: '1rem', borderRadius: '4px'}}>
                    <legend style={{ fontWeight: 'bold', padding: '0 .5rem' }}>Galeri Foto</legend>
                    <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '1rem'}}>Masukkan URL gambar secara langsung. Contoh: https://i.imgur.com/namafile.jpg</p>
                    {invitation.gallery && invitation.gallery.map((url, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <InputField label={`URL Foto ${index + 1}:`} type="text" placeholder="https://..." value={url} onChange={(e) => handleGalleryChange(index, e.target.value)} />
                            <button type="button" onClick={() => removeGalleryPhoto(index)} style={{ padding: '8px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '38px' }}>Hapus</button>
                        </div>
                    ))}
                    <button type="button" onClick={addGalleryPhoto} style={{padding: '0.5rem 1rem', border: '1px solid #17a2b8', backgroundColor: 'white', color: '#17a2b8', borderRadius: '4px', cursor: 'pointer'}}>+ Tambah Foto</button>
                </fieldset>

                <fieldset style={{border: '1px solid #eee', padding: '1rem', borderRadius: '4px'}}>
                    <legend style={{ fontWeight: 'bold', padding: '0 .5rem' }}>Konten Tambahan</legend>
                    <TextAreaField label="Cerita Cinta:" name="story" value={invitation.story || ''} onChange={handleChange} />
                </fieldset>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                    <button type="submit" style={{ flex: 1, padding: '0.8rem', backgroundColor: editingId ? '#007bff' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} disabled={statusMessage.type === 'loading'}>{editingId ? 'Update Undangan' : 'Simpan Undangan Baru'}</button>
                    {editingId && ( <button type="button" onClick={handleCancelEdit} style={{ padding: '0.8rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Batal Edit</button> )}
                </div>
            </form>

            <div style={{ marginTop: '3rem', borderTop: '2px solid #ddd', paddingTop: '2rem' }}>
                <h2 style={{ textAlign: 'center' }}>Daftar Undangan Tersimpan</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', backgroundColor: 'white' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Judul Undangan</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invitations.length > 0 ? (
                            invitations.map(inv => (
                                <tr key={inv.id}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{inv.id}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{inv.title}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        <button onClick={() => handleEdit(inv.id)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleDelete(inv.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hapus</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>{statusMessage.type === 'error' ? statusMessage.text : 'Memuat data...'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
