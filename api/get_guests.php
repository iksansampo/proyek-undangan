<?php
// ========== File: api/get_guests.php ==========
// API ini akan mengambil daftar nama tamu untuk satu undangan spesifik.

ini_set('display_errors', 1); error_reporting(E_ALL);
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

session_start();
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    http_response_code(401); echo json_encode(['status' => 'error', 'message' => 'Akses ditolak.']); exit();
}

$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500); echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal.']); exit();
}

if (!isset($_GET['invitation_id'])) {
    http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'ID Undangan diperlukan.']); exit();
}

$invitation_id = intval($_GET['invitation_id']);

$sql = "SELECT id, guest_name FROM guests WHERE invitation_id = ? ORDER BY guest_name ASC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $invitation_id);
$stmt->execute();
$result = $stmt->get_result();

$guests = [];
while ($row = $result->fetch_assoc()) {
    $guests[] = $row;
}

echo json_encode($guests);

$stmt->close();
$conn->close();
?>