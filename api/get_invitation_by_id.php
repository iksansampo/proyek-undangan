<?php
// ==========================================================
// ========== File: api/get_invitation_by_id.php ==========
// Mengambil dan men-decode layout_data untuk satu undangan
// ==========================================================
ob_start();
ini_set('display_errors', 0); ini_set('log_errors', 1); error_reporting(E_ALL);
function send_json_error($statusCode, $message, $details = "") { ob_end_clean(); header("Content-Type: application/json; charset=UTF-8"); http_response_code($statusCode); echo json_encode(['status' => 'error', 'message' => $message, 'details' => $details]); exit(); }
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json; charset=UTF-8");
try { $conn = new mysqli("localhost", "root", "", "db_undangan"); if ($conn->connect_error) { throw new Exception("Koneksi database gagal: " . $conn->connect_error); } } catch (Exception $e) { send_json_error(500, 'Kesalahan Server Internal', $e->getMessage()); }
if (!isset($_GET['id']) || !is_numeric($_GET['id']) || intval($_GET['id']) <= 0) { send_json_error(400, 'ID undangan tidak valid.'); }
$id = intval($_GET['id']);
// PERUBAHAN BARU:
$sql = "SELECT id, title, template_id, couple_data, event_data, gift_data, gallery_data, story, cover_image, music_url, layout_data FROM invitations WHERE id = ? LIMIT 1";
$stmt = $conn->prepare($sql);
if ($stmt === false) { send_json_error(500, 'Gagal menyiapkan statement SQL.', $conn->error); }
$stmt->bind_param("i", $id); $stmt->execute(); $result = $stmt->get_result();
if ($result->num_rows > 0) {
    $invitation = $result->fetch_assoc();
    $invitation['couple_data'] = json_decode($invitation['couple_data']) ?? (object)[];
    $invitation['event_data'] = json_decode($invitation['event_data']) ?? [];
    $invitation['gift_data'] = json_decode($invitation['gift_data']) ?? [];
    $invitation['gallery_data'] = json_decode($invitation['gallery_data']) ?? [];
    $invitation['cover_image'] = json_decode($invitation['cover_image']) ?? [];
    // PERUBAHAN BARU:
    $invitation['layout_data'] = json_decode($invitation['layout_data']) ?? [];
    ob_end_clean();
    http_response_code(200);
    echo json_encode($invitation);
} else { send_json_error(404, 'Undangan dengan ID ' . $id . ' tidak ditemukan.'); }
$stmt->close(); $conn->close();
?>
