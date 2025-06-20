import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Ini adalah komponen Halaman Login Anda yang sudah lengkap dan diperbaiki
function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const API_URL = 'http://localhost/proyek_undangan/api/login.php';
            const response = await fetch(API_URL, {
                method: 'POST',
                // 'credentials: include' penting agar browser mau mengirim dan menerima cookie session
                credentials: 'include', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Jika login berhasil, kita refresh halaman.
                // Logika di App.js akan mendeteksi session baru dan mengarahkan ke dashboard.
                window.location.href = '/dashboard';
            } else {
                setLoading(false);
                // Jika gagal, tampilkan pesan error dari PHP
                setError(result.message);
            }
        } catch (err) {
            setLoading(false);
            setError('Gagal terhubung ke server. Pastikan XAMPP berjalan.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.loginBox}>
                <h2 style={styles.title}>Admin Panel Login</h2>
                <p style={styles.subtitle}>Silakan masuk untuk melanjutkan</p>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="admin"
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="password123"
                        />
                    </div>
                    {error && <p style={styles.error}>{error}</p>}
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Memproses...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Styling sederhana untuk halaman login
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    loginBox: { padding: '40px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
    title: { textAlign: 'center', marginBottom: '10px', color: '#333' },
    subtitle: { textAlign: 'center', marginBottom: '24px', color: '#888', fontSize: '14px' },
    inputGroup: { marginBottom: '20px' },
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginTop: '5px' },
    button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
    error: { color: 'red', textAlign: 'center', marginTop: '10px', fontSize: '14px' }
};

export default LoginPage;
