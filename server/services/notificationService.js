const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Dispatch history store for admin & student visibility in demo
const dispatchLog = [];

// Initialize Nodemailer transporter
let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;

  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('[NotificationService] Connected to custom SMTP provider');
    } else {
      // Create Ethereal test account for development/demo
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[NotificationService] Initialized automated simulated email transporter (Ethereal test mailbox)');
    }
  } catch (err) {
    console.warn('[NotificationService] SMTP init fallback:', err.message);
    // Dummy transporter fallback
    transporter = {
      sendMail: async (opts) => {
        console.log(`[Email Simulation] To: ${opts.to} | Subject: ${opts.subject}`);
        return { messageId: 'simulated-' + Date.now() };
      }
    };
  }

  return transporter;
};

// Clean and normalize phone numbers for WhatsApp
const formatWhatsAppPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`; // Default India +91 if 10 digits
  return digits;
};

// Generate HTML email wrapper with CampusFind aesthetic
const generateEmailTemplate = ({ title, preheader, bodyHtml, ctaText, ctaUrl, badgeText, badgeColor }) => {
  const color = badgeColor || '#4f46e5';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca); padding: 32px 24px; text-align: center; color: #ffffff; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(255,255,255,0.2); color: #ffffff; margin-bottom: 8px; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .cta-btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 12px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin: 20px 0; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35); text-align: center; }
        .qr-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">${badgeText || 'Campus Security & Lost & Found'}</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">CampusFind</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.85;">"Lost Something? Find It. Found Something? Return It."</p>
        </div>
        <div class="content">
          ${bodyHtml}
          ${
            ctaText && ctaUrl
              ? `<div style="text-align: center;"><a href="${ctaUrl}" class="cta-btn">${ctaText}</a></div>`
              : ''
          }
        </div>
        <div class="footer">
          <p style="margin: 0 0 4px 0;">Campus Security Operations & Student Welfare Platform</p>
          <p style="margin: 0;">This is an automated notification from CampusFind. Please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

class NotificationService {
  /**
   * Universal Dispatcher: Creates in-app alert, sends email, and generates WhatsApp notification
   */
  async dispatch({ recipientUser, title, message, type, relatedItem, relatedClaim, emailHtml, whatsappText, metadata = {}, io = null }) {
    try {
      if (!recipientUser) return null;

      const user = typeof recipientUser === 'string' ? await User.findById(recipientUser) : recipientUser;
      if (!user) return null;

      // 1. Format WhatsApp Link & message
      const formattedPhone = formatWhatsAppPhone(user.phone);
      const whatsappUrl = formattedPhone && whatsappText
        ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappText)}`
        : '';

      // 2. Create In-App Notification in MongoDB
      const notification = await Notification.create({
        recipient: user._id,
        title,
        message,
        type,
        relatedItem: relatedItem ? relatedItem._id || relatedItem : undefined,
        relatedClaim: relatedClaim ? relatedClaim._id || relatedClaim : undefined,
        emailSent: true,
        whatsappSent: Boolean(formattedPhone),
        whatsappUrl,
        metadata: {
          ...metadata,
          recipientEmail: user.email,
          recipientPhone: user.phone || 'Not registered',
          dispatchedAt: new Date()
        }
      });

      // 3. Emit live WebSocket alert if user is currently online
      if (io) {
        io.to(user._id.toString()).emit('notification_received', {
          notification: await notification.populate('relatedItem', 'title images type locationName')
        });
      }

      // 4. Send Email via Nodemailer
      let emailInfo = null;
      try {
        const mailer = await initTransporter();
        emailInfo = await mailer.sendMail({
          from: '"CampusFind Security" <lostfound@campus.edu>',
          to: user.email,
          subject: title,
          html: emailHtml || `<p>${message}</p>`
        });
      } catch (mailErr) {
        console.warn('[NotificationService] Email delivery notice:', mailErr.message);
      }

      // 5. Record to in-memory dispatch audit log
      const logEntry = {
        id: notification._id.toString(),
        timestamp: new Date(),
        recipientName: user.name,
        recipientEmail: user.email,
        recipientPhone: user.phone || 'N/A',
        title,
        message,
        type,
        whatsappUrl,
        whatsappText,
        emailSent: true,
        emailPreviewUrl: emailInfo && nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(emailInfo) : null
      };

      dispatchLog.unshift(logEntry);
      if (dispatchLog.length > 100) dispatchLog.pop();

      console.log(`[Notification Dispatched] Type: ${type} -> To: ${user.name} (${user.email}) | WhatsApp: ${Boolean(whatsappUrl)}`);

      return { notification, logEntry };
    } catch (err) {
      console.error('[NotificationService] Dispatch error:', err);
      return null;
    }
  }

  /**
   * 1. Alert for High-Similarity Matching Item (AI or Category)
   */
  async notifyMatchFound({ recipientUser, lostItem, matchedItem, similarityScore, io }) {
    const title = `AI Match Detected: ${similarityScore}% Similarity!`;
    const message = `A found item "${matchedItem.title}" at ${matchedItem.locationName} may match your lost item "${lostItem.title}".`;
    const itemUrl = `http://localhost:5173/items/${matchedItem._id}`;

    const bodyHtml = `
      <h2 style="color: #0f172a; margin-top: 0;">AI Match Found for Your Lost Item!</h2>
      <p>Hello <strong>${recipientUser.name}</strong>,</p>
      <p>Our campus computer vision matching algorithm has detected a <strong>${similarityScore}% visual & category match</strong> between your lost report and a recently found item.</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0; color: #4338ca; font-size: 15px;">🔍 Matched Item: ${matchedItem.title}</h3>
        <p style="margin: 4px 0; font-size: 13px; color: #64748b;">📍 <strong>Found Location:</strong> ${matchedItem.locationName} (${matchedItem.campusBuilding || 'Campus'})</p>
        <p style="margin: 4px 0; font-size: 13px; color: #64748b;">🏷️ <strong>Category:</strong> ${matchedItem.category}</p>
        <p style="margin: 4px 0; font-size: 13px; color: #16a34a;">✨ <strong>Match Confidence:</strong> ${similarityScore}%</p>
      </div>

      <p>Please review the photos and answer the ownership verification questions to claim your belongings.</p>
    `;

    const whatsappText = `🔍 *CampusFind AI Match Alert* 🔍\n\nHello *${recipientUser.name}*!\n\nA found item (*${matchedItem.title}*) matches your reported lost item (*${lostItem.title}*) with *${similarityScore}% confidence*!\n\n📍 *Found At*: ${matchedItem.locationName}\n👉 *Inspect & Claim*: ${itemUrl}`;

    return this.dispatch({
      recipientUser,
      title,
      message,
      type: 'match_found',
      relatedItem: matchedItem,
      emailHtml: generateEmailTemplate({
        title,
        badgeText: 'AI Visual Match (High Confidence)',
        bodyHtml,
        ctaText: 'View Matched Item & Claim Ownership',
        ctaUrl: itemUrl
      }),
      whatsappText,
      metadata: { similarityScore },
      io
    });
  }

  /**
   * 2. Alert when Claim is Submitted (to Finder)
   */
  async notifyClaimSubmitted({ finderUser, claimantUser, item, claim, io }) {
    const title = `New Ownership Claim for "${item.title}"`;
    const message = `${claimantUser.name} (${claimantUser.department || 'Student'}) submitted proof to claim this item.`;
    const claimUrl = `http://localhost:5173/items/${item._id}`;

    const bodyHtml = `
      <h2 style="color: #0f172a; margin-top: 0;">New Ownership Claim Received</h2>
      <p>Hello <strong>${finderUser.name}</strong>,</p>
      <p>A student has claimed ownership of the item you found: <strong>${item.title}</strong>.</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0; font-size: 13px;">👤 <strong>Claimant:</strong> ${claimantUser.name} (${claimantUser.rollNumber || 'Student'})</p>
        <p style="margin: 4px 0; font-size: 13px;">🏫 <strong>Department:</strong> ${claimantUser.department || 'Campus Member'}</p>
        <p style="margin: 4px 0; font-size: 13px;">📝 <strong>Proof Provided:</strong> ${claim.proofDescription}</p>
      </div>

      <p>Please review the verification answers and approve the claim to issue a secure pickup pass, or let Campus Security verify it.</p>
    `;

    const whatsappText = `📦 *CampusFind Claim Alert* 📦\n\nHello *${finderUser.name}*!\n\n*${claimantUser.name}* has submitted an ownership claim for the item you found: *${item.title}*.\n\n👉 *Review Claim Answers*: ${claimUrl}`;

    return this.dispatch({
      recipientUser: finderUser,
      title,
      message,
      type: 'claim_received',
      relatedItem: item,
      relatedClaim: claim,
      emailHtml: generateEmailTemplate({
        title,
        badgeText: 'Claim Verification Required',
        bodyHtml,
        ctaText: 'Review Answers & Verify Claimant',
        ctaUrl: claimUrl
      }),
      whatsappText,
      io
    });
  }

  /**
   * 3. Alert when Claim is Approved & Unique QR Pickup Token is Issued (to Claimant)
   */
  async notifyClaimApproved({ claimantUser, finderUser, item, claim, qrCodeToken, io }) {
    const title = `Claim Approved! Your Pickup QR Code: ${qrCodeToken}`;
    const message = `Your ownership claim for "${item.title}" was approved. Present this QR code or token to collect the item.`;
    const pickupUrl = `http://localhost:5173/dashboard?tab=claims`;

    const bodyHtml = `
      <h2 style="color: #15803d; margin-top: 0;">🎉 Claim Approved & Verified!</h2>
      <p>Hello <strong>${claimantUser.name}</strong>,</p>
      <p>Great news! Your ownership claim for <strong>"${item.title}"</strong> has been reviewed and verified by ${finderUser ? finderUser.name : 'Campus Administration'}.</p>
      
      <div class="qr-box">
        <div style="font-size: 11px; font-weight: bold; color: #4f46e5; text-transform: uppercase; margin-bottom: 6px;">
          Official Handover Pickup Pass
        </div>
        <div style="font-family: monospace; font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #1e1b4b; background: #ffffff; padding: 10px 16px; border-radius: 8px; display: inline-block; border: 1px solid #cbd5e1;">
          ${qrCodeToken}
        </div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">
          Valid for 72 hours. Present this QR Code or token at the <strong>Campus Security Desk / Central Library</strong>.
        </p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 13px;">
        <p style="margin: 2px 0;">📍 <strong>Handover Location:</strong> ${item.locationName} (${item.campusBuilding || 'Main Campus'})</p>
        <p style="margin: 2px 0;">🛡️ <strong>Safekeeping Status:</strong> Ready for verification</p>
      </div>
    `;

    const whatsappText = `🎉 *CampusFind Pickup Pass Issued* 🎉\n\nHello *${claimantUser.name}*!\n\nYour claim for *"${item.title}"* has been *APPROVED*!\n\n🔑 *Pickup Token*: *${qrCodeToken}*\n📍 *Collect At*: ${item.locationName}\n\nPresent this code to the Admin or Finder. Once scanned, your item will be marked as recovered!\n👉 *View Pass*: ${pickupUrl}`;

    return this.dispatch({
      recipientUser: claimantUser,
      title,
      message,
      type: 'claim_approved',
      relatedItem: item,
      relatedClaim: claim,
      emailHtml: generateEmailTemplate({
        title,
        badgeText: 'Official Pickup Pass',
        badgeColor: '#16a34a',
        bodyHtml,
        ctaText: 'Open Pickup QR Pass',
        ctaUrl: pickupUrl
      }),
      whatsappText,
      metadata: { qrCodeToken },
      io
    });
  }

  /**
   * 4. Alert when Admin Scans QR Code and Marks Item Handover Recovered
   */
  async notifyItemRecovered({ claimantUser, finderUser, item, claim, adminUser, io }) {
    // 4a. Notify Claimant
    const claimantTitle = `Item Handover Complete: "${item.title}" Recovered!`;
    const claimantMsg = `Your item "${item.title}" was verified and successfully handed over by ${adminUser ? adminUser.name : 'Security'}.`;

    const claimantBody = `
      <h2 style="color: #15803d; margin-top: 0;">✨ Handover Completed Successfully!</h2>
      <p>Hello <strong>${claimantUser.name}</strong>,</p>
      <p>Your item <strong>"${item.title}"</strong> has been physically verified via QR code and officially marked as <strong>RECOVERED</strong>.</p>
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin: 16px 0; color: #065f46;">
        <p style="margin: 0; font-weight: bold;">✅ Verified by Campus Administration</p>
        <p style="margin: 4px 0 0 0; font-size: 12px;">Handover recorded on ${new Date().toLocaleString()}</p>
      </div>
      <p>Thank you for using CampusFind to keep our college community safe and honest!</p>
    `;

    const claimantWhatsApp = `✅ *CampusFind Handover Complete* ✅\n\nHello *${claimantUser.name}*!\n\nYour item *"${item.title}"* has been officially handed over and marked *RECOVERED*.\n\nThank you for trusting CampusFind!`;

    await this.dispatch({
      recipientUser: claimantUser,
      title: claimantTitle,
      message: claimantMsg,
      type: 'item_returned',
      relatedItem: item,
      relatedClaim: claim,
      emailHtml: generateEmailTemplate({
        title: claimantTitle,
        badgeText: 'Handover Completed',
        badgeColor: '#16a34a',
        bodyHtml: claimantBody
      }),
      whatsappText: claimantWhatsApp,
      io
    });

    // 4b. Notify Finder with Reward Karma Points
    if (finderUser) {
      const finderTitle = `Item Returned! +50 Campus Karma Points Awarded`;
      const finderMsg = `"${item.title}" was handed over to ${claimantUser.name}. You earned +50 Karma Points!`;

      const finderBody = `
        <h2 style="color: #4f46e5; margin-top: 0;">🌟 You Made an Impact!</h2>
        <p>Hello <strong>${finderUser.name}</strong>,</p>
        <p>The item you found and reported, <strong>"${item.title}"</strong>, has been successfully handed over to its verified owner (<strong>${claimantUser.name}</strong>)!</p>
        <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center;">
          <div style="font-size: 32px; font-weight: 800; color: #4338ca;">+50</div>
          <div style="font-size: 13px; font-weight: bold; color: #3730a3; text-transform: uppercase;">Campus Karma Points Awarded</div>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">You've moved up on the Campus Hall of Fame Leaderboard!</p>
        </div>
        <p>Thank you for demonstrating integrity and helping fellow students on campus!</p>
      `;

      const finderWhatsApp = `🌟 *CampusFind Karma Reward* 🌟\n\nAwesome job, *${finderUser.name}*!\n\nThe item you found (*"${item.title}"*) was successfully handed over to its owner (*${claimantUser.name}*).\n\n🎁 You've been awarded *+50 Campus Karma Points*!\nCheck your ranking: http://localhost:5173/leaderboard`;

      await this.dispatch({
        recipientUser: finderUser,
        title: finderTitle,
        message: finderMsg,
        type: 'reward_earned',
        relatedItem: item,
        relatedClaim: claim,
        emailHtml: generateEmailTemplate({
          title: finderTitle,
          badgeText: 'Karma Points Earned',
          badgeColor: '#4f46e5',
          bodyHtml: finderBody,
          ctaText: 'View Campus Leaderboard',
          ctaUrl: 'http://localhost:5173/leaderboard'
        }),
        whatsappText: finderWhatsApp,
        io
      });
    }
  }

  /**
   * Broadcast a newly reported Lost or Found item to all campus members
   */
  async notifyCampusNewItem({ item, reportedByUser, io }) {
    try {
      const isLost = item.type === 'lost';
      const typeLabel = isLost ? 'Lost Item Alert' : 'Found Item Alert';
      const icon = isLost ? '📢' : '🎁';
      const title = `${icon} New ${typeLabel}: ${item.title}`;
      const message = `${reportedByUser?.name || 'A campus member'} reported a ${item.type} item (${item.title}) at ${item.locationName} (${item.campusBuilding || 'Campus'}).`;

      // 1. Broadcast via Socket.IO to all online connected users
      if (io) {
        io.emit('campus_broadcast_item', {
          id: item._id,
          title: item.title,
          type: item.type,
          category: item.category,
          locationName: item.locationName,
          campusBuilding: item.campusBuilding,
          images: item.images || [],
          complaintId: item.complaintId || item.itemCode,
          reportedByName: reportedByUser?.name || 'Campus Member',
          createdAt: item.createdAt || new Date(),
          toastTitle: title,
          toastMessage: message
        });
      }

      // 2. Persist notification in database for active students/faculty (up to 50 recent active users to avoid server overload)
      const recentUsers = await User.find({
        _id: { $ne: reportedByUser?._id || reportedByUser?.id },
        isBanned: false
      })
        .sort({ lastLoginAt: -1 })
        .limit(50)
        .select('_id');

      if (recentUsers && recentUsers.length > 0) {
        const notifDocs = recentUsers.map((u) => ({
          recipient: u._id,
          title,
          message,
          type: 'new_campus_item',
          relatedItem: item._id,
          isRead: false
        }));

        await Notification.insertMany(notifDocs);
      }
    } catch (err) {
      console.warn('[NotificationService] Campus item broadcast error:', err.message);
    }
  }

  /**
   * Get recent dispatch log for debugging & demo inspection
   */
  getDispatchLog() {
    return dispatchLog;
  }
}

module.exports = new NotificationService();
