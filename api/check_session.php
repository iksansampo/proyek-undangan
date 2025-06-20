<?php
session_start(); // Wajib untuk mengakses data session

// Pengaturan Header CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Cek apakah session 'is_logged_in' ada dan bernilai true
if (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in'] === true) {
    // Jika ya, kirim data pengguna yang sedang login
    echo json_encode([
        'status' => 'success',
        'is_logged_in' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username']
        ]
    ]);
} else {
    // Jika tidak ada session, kirim status tidak login
    echo json_encode([
        'status' => 'success',
        'is_logged_in' => false
    ]);
}
?>
