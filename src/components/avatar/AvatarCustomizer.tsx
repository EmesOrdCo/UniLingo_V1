import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { AvatarUnlockService } from '../../lib/avatarUnlockService';

const { width } = Dimensions.get('window');

type CustomizationCategory = 'skin' | 'hair' | 'facialHair' | 'eyes' | 'eyebrows' | 'mouth' | 'clothing' | 'accessories';

interface CategoryConfig {
  id: CustomizationCategory;
  name: string;
  icon: string;
  color: string;
}

const AvatarCustomizer: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [unlockProgress, setUnlockProgress] = useState<{[key: string]: {total: number; unlocked: number; percentage: number}}>({});

  useEffect(() => {
    loadUnlockProgress();
  }, [user?.id]);

  const loadUnlockProgress = async () => {
    if (!user?.id) return;
    
    try {
      const progress = await AvatarUnlockService.getUserUnlockProgress(user.id);
      setUnlockProgress(progress);
    } catch (error) {
      console.error('Error loading unlock progress:', error);
    }
  };

  const categories: CategoryConfig[] = [
    {
      id: 'skin',
      name: 'Skin',
      icon: '🎨',
      color: '#FFE5B4'
    },
    {
      id: 'hair',
      name: 'Hair',
      icon: '💇‍♀️',
      color: '#D2691E'
    },
    {
      id: 'facialHair',
      name: 'Beard',
      icon: '🧔',
      color: '#8B4513'
    },
    {
      id: 'eyes',
      name: 'Eyes',
      icon: '👁️',
      color: '#87CEEB'
    },
    {
      id: 'eyebrows',
      name: 'Brows',
      icon: '🤨',
      color: '#8B4513'
    },
    {
      id: 'mouth',
      name: 'Mouth',
      icon: '👄',
      color: '#FFB6C1'
    },
    {
      id: 'clothing',
      name: 'Style',
      icon: '👔',
      color: '#4169E1'
    },
    {
      id: 'accessories',
      name: 'Accessories',
      icon: '👓',
      color: '#C0C0C0'
    }
  ];

  const getCategoryProgress = (categoryId: string) => {
    // Map frontend categories to database categories
    const categoryMap: {[key: string]: string} = {
      'skin': 'skinColor',
      'hair': 'hair',
      'facialHair': 'facialHair',
      'eyes': 'eyes',
      'eyebrows': 'eyebrows',
      'mouth': 'mouth',
      'clothing': 'clothing',
      'accessories': 'accessories'
    };
    
    const dbCategory = categoryMap[categoryId];
    return unlockProgress[dbCategory] || { total: 0, unlocked: 0, percentage: 0 };
  };

  return (
    <View style={styles.container}>
      {/* Category Grid */}
      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const progress = getCategoryProgress(category.id);
          
          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryButton}
              onPress={() => {
                navigation.navigate('AvatarSubcategory' as never, {
                  category: category.id,
                  categoryName: category.name,
                  categoryIcon: category.icon
                } as never);
              }}
            >
              <View style={[
                styles.categoryIconContainer,
                { backgroundColor: category.color }
              ]}>
                <Text style={styles.categoryButtonIcon}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryButtonText}>
                {category.name}
              </Text>
              {progress.total > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progress.percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {progress.unlocked}/{progress.total}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingVertical: 12,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  categoryButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    width: (width - 16) / 2, // 2 columns with minimal padding
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonIcon: {
    fontSize: 14,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  // Progress Bar Styles
  progressContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6b7280',
  },
});

export default AvatarCustomizer;
