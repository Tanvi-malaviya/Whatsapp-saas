<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=whatsapp_saas', 'root', '');
    $stmt = $pdo->query('SELECT id, name, phone_number, phone_number_id, waba_id, LEFT(access_token, 30) as token_preview, LENGTH(access_token) as token_len FROM whats_app_channels');
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
