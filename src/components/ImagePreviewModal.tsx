import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImagePreviewModalProps {
  visible: boolean;
  images: ImagePicker.ImagePickerAsset[];
  onClose: () => void;
  onConfirm: () => void;
  onRetake: () => void;
  onAddMore: () => void;
  isProcessing?: boolean;
}

export default function ImagePreviewModal({
  visible,
  images,
  onClose,
  onConfirm,
  onRetake,
  onAddMore,
  isProcessing = false,
}: ImagePreviewModalProps) {
  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      Alert.alert(
        'Cannot Remove',
        'You need at least one image to proceed.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            // This would need to be handled by the parent component
            // For now, we'll just show the alert
            console.log(`Remove image at index ${index}`);
          }
        }
      ]
    );
  };

  const getImageSize = (image: ImagePicker.ImagePickerAsset) => {
    if (image.fileSize) {
      return `${(image.fileSize / 1024 / 1024).toFixed(2)} MB`;
    }
    return 'Unknown size';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview Images</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Image Count */}
        <View style={styles.imageCountContainer}>
          <Ionicons name="images" size={16} color="#6366f1" />
          <Text style={styles.imageCountText}>
            {images.length} image{images.length > 1 ? 's' : ''} selected
          </Text>
        </View>

        {/* Images Grid */}
        <ScrollView style={styles.imagesContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.imagesGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <View style={styles.imageInfo}>
                  <Text style={styles.imageName} numberOfLines={1}>
                    {image.fileName || `Image ${index + 1}`}
                  </Text>
                  <Text style={styles.imageSize}>
                    {getImageSize(image)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(index)}
                  disabled={isProcessing}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.instructionText}>
              Ensure text is clear and readable
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.instructionText}>
              Good lighting and minimal shadows
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.instructionText}>
              Text should fill most of the image
            </Text>
          </View>
        </View>

        {/* Upload Limits Info */}
        <View style={styles.limitsContainer}>
          <View style={styles.limitsHeader}>
            <Ionicons name="information-circle" size={16} color="#6366f1" />
            <Text style={styles.limitsTitle}>Upload Limits</Text>
          </View>
          <View style={styles.limitsItem}>
            <Ionicons name="images" size={14} color="#64748b" />
            <Text style={styles.limitsText}>
              Maximum 5 images per upload
            </Text>
          </View>
          <View style={styles.limitsItem}>
            <Ionicons name="document" size={14} color="#64748b" />
            <Text style={styles.limitsText}>
              Each image must be under 10MB
            </Text>
          </View>
          <View style={styles.limitsItem}>
            <Ionicons name="time" size={14} color="#64748b" />
            <Text style={styles.limitsText}>
              Processing time: 1-3 minutes
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onRetake}
              disabled={isProcessing}
            >
              <Ionicons name="camera" size={20} color="#6366f1" />
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onAddMore}
              disabled={isProcessing || images.length >= 5}
            >
              <Ionicons name="add" size={20} color="#6366f1" />
              <Text style={styles.secondaryButtonText}>Add More</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              isProcessing && styles.disabledButton
            ]}
            onPress={onConfirm}
            disabled={isProcessing}
          >
            <Ionicons 
              name={isProcessing ? "hourglass" : "checkmark"} 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.primaryButtonText}>
              {isProcessing ? 'Processing...' : 'Process Images'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  imageCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  imageCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  imagesContainer: {
    flex: 1,
    padding: 16,
  },
  imagesGrid: {
    gap: 16,
  },
  imageItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  imageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  imageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  imageSize: {
    fontSize: 12,
    color: '#64748b',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 4,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  limitsContainer: {
    backgroundColor: '#f0f9ff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  limitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  limitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  limitsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  limitsText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  actionsContainer: {
    padding: 16,
    paddingBottom: 32, // Add extra bottom padding for safe area
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
