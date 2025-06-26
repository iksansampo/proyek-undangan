<?php
// ========== File: api/update_invitation.php ==========

ini_set('display_errors', 1); error_reporting(E_ALL);
header("Access-Control-Allow-Origin: http://localhost:3000"); header("Access-Control-Allow-Methods: POST, OPTIONS"); header("Access-Control-Allow-Headers: Content-Type, Authorization"); header("Access-Control-Allow-Credentials: true"); header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }
session_start();
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) { http_response_code(401); echo json_encode(['status' => 'error', 'message' => 'Akses ditolak.']); exit(); }
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) { http_response_code(500); echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal.']); exit(); }
$data = json_decode(file_get_contents("php://input"));
if (!isset($data->id) || !is_numeric($data->id) || empty($data->title)) { http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap atau ID tidak valid.']); exit(); }

$id = intval($data->id);

// PERUBAHAN: Cek apakah token sudah ada, jika tidak, buat yang baru
$stmt_check = $conn->prepare("SELECT export_token FROM invitations WHERE id = ?");
$stmt_check->bind_param("i", $id);
$stmt_check->execute();
$result = $stmt_check->get_result();
$existing = $result->fetch_assoc();
$stmt_check->close();
$export_token = (!empty($existing['export_token'])) ? $existing['export_token'] : (bin2hex(random_bytes(16)) . '_' . bin2hex(random_bytes(16)));

$title = $data->title;
$template_id = $data->template_id ?? 'classic';
$story = $data->story ?? '';
$couple_data_json = json_encode($data->couple);
$event_data_json = json_encode($data->events);
$gift_data_json = isset($data->gifts) && is_array($data->gifts) ? json_encode($data->gifts) : '[]';
$gallery_data_json = isset($data->gallery) && is_array($data->gallery) ? json_encode($data->gallery) : '[]';
$cover_image_json = isset($data->cover_image) && is_array($data->cover_image) ? json_encode($data->cover_image) : '[]';
$music_url = $data->music_url ?? '';
$layout_data_json = isset($data->layout_data) && is_array($data->layout_data) ? json_encode($data->layout_data) : '[]';

$sql = "UPDATE invitations SET title = ?, template_id = ?, couple_data = ?, event_data = ?, story = ?, gift_data = ?, gallery_data = ?, cover_image = ?, music_url = ?, layout_data = ?, export_token = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssssssssssi", $title, $template_id, $couple_data_json, $event_data_json, $story, $gift_data_json, $gallery_data_json, $cover_image_json, $music_url, $layout_data_json, $export_token, $id);

if ($stmt->execute()) { echo json_encode(['status' => 'success', 'message' => 'Undangan berhasil diperbarui.']);
} else { echo json_encode(['status' => 'error', 'message' => 'Gagal mengupdate undangan.']); }
$stmt->close(); $conn->close();
?>