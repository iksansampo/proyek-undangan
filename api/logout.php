<?php
session_start();

// Pengaturan Header CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Hancurkan semua data session
session_unset();
session_destroy();

// Kirim respons sukses
echo json_encode(['status' => 'success', 'message' => 'Logout berhasil.']);
?>
