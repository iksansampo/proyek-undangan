<?php
// Izinkan akses dari mana saja
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// ==========================================================
// --- KODE KONEKSI DATABASE (DITARUH LANGSUNG DI SINI) ---
// ==========================================================
$host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "db_undangan";

$conn = new mysqli($host, $db_user, $db_pass, $db_name);

// Cek koneksi
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal: ' . $conn->connect_error]);
    exit();
}
// ==========================================================

// Cek apakah parameter 'id' ada di URL
if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'ID undangan tidak disediakan.']);
    exit();
}

// Ambil ID dan pastikan itu adalah angka
$id = intval($_GET['id']);

// Siapkan query SQL untuk mengambil data dengan ID spesifik
$sql = "SELECT * FROM invitations WHERE id = ? LIMIT 1";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyiapkan statement SQL.']);
    exit();
}

// Ikat parameter ID ke statement
$stmt->bind_param("i", $id); // 'i' untuk integer

// Eksekusi statement
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Jika data ditemukan
    $invitation = $result->fetch_assoc();

    // Ubah string JSON dari database menjadi objek/array PHP
    $invitation['couple_data'] = json_decode($invitation['couple_data']);
    $invitation['event_data'] = json_decode($invitation['event_data']);
    $invitation['gift_data'] = json_decode($invitation['gift_data']);
    $invitation['gallery_data'] = json_decode($invitation['gallery_data']);

    // Kirim data sebagai respons sukses
    http_response_code(200); // OK
    echo json_encode($invitation);
} else {
    // Jika tidak ada data dengan ID tersebut
    http_response_code(404); // Not Found
    echo json_encode(['status' => 'error', 'message' => 'Undangan dengan ID ' . $id . ' tidak ditemukan.']);
}

$stmt->close();
$conn->close();
?>
