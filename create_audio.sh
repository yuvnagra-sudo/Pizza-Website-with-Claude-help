#!/bin/bash
# Create simple notification sounds using sox (if available) or download from free sources
# For now, we'll create placeholder files that can be replaced with actual sounds

# Create a simple beep sound using base64 encoded WAV data
# This is a minimal 440Hz beep
echo "Creating notification sounds..."

# New order sound (higher pitch, cheerful)
cat > new-order.mp3 << 'AUDIO_EOF'
# Placeholder - replace with actual audio file
AUDIO_EOF

# Status change sound (neutral tone)
cat > status-change.mp3 << 'AUDIO_EOF'
# Placeholder - replace with actual audio file  
AUDIO_EOF

# Urgent order sound (alert tone)
cat > urgent-order.mp3 << 'AUDIO_EOF'
# Placeholder - replace with actual audio file
AUDIO_EOF

echo "Audio files created. Replace with actual MP3 files for production."
