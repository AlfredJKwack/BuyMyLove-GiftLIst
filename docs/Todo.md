# TODO

## Hardening. 
- [ ] Store uploads outside the code directory so deployments can’t accidentally break writes. Use a path like /var/lib/gift-app/uploads, owned by www-data:www-data (755). Update upload.js to respect an UPLOAD_DIR environment variable and add that to .env.local. Also update the path handling in Caddy to match.
- [ ] Separate the database rights. The user that runs the app should only have SELECT, INSERT, UPDATE, DELETE on the gift_app schema. Create a separate user for migrations with CREATE, ALTER, DROP privileges. Update the Deployment documentation to match that.
- [ ] Create some throttling logic that disables the "bought" feature for 24 hours if any one item has flipped more than N number of times. Have a cron job re-enable it as required. Log those actions, potentially email the admins that this is happening. 

## User Experience.
- [ ] Make a few themes for occasions like Christmas, Halloween, Birthdays etc. 
- [x] If someone other than the Admin ticks a "bought" then have some festive animation with confetti fly across the screen and pop up a "jeez thanks"!
- [ ] Make a good looking set of error pages: 404, 500, 403 etc.