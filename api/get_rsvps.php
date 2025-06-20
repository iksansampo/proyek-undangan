<?php
// Tampilkan semua error PHP untuk membantu debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Izinkan akses dari mana saja
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Koneksi ke database
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([]); // Kirim array kosong jika error
    exit();
}

// Cek apakah parameter 'id' (invitation_id) ada di URL
if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode([]);
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
if ($result->num_rows > 0) {
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
