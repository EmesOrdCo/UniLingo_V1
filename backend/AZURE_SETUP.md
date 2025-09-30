# Azure Computer Vision OCR Setup

This backend uses **Azure Computer Vision API** for fast, accurate handwriting and text recognition.

## Why Azure?

- ✅ **5,000 FREE images/month** (5x more than Google)
- ✅ **$1.00 per 1,000 images** after free tier (33% cheaper than Google)
- ✅ **1-2 second processing time** (vs 5+ minutes with EasyOCR)
- ✅ **Excellent handwriting recognition**

## Setup Instructions

### 1. Create Azure Account
1. Go to [Azure Portal](https://portal.azure.com)
2. Sign up (free $200 credit for new accounts)

### 2. Create Computer Vision Resource
1. In Azure Portal, search for **"Computer Vision"**
2. Click **"Create"**
3. Fill in:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new or use existing
   - **Region**: Choose closest to your users
   - **Name**: e.g., `unilingo-ocr`
   - **Pricing Tier**: **Free F0** (5,000 transactions/month) or **Standard S1**
4. Click **"Review + Create"** → **"Create"**

### 3. Get Your Credentials
1. Go to your Computer Vision resource
2. Click **"Keys and Endpoint"** in the left menu
3. Copy:
   - **Endpoint**: `https://your-resource-name.cognitiveservices.azure.com/`
   - **Key 1**: Your API key

### 4. Configure Environment Variables

#### Local Development (.env file):
```bash
AZURE_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_api_key_here
```

#### Railway Deployment:
1. Go to your Railway project
2. Click **"Variables"** tab
3. Add:
   - `AZURE_VISION_ENDPOINT`: `https://your-resource-name.cognitiveservices.azure.com/`
   - `AZURE_VISION_KEY`: Your API key

## Pricing

### Free Tier (F0)
- **5,000 transactions/month**
- **FREE**
- Perfect for development and small apps

### Standard Tier (S1)  
- First 1M transactions: **$1.00 per 1,000**
- 1M-10M transactions: **$0.65 per 1,000**
- 10M+ transactions: **$0.60 per 1,000**

### Cost Examples:
| Monthly Usage | Cost |
|---------------|------|
| 5,000 images | **FREE** |
| 10,000 images | **$5.00** |
| 50,000 images | **$45.00** |
| 100,000 images | **$95.00** |

## Testing

Once configured, upload an image through your app. You should see in the logs:

```
[Azure OCR] Starting OCR for: uploads/...
[Azure OCR] Client initialized
[Azure OCR] Sending image to Azure (123.45 KB)...
[Azure OCR] Waiting for results...
[Azure OCR] Processing completed in 1.23s
[Azure OCR] Extracted 15 lines of text (345 characters)
✅ Azure OCR completed successfully
```

## Troubleshooting

### Error: "Azure Computer Vision credentials not configured"
- Make sure `AZURE_VISION_ENDPOINT` and `AZURE_VISION_KEY` are set in your environment

### Error: "Access denied" or "401 Unauthorized"
- Check that your API key is correct
- Verify your endpoint URL includes `https://` and trailing `/`

### Slow processing (>5 seconds)
- Check your Azure region - should be close to your Railway deployment
- Verify you're on Standard tier (Free tier has rate limits)

## Migration from EasyOCR

We've completely removed EasyOCR because:
- ❌ EasyOCR: 5+ minutes per image on Railway (CPU-only)
- ✅ Azure: 1-2 seconds per image
- ❌ EasyOCR: Complex Python dependencies, large Docker images
- ✅ Azure: Simple REST API, tiny footprint
- ❌ EasyOCR: Unpredictable on limited resources
- ✅ Azure: Reliable Microsoft infrastructure

## Support

- [Azure Computer Vision Docs](https://learn.microsoft.com/en-us/azure/cognitive-services/computer-vision/)
- [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)
- [API Reference](https://learn.microsoft.com/en-us/rest/api/computervision/)
