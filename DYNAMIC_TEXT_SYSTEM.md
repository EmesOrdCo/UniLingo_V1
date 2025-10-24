# Dynamic Text System for Modal Buttons

## Issue
Button text in various modal components was wrapping to multiple lines, creating an unprofessional appearance. Specifically, the "Abbrechen" button in the PaymentModal was wrapping to two lines ("Abbreche" + "n").

## Solution
Implemented a dynamic text sizing system across modal components to prevent text overflow and ensure buttons always display properly.

### Components Updated:

#### 1. PaymentModal (`src/components/PaymentModal.tsx`)
- **Cancel Button**: Added dynamic text sizing to prevent "Abbrechen" from wrapping
- **Purchase Button**: Added dynamic text sizing for "Kaufen £99.00" text

#### 2. ImagePreviewModal (`src/components/ImagePreviewModal.tsx`)
- **Retake Button**: Added dynamic text sizing
- **Add More Button**: Added dynamic text sizing  
- **Process Images Button**: Added dynamic text sizing

#### 3. FlashcardReviewModal (`src/components/FlashcardReviewModal.tsx`)
- **Cancel Button**: Added dynamic text sizing
- **Save Button**: Added dynamic text sizing
- **Edit Topics Button**: Added dynamic text sizing
- **Save All Button**: Added dynamic text sizing

### Technical Implementation:
```tsx
// Before: Text could wrap to multiple lines
<Text style={styles.buttonText}>Button Text</Text>

// After: Text automatically scales to fit
<Text 
  style={styles.buttonText}
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.7}
>
  Button Text
</Text>
```

### Key Properties:
- **`numberOfLines={1}`**: Prevents text from wrapping to multiple lines
- **`adjustsFontSizeToFit`**: Automatically reduces font size to fit available space
- **`minimumFontScale={0.7}`**: Ensures text doesn't become unreadably small (minimum 70% of original size)

## Benefits:
✅ **Consistent button appearance** - No more text wrapping issues
✅ **Professional look** - Clean, single-line button text
✅ **Responsive design** - Text adapts to different screen sizes and languages
✅ **Accessibility maintained** - Text remains readable with minimum font scale
✅ **Works across all languages** - Handles long translations gracefully

## Result:
All modal buttons now display with clean, single-line text that automatically scales to fit the available space, creating a much more professional and polished user interface.
