<?php
// ==========================================================
// === File: api/export_rsvps.php (Fitur Ekspor ke CSV) ===
// ==========================================================

// Memulai sesi untuk memeriksa login
session_start();

// Keamanan: Pastikan hanya admin yang login yang bisa mengakses
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    http_response_code(403);
    die("Akses ditolak. Anda harus login.");
}

// Validasi input
if (!isset($_GET['invitation_id']) || !is_numeric($_GET['invitation_id'])) {
    http_response_code(400);
    die("Error: ID Undangan tidak valid atau tidak disediakan.");
}

$invitation_id = intval($_GET['invitation_id']);

// --- Koneksi Database ---
$conn = new mysqli("localhost", "root", "", "db_undangan");
if ($conn->connect_error) {
    http_response_code(500);
    die("Koneksi database gagal: " . $conn->connect_error);
}

// --- Ambil Data RSVP dari Database ---
$stmt = $conn->prepare("SELECT guest_name, attendance_status, message, created_at FROM rsvps WHERE invitation_id = ? ORDER BY created_at DESC");
$stmt->bind_param("i", $invitation_id);
$stmt->execute();
$result = $stmt->get_result();

// --- Logika untuk Membuat dan Mengirim File CSV ---

$filename = "daftar_tamu_rsvp_undangan_" . $invitation_id . "_" . date('Y-m-d') . ".csv";

// Atur header HTTP agar browser mengunduh file, bukan menampilkannya
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');

// Buka output stream PHP untuk menulis file
$output = fopen('php://output', 'w');

// Tulis baris header untuk file CSV
fputcsv($output, ['Nama Tamu', 'Status Kehadiran', 'Ucapan', 'Waktu Konfirmasi']);

// Loop melalui data dari database dan tulis setiap baris ke file CSV
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, $row);
    }
}

$stmt->close();
$conn->close();

// Selesai
exit();
?>
