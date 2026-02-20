# Kitchen Display System - Subdomain Setup Guide

## Overview

The Kitchen Display System (KDS) is accessible at `/admin/kitchen` and can be configured to use a dedicated subdomain for easier access by kitchen staff.

## Recommended Subdomain Options

1. **kitchen.johnnys-pizza.com** (Recommended)
2. **kds.johnnys-pizza.com** (Alternative)
3. **display.johnnys-pizza.com** (Alternative)

## Setup Instructions

### Step 1: Configure Custom Domain in Manus

1. Open the Management UI (right panel in Manus interface)
2. Navigate to **Settings** → **Domains**
3. Click **Add Custom Domain** or **Bind Domain**
4. Enter your desired subdomain (e.g., `kitchen.johnnys-pizza.com`)
5. Follow the DNS configuration instructions provided by Manus

### Step 2: DNS Configuration

You'll need to add a DNS record with your domain registrar:

**For subdomain routing:**
- **Type**: CNAME
- **Name**: kitchen (or kds, display)
- **Value**: Your Manus-provided domain (e.g., `your-project.manus.space`)
- **TTL**: 3600 (or default)

**Example DNS Record:**
```
Type: CNAME
Name: kitchen
Value: johnnys-pizza-ordering.manus.space
TTL: 3600
```

### Step 3: Route Configuration

The application automatically routes to the kitchen display when accessing:
- `/admin/kitchen` (current route)
- Any subdomain pointing to the same deployment

**No code changes needed** - the KDS will work on any subdomain that points to your Manus deployment.

### Step 4: Access Control

The Kitchen Display System requires:
- **Authentication**: Users must be signed in
- **Authorization**: User role must be `admin`

Kitchen staff should:
1. Navigate to the subdomain (e.g., `kitchen.johnnys-pizza.com`)
2. Sign in with their admin account
3. The system will redirect to `/admin/kitchen` automatically

## Tablet/Display Setup

For dedicated kitchen displays (tablets, monitors):

1. **Browser Setup**:
   - Use Chrome or Firefox in fullscreen mode (F11)
   - Disable sleep/screensaver on the device
   - Enable "Stay awake" if using Android tablets

2. **Bookmark the KDS**:
   - Navigate to `kitchen.johnnys-pizza.com/admin/kitchen`
   - Bookmark or set as homepage
   - Enable auto-login if device is secure

3. **Audio Alerts**:
   - Ensure device volume is appropriate for kitchen environment
   - Test all three alert sounds:
     - New order alert
     - Status change notification
     - Urgent order alarm

4. **Display Settings**:
   - Recommended resolution: 1920x1080 or higher
   - Brightness: High (kitchen lighting can be bright)
   - Orientation: Landscape

## Features Enabled

The enhanced KDS includes:

✅ **Color-Coded Ticket Aging**
- White background: New orders (0-10 minutes)
- Yellow background: Approaching threshold (10-15 minutes)
- Red background: Urgent orders (15+ minutes)

✅ **Elapsed Time Display**
- Large, prominent time display on each order
- Color-coded based on urgency
- Minute counter for precise tracking

✅ **Audio Alerts**
- New order sound when orders arrive
- Status change notification when orders are updated
- Urgent alert for orders exceeding 15 minutes (repeats every 5 minutes)

✅ **Enhanced Status Workflow**
- Large, touch-friendly action buttons
- Visual feedback on status changes
- Automatic progression: Pending → Preparing → Ready/Out for Delivery → Completed

✅ **Auto-Refresh**
- Automatic refresh every 10 seconds
- Real-time order updates
- No manual refresh needed

## Troubleshooting

### Audio Not Playing
- Check device volume settings
- Ensure browser allows audio autoplay
- Click anywhere on the page to enable audio (browser autoplay policy)

### Orders Not Updating
- Check internet connection
- Verify auto-refresh is working (watch the order count)
- Refresh the page manually if needed

### Can't Access KDS
- Verify you're signed in
- Check that your user role is set to `admin`
- Contact system administrator to update your role

### Subdomain Not Working
- Verify DNS records are correctly configured
- Allow 24-48 hours for DNS propagation
- Check that CNAME points to correct Manus domain
- Clear browser cache and try again

## Security Considerations

- **Authentication Required**: All kitchen staff must have admin accounts
- **Secure Device**: If using shared tablets, consider auto-logout after inactivity
- **Network Security**: Ensure kitchen devices are on secure WiFi
- **Regular Updates**: Keep browser updated for security patches

## Future Enhancements

Potential features for future implementation:

- Dark mode toggle for different lighting conditions
- Customizable time thresholds per order type
- Production items summary (aggregate counts at bottom)
- Recently fulfilled orders view (last 20 orders)
- Grid view layout options
- Pagination for high-volume periods
- Multiple screen support for different prep stations

## Support

For technical support or feature requests, contact the development team or refer to the main project documentation.
