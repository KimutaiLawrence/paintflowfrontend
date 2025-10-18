# Cloudinary PDF Delivery Setup

## Issue
Your PDFs are getting 401 Unauthorized errors because Cloudinary free accounts have PDF delivery disabled by default for security reasons.

## Solution
To enable PDF preview and download functionality, you need to enable PDF delivery in your Cloudinary account:

### Steps to Enable PDF Delivery:

1. **Log into your Cloudinary account**
   - Go to [https://cloudinary.com/console](https://cloudinary.com/console)
   - Sign in with your credentials

2. **Navigate to Security Settings**
   - Click on **Settings** in the left sidebar
   - Click on **Security** tab

3. **Enable PDF and ZIP Files Delivery**
   - Scroll down to find **"Restricted media types"** section
   - Look for **"PDF and ZIP Files Delivery"** option
   - Check the box labeled **"Allow delivery of PDF and ZIP files"**
   - Click **Save** to apply changes

4. **Verify the Setting**
   - The setting should now show as enabled
   - This will allow your PDFs to be accessed without 401 errors

### Alternative: Use Signed URLs (Advanced)
If you prefer to keep PDF delivery restricted, you can implement signed URLs in your backend:

```python
# In your backend routes.py
from cloudinary.utils import cloudinary_url
import cloudinary

# Generate signed URL for PDF access
signed_url, options = cloudinary_url(
    public_id,
    resource_type="raw",
    type="upload",
    sign_url=True,
    expires_at=int(time.time()) + 3600  # 1 hour expiry
)
```

### Testing
After enabling PDF delivery:
1. Refresh your frontend application
2. Try to preview a PDF document
3. The PDF should now load in the iframe without 401 errors

### Note
- This setting affects all PDFs in your Cloudinary account
- It's a security trade-off - PDFs will be publicly accessible
- Consider using signed URLs for sensitive documents
