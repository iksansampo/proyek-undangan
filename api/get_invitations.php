<?php
// ==========================================================
// ========== File: api/get_invitations.php ==========
// Mengambil dan men-decode layout_data untuk daftar undangan
// ==========================================================
ini_set('display_errors', 0); ini_set('log_errors', 1); error_reporting(E_ALL);
header("Content-Type: application/json; charset=UTF-8"); header("Access-Control-Allow-Origin: http://localhost:3000"); header("Access-Control-Allow-Credentials: true"); header("Access-Control-Allow-Methods: GET, OPTIONS"); header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }
if (session_status() == PHP_SESSION_NONE) { session_start(); }
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) { http_response_code(401); echo json_encode(['status' => 'error', 'message' => 'Akses ditolak.']); exit(); }
$conn = new mysqli("localhost", "root", "", "db_undangan");

// PERUBAHAN BARU:
$sql = "SELECT id, title, template_id, couple_data, event_data, gift_data, gallery_data, story, cover_image, music_url, layout_data FROM invitations ORDER BY id DESC";
$result = $conn->query($sql);
$invitations = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $row['couple_data'] = json_decode($row['couple_data']) ?? (object)[];
        $row['event_data'] = json_decode($row['event_data']) ?? [];
        $row['gift_data'] = json_decode($row['gift_data']) ?? [];
        $row['gallery_data'] = json_decode($row['gallery_data']) ?? [];
        $row['cover_image'] = json_decode($row['cover_image']) ?? [];
        // PERUBAHAN BARU:
        $row['layout_data'] = json_decode($row['layout_data']) ?? [];
        $invitations[] = $row;
    }
}
http_response_code(200); echo json_encode($invitations); $conn->close();
?>