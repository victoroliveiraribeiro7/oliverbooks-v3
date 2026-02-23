<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Lê o JSON vindo do frontend Javascript (payload com itens e preco)
$json = file_get_contents('php://input');

// Prepara o CURL para engabelar o InfinitePay escondendo as chaves privadas do usuário
$ch = curl_init('https://api.infinitepay.io/invoices/public/checkout/links');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($json)
]);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["message" => "Erro na comunicação com a API InfinitePay: " . curl_error($ch)]);
} else {
    http_response_code($httpcode);
    echo $response;
}
curl_close($ch);
?>
