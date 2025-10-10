import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ConsistentHeader from '../components/ConsistentHeader';
import ArcadeSection from '../components/arcade/ArcadeSection';

export default function ArcadeScreen() {
  const navigation = useNavigation();

  const handleBackPress = () => {
    // Navigate to Progress tab
    navigation.navigate('Dashboard' as never, { screen: 'Progress' } as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      <ConsistentHeader 
        pageName="Arcade"
        pageIcon="game-controller"
        showBackButton={true}
        onBackPress={handleBackPress}
        darkMode={true}
      />
      <View style={styles.content}>
        <ArcadeSection />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
