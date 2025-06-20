<?php
// Tampilkan semua error PHP untuk membantu debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Izinkan akses dari server development React, termasuk kredensial
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request (OPTIONS) dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Mulai atau lanjutkan sesi yang ada
session_start();

// Cek apakah pengguna sudah login (lapisan keamanan tambahan)
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    http_response_code(401); // Unauthorized
    echo json_encode(['status' => 'error', 'message' => 'Akses ditolak. Anda harus login untuk melakukan aksi ini.']);
    exit();
}

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal.']);
    exit();
}

// Ambil data JSON yang dikirim dari React
$data = json_decode(file_get_contents("php://input"));

// Validasi ID
if (!isset($data->id) || !is_numeric($data->id)) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'ID undangan tidak valid atau tidak disediakan.']);
    exit();
}

$id = intval($data->id);

// Siapkan query SQL DELETE dengan Prepared Statement untuk keamanan
$sql = "DELETE FROM invitations WHERE id = ?";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyiapkan statement SQL.']);
    exit();
}

// Ikat (bind) parameter ID ke statement
$stmt->bind_param("i", $id);

// Eksekusi statement
if ($stmt->execute()) {
    // Cek apakah ada baris yang terhapus
    if ($stmt->affected_rows > 0) {
        http_response_code(200); // OK
        echo json_encode(['status' => 'success', 'message' => 'Undangan berhasil dihapus.']);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['status' => 'error', 'message' => 'Undangan dengan ID tersebut tidak ditemukan.']);
    }
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengeksekusi perintah hapus.']);
}

$stmt->close();
$conn->close();
?>
