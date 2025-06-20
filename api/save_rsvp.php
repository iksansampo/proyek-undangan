<?php
// Tampilkan semua error PHP untuk membantu debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Izinkan akses dari mana saja karena ini adalah form publik
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight request (OPTIONS) dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal.']);
    exit();
}

// Ambil data JSON yang dikirim dari JavaScript
$data = json_decode(file_get_contents("php://input"));

// Validasi data input
if (empty($data->invitation_id) || empty($data->guest_name) || empty($data->message) || empty($data->attendance_status)) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Semua kolom harus diisi.']);
    exit();
}

// Persiapkan data untuk disimpan
$invitation_id = intval($data->invitation_id);
$guest_name = htmlspecialchars(strip_tags($data->guest_name));
$message = htmlspecialchars(strip_tags($data->message));
$attendance_status = htmlspecialchars(strip_tags($data->attendance_status));


// Siapkan query SQL INSERT dengan Prepared Statement untuk keamanan
$sql = "INSERT INTO rsvps (invitation_id, guest_name, message, attendance_status) VALUES (?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyiapkan statement SQL: ' . $conn->error]);
    exit();
}

// Ikat (bind) parameter ke statement
// 'isss' berarti: integer, string, string, string
$stmt->bind_param("isss", $invitation_id, $guest_name, $message, $attendance_status);

// Eksekusi statement
if ($stmt->execute()) {
    http_response_code(201); // Created
    echo json_encode(['status' => 'success', 'message' => 'Terima kasih! Ucapan dan konfirmasi Anda telah berhasil dikirim.']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan ucapan: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
