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

if (empty($data->title) || empty($data->couple)) { http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Data wajib tidak boleh kosong.']); exit(); }

// Persiapan data
$title = $data->title;
$template_id = $data->template ?? 'template-classic';
$couple_data_json = json_encode($data->couple);
$event_data_json = json_encode($data->events);
$gift_data_json = isset($data->gifts) ? json_encode($data->gifts) : '[]';
$story = $data->story ?? '';

// --- PERUBAHAN DI SINI ---
$gallery_data_json = isset($data->gallery) && is_array($data->gallery) ? json_encode($data->gallery) : '[]';

// Query SQL dengan kolom baru
$sql = "INSERT INTO invitations (title, template_id, couple_data, event_data, story, gift_data, gallery_data) VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
// 's' ditambahkan menjadi 7
$stmt->bind_param("sssssss", $title, $template_id, $couple_data_json, $event_data_json, $story, $gift_data_json, $gallery_data_json);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Undangan baru berhasil disimpan!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan undangan.']);
}

$stmt->close();
$conn->close();
?>
