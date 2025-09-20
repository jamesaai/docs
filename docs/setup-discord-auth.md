# 🔐 Discord Authentication Setup Guide

This guide will help you set up Discord OAuth authentication for your Fire Alarm School staff portal.

## 📋 Prerequisites

- Discord Developer Account
- Discord Server with staff roles
- Server hosting environment
- Domain name (for OAuth redirect)

## 🚀 Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name your application: `Fire Alarm School Staff Portal`
4. Click **"Create"**

## 🔧 Step 2: Configure OAuth Settings

1. In your application, go to **"OAuth2"** → **"General"**
2. Copy your **Client ID** and **Client Secret**
3. Add redirect URI: `https://yourdomain.com/api/auth/discord/callback`
4. Save changes

## 🤖 Step 3: Create Discord Bot

1. Go to **"Bot"** section
2. Click **"Add Bot"**
3. Copy the **Bot Token**
4. Enable these permissions:
   - `Read Messages`
   - `Read Message History`
   - `View Server Members`
   - `Manage Roles` (if needed)

## 📝 Step 4: Environment Variables

Create a `.env` file with these variables:

```env
# Discord OAuth Configuration
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/discord/callback
DISCORD_GUILD_ID=your_server_id_here
DISCORD_BOT_TOKEN=your_bot_token_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Staff Role IDs (get these from Discord)
MODERATOR_ROLE_ID=moderator_role_id_here
ADMIN_ROLE_ID=admin_role_id_here
OWNER_ROLE_ID=owner_role_id_here
```

## 🎯 Step 5: Get Discord Server Information

### Get Server ID
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your server name
3. Click **"Copy ID"**

### Get Role IDs
1. Go to Server Settings → Roles
2. Right-click each staff role
3. Click **"Copy ID"**
4. Add these IDs to your environment variables

## 🔗 Step 6: Invite Bot to Server

1. Go to **"OAuth2"** → **"URL Generator"**
2. Select scopes: `bot`, `identify`, `guilds`, `guilds.members.read`
3. Select permissions: `Read Messages`, `Read Message History`, `View Server Members`
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

## 🛡️ Step 7: Security Configuration

### Update docs.json
Make sure your security headers include Discord domains:

```json
{
  "security": {
    "contentSecurityPolicy": {
      "connectSrc": ["'self'", "https://discord.com", "https://api.discord.com"]
    }
  }
}
```

### HTTPS Requirements
- OAuth requires HTTPS in production
- Use a valid SSL certificate
- Test redirect URLs work correctly

## 🧪 Step 8: Testing

1. Deploy your application with environment variables
2. Visit `/auth/login` to test the flow
3. Verify staff roles are checked correctly
4. Test logout functionality

## 🔍 Troubleshooting

### Common Issues

**"Invalid redirect URI"**
- Ensure the redirect URI in Discord matches exactly
- Check for trailing slashes or HTTP vs HTTPS

**"Insufficient permissions"**
- Verify bot has necessary permissions in server
- Check role IDs are correct
- Ensure user has the required role

**"Authentication failed"**
- Check environment variables are set correctly
- Verify JWT secret is strong and secure
- Check server logs for detailed error messages

### Debug Mode
Add logging to see detailed information:

```javascript
console.log('Discord Auth Debug:', {
  clientId: CLIENT_ID,
  redirectUri: REDIRECT_URI,
  guildId: DISCORD_GUILD_ID
});
```

## 🔒 Security Best Practices

1. **Keep secrets secure**: Never commit `.env` files to version control
2. **Use strong JWT secrets**: Generate random, long secrets
3. **Regular token rotation**: Change secrets periodically
4. **Monitor access logs**: Watch for suspicious authentication attempts
5. **Limit bot permissions**: Only grant necessary Discord bot permissions

## 📞 Support

If you need help with setup:
- Check Discord Developer Documentation
- Review OAuth 2.0 specifications
- Contact technical support with specific error messages

---

<Warning>
  **Important:** This authentication system provides access to sensitive administrative functions. Ensure only trusted staff members have the required Discord roles.
</Warning>