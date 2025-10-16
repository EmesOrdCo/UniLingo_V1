import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '../lib/supabase';
import { VideoDebugService } from '../lib/videoDebugService';

const { width, height } = Dimensions.get('window');

interface VideoBackgroundProps {
  category: 'minecraft' | 'gta' | 'subway_surfers' | 'mix' | null;
  isMuted: boolean;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ category, isMuted }) => {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [videos, setVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const videoRef = useRef<Video>(null);
  const videoStartTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get videos from Supabase Storage based on category using direct URLs
  const fetchVideos = async (selectedCategory: string) => {
    if (!selectedCategory || selectedCategory === 'mix') return [];

    try {
      console.log(`🎥 Fetching videos from category: ${selectedCategory}`);
      
      // Define known video files for each category based on your bucket structure
      // NOTE: You may need to adjust these paths based on your actual Supabase bucket structure
      const videoFiles: { [key: string]: string[] } = {
        'minecraft': [
          'Minecraft/Minecraft_1.mp4',
          'Minecraft/Minecraft_2.mp4',
          'Minecraft/Minecraft_3.mp4',
          'Minecraft/Minecraft_4.mp4',
          'Minecraft/Minecraft_5.mp4',
          'Minecraft/Minecraft_6.mp4',
          'Minecraft/Minecraft_7.mp4',
          'Minecraft/Minecraft_8.mp4'
        ],
        'gta': [
          'GTA/GTA_1.mp4',
          'GTA/GTA_2.mp4',
          'GTA/GTA_3.mp4',
          'GTA/GTA_4.mp4',
          'GTA/GTA_5.mp4',
          'GTA/GTA_6.mp4',
          'GTA/GTA_7.mp4',
          'GTA/GTA_8.mp4'
        ],
        'subway_surfers': [
          'Subway_Surfers/SubwaySurfer_1.mp4',
          'Subway_Surfers/SubwaySurfer_2.mp4',
          'Subway_Surfers/SubwaySurfer_3.mp4',
          'Subway_Surfers/SubwaySurfer_4.mp4',
          'Subway_Surfers/SubwaySurfer_5.mp4'
        ]
      };
      
      const files = videoFiles[selectedCategory];
      if (!files) {
        console.log(`❌ No video files defined for category: ${selectedCategory}`);
        return [];
      }
      
      // Generate public URLs for each video file
      const videoUrls = files.map(filePath => {
        const { data } = supabase.storage
          .from('Brainrot')
          .getPublicUrl(filePath);
        return data.publicUrl;
      });
      
      console.log(`✅ Generated ${videoUrls.length} video URLs for ${selectedCategory}`);
      console.log(`📋 Video URLs:`, videoUrls.slice(0, 3)); // Show first 3 URLs
      
      return videoUrls;
      
    } catch (error) {
      console.error('❌ Error in fetchVideos:', error);
      return [];
    }
  };

  // Load videos when category changes
  useEffect(() => {
    const loadVideos = async () => {
      if (!category || category === 'mix') {
        // For mix, get videos from all categories
        const [minecraftVideos, gtaVideos, subwayVideos] = await Promise.all([
          fetchVideos('minecraft'),
          fetchVideos('gta'),
          fetchVideos('subway_surfers')
        ]);
        
        const allVideos = [...minecraftVideos, ...gtaVideos, ...subwayVideos];
        setVideos(allVideos);
        console.log(`✅ Loaded ${allVideos.length} mixed videos`);
      } else {
        const categoryVideos = await fetchVideos(category);
        setVideos(categoryVideos);
      }
    };

    loadVideos();
  }, [category]);

  // Select random video when videos are loaded or when current video ends
  const selectRandomVideo = () => {
    if (videos.length === 0) return;
    
    // Clear any existing timeout
    if (videoStartTimeout.current) {
      clearTimeout(videoStartTimeout.current);
      videoStartTimeout.current = null;
    }
    
    const randomIndex = Math.floor(Math.random() * videos.length);
    const newVideo = videos[randomIndex];
    setCurrentVideo(newVideo);
    console.log(`🎲 Selected random video: ${newVideo.split('/').pop()}`);
    
    // Set a timeout to detect if video gets stuck on first frame
    videoStartTimeout.current = setTimeout(() => {
      console.log('⏰ Video timeout - appears to be stuck on first frame, moving to next video');
      fadeToNextVideo();
    }, 5000); // 5 second timeout
  };

  // Select initial video when videos are loaded OR switch immediately when category changes
  useEffect(() => {
    if (videos.length > 0) {
      selectRandomVideo();
    }
  }, [videos]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (videoStartTimeout.current) {
        clearTimeout(videoStartTimeout.current);
      }
    };
  }, []);

  // Handle video end - select next random video
  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        console.log('🎬 Video finished, selecting next random video');
        fadeToNextVideo();
      } else if (status.isPlaying === false && status.positionMillis > 0) {
        // Video is loaded but not playing (might be paused or stuck)
        console.log('🎬 Video appears to be stuck, attempting to restart');
        if (videoRef.current) {
          videoRef.current.playAsync().catch(error => {
            console.error('❌ Error restarting stuck video:', error);
            // If restart fails, move to next video
            setTimeout(() => fadeToNextVideo(), 1000);
          });
        }
      }
    }
  };

  // Fade transition to next video - smoother and more subtle
  const fadeToNextVideo = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3, // Don't fade completely to black, more subtle
        duration: 800, // Slower fade out
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800, // Slower fade in
        useNativeDriver: true,
      }),
    ]).start(() => {
      selectRandomVideo();
    });
  };

  // If no category is selected or no videos available, don't render
  if (!category || videos.length === 0 || !currentVideo) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.videoContainer, { opacity: fadeAnim }]}>
        <Video
          ref={videoRef}
          source={{ uri: currentVideo }}
          style={styles.video}
          shouldPlay
          isLooping={false}
          isMuted={isMuted}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => {
            setIsLoading(false);
            console.log('🎬 Video loaded successfully');
            // Force play to prevent freezing on first frame
            if (videoRef.current) {
              videoRef.current.playAsync().then(() => {
                // Clear timeout since video started successfully
                if (videoStartTimeout.current) {
                  clearTimeout(videoStartTimeout.current);
                  videoStartTimeout.current = null;
                }
                console.log('✅ Video playback started successfully');
              }).catch(error => {
                console.error('❌ Error starting video playback:', error);
                // Try next video if current one fails to start
                setTimeout(() => fadeToNextVideo(), 1000);
              });
            }
          }}
          onError={(error) => {
            console.error('❌ Video playback error:', error);
            // Try next video on error
            setTimeout(() => fadeToNextVideo(), 1000);
          }}
          // Add these props to prevent freezing
          useNativeControls={false}
          progressUpdateIntervalMillis={1000}
          // Ensure video starts playing immediately
          onReadyForDisplay={() => {
            console.log('🎬 Video ready for display');
            if (videoRef.current) {
              videoRef.current.playAsync().catch(error => {
                console.error('❌ Error playing video on ready:', error);
              });
            }
          }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: -1,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
