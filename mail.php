<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    // 1. Destination Email
    $to = "contactnethula@gmail.com";

    // 2. Strict Input Sanitization & Anti-Header-Injection Defense
    $raw_name = isset($_POST["name"]) ? trim($_POST["name"]) : "";
    $raw_email = isset($_POST["email"]) ? trim($_POST["email"]) : "";
    $raw_message = isset($_POST["message"]) ? trim($_POST["message"]) : "";

    // Strip carriage returns and newlines to prevent email header injection (CWE-93)
    $clean_name = preg_replace('/[\r\n]+/', ' ', strip_tags($raw_name));
    $clean_name = substr($clean_name, 0, 100);

    $clean_email = preg_replace('/[\r\n]+/', '', $raw_email);
    $clean_email = filter_var($clean_email, FILTER_SANITIZE_EMAIL);

    // Validate email format
    if (!filter_var($clean_email, FILTER_VALIDATE_EMAIL)) {
        header("Location: index.html?status=invalid_email");
        exit;
    }

    $clean_message = strip_tags($raw_message);
    $clean_message = substr($clean_message, 0, 5000);

    // 3. Email Content & Subject
    $subject = "New Portfolio Transmission from " . $clean_name;
    // Strip newlines from subject
    $subject = preg_replace('/[\r\n]+/', ' ', $subject);

    $email_content = "Name: " . $clean_name . "\n";
    $email_content .= "Email: " . $clean_email . "\n\n";
    $email_content .= "Message:\n" . $clean_message . "\n";

    // 4. Secure Email Headers
    $headers = "From: Website Form <noreply@nethulasanvidu.works>\r\n";
    $headers .= "Reply-To: " . $clean_email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    // 5. Send & Safe Redirect
    if (mail($to, $subject, $email_content, $headers)) {
        header("Location: index.html?status=success");
        exit;
    } else {
        header("Location: index.html?status=failed");
        exit;
    }

} else {
    header("Location: index.html");
    exit;
}
?>
