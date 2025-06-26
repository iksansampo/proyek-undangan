<?php
// =================================================================
// === File: api/export_rsvps_public.php (Akses Publik dengan Token) ===
// =================================================================

// Validasi input: harus ada ID dan TOKEN
if (!isset($_GET['id']) || !is_numeric($_GET['id']) || !isset($_GET['token'])) {
    http_response_code(400);
    die("Akses tidak valid.");
}

$invitation_id = intval($_GET['id']);
$token = $_GET['token'];

// --- Koneksi Database ---
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500);
    die("Error Server.");
}

// --- Verifikasi Token ---
$stmt_verify = $conn->prepare("SELECT id FROM invitations WHERE id = ? AND export_token = ?");
$stmt_verify->bind_param("is", $invitation_id, $token);
$stmt_verify->execute();
$result_verify = $stmt_verify->get_result();
if ($result_verify->num_rows === 0) {
    http_response_code(403);
    die("Token tidak valid atau tidak cocok dengan ID undangan.");
}
$stmt_verify->close();

// --- Jika token valid, lanjutkan untuk mengambil dan mengekspor data ---
$stmt_data = $conn->prepare("SELECT guest_name, attendance_status, message, created_at FROM rsvps WHERE invitation_id = ? ORDER BY created_at DESC");
$stmt_data->bind_param("i", $invitation_id);
$stmt_data->execute();
$result_data = $stmt_data->get_result();

$filename = "rsvp_undangan_" . $invitation_id . "_" . date('Y-m-d') . ".csv";
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
$output = fopen('php://output', 'w');
fputcsv($output, ['Nama Tamu', 'Status Kehadiran', 'Ucapan', 'Waktu Konfirmasi']);
while ($row = $result_data->fetch_assoc()) {
    fputcsv($output, $row);
}
$stmt_data->close();
$conn->close();
exit();
?>
