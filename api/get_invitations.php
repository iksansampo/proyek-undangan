<?php
// Tampilkan semua error PHP untuk membantu debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Izinkan akses dari server development React, termasuk kredensial
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request (OPTIONS) dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Mulai atau lanjutkan sesi yang ada
session_start();

// Cek apakah pengguna sudah login. Ini adalah praktik keamanan yang baik.
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    http_response_code(401); // Unauthorized
    echo json_encode(['status' => 'error', 'message' => 'Akses ditolak. Anda harus login terlebih dahulu.']);
    exit();
}

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal.']);
    exit();
}

// Query SQL untuk mengambil semua undangan
$sql = "SELECT * FROM invitations ORDER BY id DESC";
$result = $conn->query($sql);

$invitations = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Ubah data JSON dari database menjadi objek/array PHP
        $row['couple_data'] = json_decode($row['couple_data']);
        $row['event_data'] = json_decode($row['event_data']);
        $row['gift_data'] = json_decode($row['gift_data']);
        $row['gallery_data'] = json_decode($row['gallery_data']);
        $invitations[] = $row;
    }
}

// Kirim data sebagai respons
http_response_code(200);
echo json_encode($invitations);

$conn->close();
?>
