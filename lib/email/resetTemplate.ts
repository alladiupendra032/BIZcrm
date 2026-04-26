/**
 * Builds the branded BizCRM password-reset email HTML.
 * Mirrors the dark-themed invite template — works in Gmail / Outlook / Apple Mail.
 */

interface ResetEmailParams {
  resetUrl: string
  recipientEmail: string
}

export function buildResetEmail(params: ResetEmailParams): {
  subject: string
  html: string
} {
  const { resetUrl, recipientEmail } = params
  const name = recipientEmail.split('@')[0]
  const subject = `Reset your BizCRM password`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#060810;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-text-size-adjust:100%;">

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#060810;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0d1117;border-radius:20px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.6);">

          <!-- Top gradient accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid rgba(255,255,255,0.07);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Logo mark -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;height:40px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:10px;text-align:center;vertical-align:middle;">
                          <span style="color:#ffffff;font-size:20px;font-weight:800;line-height:40px;">B</span>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">BizCRM</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px 0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
                Reset your password 🔐
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#94a3b8;line-height:1.6;">
                Hi <strong style="color:#e2e8f0;">${capitalize(name)}</strong>, we received a request to reset the password for your BizCRM account associated with <strong style="color:#e2e8f0;">${recipientEmail}</strong>.
              </p>

              <!-- Security notice card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:18px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <span style="font-size:22px;margin-right:12px;">🛡️</span>
                        </td>
                        <td style="vertical-align:middle;padding-left:4px;">
                          <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Security Notice</p>
                          <p style="margin:4px 0 0 0;font-size:14px;color:#94a3b8;line-height:1.5;">If you didn&rsquo;t request this, you can safely ignore this email. Your password won&rsquo;t change.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:14px;box-shadow:0 0 30px rgba(99,102,241,0.4);">
                          <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                            🔑&nbsp;&nbsp;Reset My Password
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background-color:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#fbbf24;line-height:1.5;">
                      ⏱&nbsp; <strong>This link expires in 1 hour.</strong>
                      After that, you'll need to request a new reset link.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.7;">
                If the button above doesn&rsquo;t work, copy and paste this link into your browser:<br/>
                <a href="${resetUrl}" target="_blank" style="color:#6366f1;word-break:break-all;text-decoration:none;">${resetUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);background-color:rgba(0,0,0,0.2);">
              <p style="margin:0;font-size:12px;color:#334155;text-align:center;line-height:1.6;">
                &copy; ${new Date().getFullYear()} BizCRM &mdash; Business CRM &amp; Operations Management.<br/>
                You received this email because a password reset was requested for your account.<br/>
                If you didn&rsquo;t request this, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>

</body>
</html>
`
  return { subject, html }
}

function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}
