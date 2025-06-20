<?php
// ... (semua header dan koneksi database Anda yang sudah ada) ...
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }
session_start();
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) { http_response_code(401); echo json_encode(['status' => 'error', 'message' => 'Akses ditolak.']); exit(); }

$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) { http_response_code(500); echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal.']); exit(); }

$data = json_decode(file_get_contents("php://input"));

// Validasi
if (!isset($data->id) || !is_numeric($data->id) || empty($data->title)) { http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap atau ID tidak valid.']); exit(); }

// Persiapan data
$id = intval($data->id);
$title = $data->title;
$template_id = $data->template ?? 'template-classic';
$story = $data->story ?? '';
$couple_data_json = json_encode($data->couple);
$event_data_json = json_encode($data->events);
$gift_data_json = isset($data->gifts) && is_array($data->gifts) ? json_encode($data->gifts) : '[]';

// --- PERUBAHAN DI SINI ---
$gallery_data_json = isset($data->gallery) && is_array($data->gallery) ? json_encode($data->gallery) : '[]';

// Query SQL dengan kolom baru
$sql = "UPDATE invitations SET 
            title = ?, template_id = ?, couple_data = ?, 
            event_data = ?, story = ?, gift_data = ?, gallery_data = ? 
        WHERE id = ?";

$stmt = $conn->prepare($sql);
// 's' menjadi 7, 'i' untuk id tetap 1. Total 8 parameter.
$stmt->bind_param("sssssssi", $title, $template_id, $couple_data_json, $event_data_json, $story, $gift_data_json, $gallery_data_json, $id);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Undangan berhasil diperbarui.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengupdate undangan.']);
}

$stmt->close();
$conn->close();
?>
