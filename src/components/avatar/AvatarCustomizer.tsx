import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

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


  return (
    <View style={styles.container}>
      {/* Category Grid */}
      <View style={styles.categoryGrid}>
        {categories.map((category) => (
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
          </TouchableOpacity>
        ))}
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
    paddingVertical: 16,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  categoryButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    width: (width - 16) / 2, // 2 columns with minimal padding
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonIcon: {
    fontSize: 16,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

export default AvatarCustomizer;
