export function wrapEmail(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f7; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .logo { font-size: 24px; font-weight: 700; color: #4A90E2; text-align: center; margin-bottom: 24px; }
    .btn { display: inline-block; background: #4A90E2; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #8E8E93; }
    h2 { margin: 0 0 16px; font-size: 20px; color: #1C1C1E; }
    p { margin: 0 0 16px; font-size: 14px; color: #3C3C43; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">AddFi</div>
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AddFi. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}
