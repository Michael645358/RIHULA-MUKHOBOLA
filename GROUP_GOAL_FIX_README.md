# RIHULA Group Goal Fix

The Group Goal calculation now reads the complete `members` table and calculates:

**Group Goal = sum of every member's personal goal**

If a member has no valid positive goal, KSh 5,000 is used as the standard goal.

The calculation also normalizes Kenyan phone formats when matching contributions to members.

This fixes the situation where the Group Goal screen could show the old target while the member counter remained at 0 because the requested goal column was not available in a particular database schema.

After deployment, hard-refresh the site or clear the PWA/browser cache so the new `member.js` is loaded.
