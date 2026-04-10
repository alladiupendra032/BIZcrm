/**
 * Builds the branded BizCRM invite email HTML.
 * Dark-themed, responsive, works in Gmail / Outlook / Apple Mail.
 */

interface InviteEmailParams {
  inviteUrl: string
  inviteeName: string   // first part of email e.g. "john"
  inviterName: string   // admin who sent the invite
  role: string          // "Manager" | "Team Member"
  orgName: string
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Admin:       { bg: '#3b1f6e', text: '#c4b5fd', border: '#7c3aed' },
  Manager:     { bg: '#3d2a08', text: '#fbbf24', border: '#d97706' },
  'Team Member': { bg: '#0f2645', text: '#60a5fa', border: '#2563eb' },
}

function getRoleColors(role: string) {
  return ROLE_COLORS[role] || ROLE_COLORS['Team Member']
}

export function buildInviteEmail(params: InviteEmailParams): {
  subject: string
  html: string
} {
  const { inviteUrl, inviteeName, inviterName, role, orgName } = params
  const colors = getRoleColors(role)

  const subject = `${inviterName} invited you to join ${orgName} on BizCRM`

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
                You&rsquo;ve been invited! 👋
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#94a3b8;line-height:1.6;">
                Hi <strong style="color:#e2e8f0;">${capitalize(inviteeName)}</strong>, 
                <strong style="color:#e2e8f0;">${inviterName}</strong> has invited you to join their workspace on BizCRM.
              </p>

              <!-- Org card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:18px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <!-- Building emoji as icon -->
                          <span style="font-size:22px;margin-right:12px;">🏢</span>
                        </td>
                        <td style="vertical-align:middle;padding-left:4px;">
                          <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Organization</p>
                          <p style="margin:4px 0 0 0;font-size:17px;font-weight:700;color:#f1f5f9;">${orgName}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Role badge -->
              <p style="margin:0 0 10px 0;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Your Role</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:${colors.bg};border:1px solid ${colors.border};border-radius:10px;padding:10px 18px;">
                    <span style="font-size:15px;font-weight:700;color:${colors.text};">${role}</span>
                  </td>
                </tr>
              </table>

              <!-- What is BizCRM -->
              <p style="margin:0 0 28px 0;font-size:15px;color:#94a3b8;line-height:1.7;background:rgba(255,255,255,0.03);border-left:3px solid rgba(99,102,241,0.5);padding:14px 16px;border-radius:0 10px 10px 0;">
                BizCRM helps teams manage <strong style="color:#c7d2fe;">customers</strong>, track <strong style="color:#c7d2fe;">deals</strong>, and collaborate on <strong style="color:#c7d2fe;">tasks</strong> — all in one place.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:14px;box-shadow:0 0 30px rgba(99,102,241,0.4);">
                          <a href="${inviteUrl}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                            ✉&nbsp;&nbsp;Accept Invite &amp; Get Started
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
                      ⏱&nbsp; <strong>This invite link expires in 24 hours.</strong>
                      If it expires, ask ${inviterName} to send a new invite.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.7;">
                If the button above doesn&rsquo;t work, copy and paste this link into your browser:<br/>
                <a href="${inviteUrl}" target="_blank" style="color:#6366f1;word-break:break-all;text-decoration:none;">${inviteUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);background-color:rgba(0,0,0,0.2);">
              <p style="margin:0;font-size:12px;color:#334155;text-align:center;line-height:1.6;">
                &copy; ${new Date().getFullYear()} BizCRM &mdash; Business CRM &amp; Operations Management.<br/>
                You received this email because <strong>${inviterName}</strong> invited you to <strong>${orgName}</strong>.<br/>
                If you didn&rsquo;t expect this, you can safely ignore it.
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
