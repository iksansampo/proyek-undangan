<?php
// Tampilkan semua error PHP untuk membantu debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// === PERUBAHAN 1: Menyesuaikan Header CORS untuk Keamanan dan Sesi ===
// Izinkan akses HANYA dari server development React dan izinkan kredensial (cookie)
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

// === PERUBAHAN 2: Memulai Sesi ===
session_start();

// === PERUBAHAN 3: Menambahkan Pengecekan Login (Keamanan) ===
// Endpoint ini sekarang hanya bisa diakses oleh admin yang sudah login
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    http_response_code(401); // Unauthorized
    echo json_encode(['status' => 'error', 'message' => 'Akses ditolak. Anda harus login untuk melihat data ini.']);
    exit();
}


// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal.']);
    exit();
}

// Cek apakah parameter 'id' (invitation_id) ada di URL
if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID Undangan diperlukan.']);
    exit();
}

$invitation_id = intval($_GET['id']);

// Query SQL untuk mengambil semua rsvp untuk undangan spesifik, diurutkan dari yang terbaru
$sql = "SELECT guest_name, message, attendance_status, created_at FROM rsvps WHERE invitation_id = ? ORDER BY created_at DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $invitation_id);
$stmt->execute();
$result = $stmt->get_result();

$rsvps = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $rsvps[] = $row;
    }
}

// Kirim data sebagai respons
http_response_code(200);
echo json_encode($rsvps);

$stmt->close();
$conn->close();
?>
