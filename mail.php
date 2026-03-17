<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // 1. EDIT YOUR EMAIL HERE
    $to = "contactnethula@gmail.com"; // Replace with your cPanel email
    $subject = "New Portfolio Transmission from " . $_POST['name'];

    // 2. SANITIZE INPUTS
    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $message = trim($_POST["message"]);

    // 3. EMAIL CONTENT
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";

    // 4. EMAIL HEADERS
    // Tip: Use a 'noreply' address from your domain as the 'From' to prevent Spam folder issues
    $headers = "From: Website Form <noreply@nethula.com>\r\n";
    $headers .= "Reply-To: $email\r\n";

    // 5. SEND AND REDIRECT
    if (mail($to, $subject, $email_content, $headers)) {
        // Success: Go back to home page with a success query (you can handle this in JS if you want)
        header("Location: index.html?status=success");
        exit;
    } else {
        // Error
        echo "Transmission Failed. Please try again.";
    }

} else {
    // If someone tries to open mail.php directly
    header("Location: index.html");
    exit;
}
?>