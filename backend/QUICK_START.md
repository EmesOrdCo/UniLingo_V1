# 🚀 Azure OCR Quick Start Guide

## What Just Changed?

We **completely replaced EasyOCR with Azure Computer Vision API** because:

| Metric | EasyOCR (Old) | Azure OCR (New) |
|--------|---------------|-----------------|
| **Speed** | 5+ minutes ❌ | 1-2 seconds ✅ |
| **Cost** | Free but unusable | 5,000 FREE/month then $1/1,000 ✅ |
| **Infrastructure** | Heavy Python/PyTorch | Simple REST API ✅ |
| **Docker image** | 2GB+ | <200MB ✅ |
| **Reliability** | Timeouts on Railway | Microsoft infrastructure ✅ |

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Azure Computer Vision Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Search **"Computer Vision"** → Click **Create**
3. Fill in:
   - **Resource Group**: Create new (e.g., `unilingo-resources`)
   - **Region**: Choose closest to Railway (e.g., `East US`)
   - **Name**: `unilingo-ocr`
   - **Pricing**: **Free F0** (5,000 images/month)
4. Click **Review + Create** → **Create**
5. Wait 1-2 minutes for deployment

### Step 2: Get Your Credentials

1. Go to your new Computer Vision resource
2. Left menu → **Keys and Endpoint**
3. Copy:
   - ✅ **Endpoint** (e.g., `https://unilingo-ocr.cognitiveservices.azure.com/`)
   - ✅ **Key 1** (long string)

### Step 3: Add to Railway

1. Go to your Railway project
2. Click **Variables** tab
3. Add TWO variables:

```
AZURE_VISION_ENDPOINT=https://unilingo-ocr.cognitiveservices.azure.com/
AZURE_VISION_KEY=paste_your_key_here
```

4. Railway will **auto-redeploy** with new env vars

### Step 4: Test! 

Upload an image through your app. Look for these logs:

```
✅ HANDWRITING-OPTIMIZED Sharp processing completed successfully
🔤 Starting Azure OCR for handwriting recognition...
  [Azure OCR] Starting OCR for: uploads/...
  [Azure OCR] Client initialized
  [Azure OCR] Sending image to Azure (123 KB)...
  [Azure OCR] Processing completed in 1.45s
  [Azure OCR] Extracted 12 lines of text (234 characters)
✅ Azure OCR completed successfully
⏱️ Processing time: 1.45s
```

## 🎉 Success Indicators

**Before (EasyOCR):**
```
[OCR] Processing image...
[OCR] Still processing... 10s elapsed
[OCR] Still processing... 20s elapsed
...
❌ OCR processor timed out after 5 minutes
```

**After (Azure):**
```
[Azure OCR] Processing completed in 1.45s
✅ Azure OCR completed successfully
```

## 💰 Pricing Breakdown

### Free Tier (F0)
- **5,000 images/month** = FREE
- Perfect for development & small apps

### If you exceed free tier (Standard S1):
- **$1.00 per 1,000 images**
- Example: 10,000 images/month = $5.00

### Real Cost Examples:
| Daily Usage | Monthly Cost |
|-------------|--------------|
| 100 images/day | FREE (3,000/month) |
| 200 images/day | $3/month (6,000/month) |
| 500 images/day | $10/month (15,000/month) |

## 🛠️ Troubleshooting

### Error: "Azure Computer Vision credentials not configured"
**Fix:** Add `AZURE_VISION_ENDPOINT` and `AZURE_VISION_KEY` to Railway variables

### Error: "401 Unauthorized"
**Fix:** 
- Verify API key is correct (copy Key 1 from Azure)
- Check endpoint has `https://` and trailing `/`

### Slow processing (>5 seconds)
**Fix:**
- Choose Azure region close to Railway deployment
- Verify you're not on rate-limited free tier

## 📦 What Was Removed

We deleted all EasyOCR infrastructure:
- ❌ `ocr_processor.py` (Python OCR script)
- ❌ `test-easyocr.js` (EasyOCR test)
- ❌ `requirements.txt` (Python dependencies)
- ❌ `node-easyocr` package
- ❌ All Python/PyTorch from Dockerfile (98% smaller!)

## 🔄 Migration Summary

**Dockerfile Changes:**
- Before: Multi-stage build with Python, PyTorch, EasyOCR (2GB+)
- After: Simple Node.js image with Sharp only (<200MB)

**Processing Time:**
- Before: 5+ minutes (timeout)
- After: 1-2 seconds

**Cost:**
- Before: Free but unusable
- After: 5,000 FREE/month, then super cheap

## 📚 Additional Resources

- 📖 [Full Azure Setup Guide](./AZURE_SETUP.md)
- 🔗 [Azure Computer Vision Docs](https://learn.microsoft.com/en-us/azure/cognitive-services/computer-vision/)
- 💵 [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

## ✅ Next Steps

1. ✅ Push to Railway (already done!)
2. ✅ Add Azure credentials to Railway
3. ✅ Test image upload
4. ✅ Enjoy 1-2 second OCR! 🎉
