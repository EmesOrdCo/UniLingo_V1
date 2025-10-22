import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import SubcategoryPage from '../components/avatar/SubcategoryPage';

type CustomizationCategory = 'skin' | 'hair' | 'facialHair' | 'eyes' | 'eyebrows' | 'mouth' | 'clothing' | 'accessories';

type RootStackParamList = {
  AvatarSubcategory: {
    category: CustomizationCategory;
    categoryName: string;
    categoryIcon: string;
  };
};

type AvatarSubcategoryScreenRouteProp = RouteProp<RootStackParamList, 'AvatarSubcategory'>;

const AvatarSubcategoryScreen: React.FC = () => {
  const route = useRoute<AvatarSubcategoryScreenRouteProp>();
  const { category, categoryName, categoryIcon } = route.params;

  return (
    <SubcategoryPage 
      category={category}
      categoryName={categoryName}
      categoryIcon={categoryIcon}
    />
  );
};

export default AvatarSubcategoryScreen;
