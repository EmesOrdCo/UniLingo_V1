/**
 * Azure Speech Service - Pronunciation Assessment
 * Evaluates pronunciation accuracy and provides detailed feedback
 */

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');

/**
 * Assess pronunciation of spoken audio
 * @param {string} audioFilePath - Path to the audio file (WAV format recommended)
 * @param {string} referenceText - The text that should have been spoken
 * @returns {Promise<{success: boolean, result?: object, error?: string}>}
 */
async function assessPronunciation(audioFilePath, referenceText) {
  try {
    console.log(`[Pronunciation] Starting assessment for: "${referenceText}"`);
    console.log(`[Pronunciation] Audio file path: ${audioFilePath}`);
    
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      console.error(`[Pronunciation] File not found at path: ${audioFilePath}`);
      console.error(`[Pronunciation] Current directory: ${process.cwd()}`);
      console.error(`[Pronunciation] Directory contents:`, fs.readdirSync('.'));
      if (fs.existsSync('uploads')) {
        console.error(`[Pronunciation] Uploads directory contents:`, fs.readdirSync('uploads'));
      }
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }
    
    // Get Azure credentials
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;
    
    console.log(`[Pronunciation] Azure credentials check:`, {
      hasKey: !!speechKey,
      keyLength: speechKey ? speechKey.length : 0,
      hasRegion: !!speechRegion,
      region: speechRegion
    });
    
    if (!speechKey || !speechRegion) {
      throw new Error('Azure Speech Service credentials not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.');
    }
    
    console.log(`[Pronunciation] Reading audio file...`);
    const audioBuffer = fs.readFileSync(audioFilePath);
    console.log(`[Pronunciation] Audio file size: ${audioBuffer.length} bytes`);
    
    // Configure speech service
    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechRecognitionLanguage = 'en-US';
    
    // Configure pronunciation assessment
    const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
      referenceText,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true // Enable miscue calculation
    );
    
    // Set up audio config from file based on format
    const fileExtension = audioFilePath.split('.').pop().toLowerCase();
    let audioConfig;
    
    if (fileExtension === 'm4a') {
      // For M4A files, use the generic file input
      audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
    } else if (fileExtension === 'mp3') {
      // For MP3 files, use the generic file input
      audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
    } else {
      // For WAV files, use the WAV-specific input
      audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
    }
    
    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    // Apply pronunciation assessment config
    pronunciationConfig.applyTo(recognizer);
    
    console.log(`[Pronunciation] Processing audio file: ${audioFilePath}`);
    
    // Perform recognition with pronunciation assessment
    const result = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(result);
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            reject(new Error('No speech recognized. Please speak clearly.'));
          } else {
            reject(new Error(`Recognition failed: ${result.errorDetails}`));
          }
          recognizer.close();
        },
        (error) => {
          recognizer.close();
          reject(error);
        }
      );
    });
    
    // Parse pronunciation assessment results
    const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);
    
    // Extract detailed results
    const assessmentResult = {
      // Overall scores (0-100)
      accuracyScore: pronunciationResult.accuracyScore,
      fluencyScore: pronunciationResult.fluencyScore,
      completenessScore: pronunciationResult.completenessScore,
      pronunciationScore: pronunciationResult.pronunciationScore,
      
      // What the user actually said
      recognizedText: result.text,
      
      // Expected text
      referenceText: referenceText,
      
      // Word-level details
      words: [],
      
      // Overall assessment
      passed: pronunciationResult.pronunciationScore >= 60, // 60+ is considered good
    };
    
    // Parse detailed JSON results for word and phoneme level feedback
    try {
      const detailResult = JSON.parse(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult));
      
      if (detailResult.NBest && detailResult.NBest[0] && detailResult.NBest[0].Words) {
        assessmentResult.words = detailResult.NBest[0].Words.map(word => ({
          word: word.Word,
          accuracyScore: word.PronunciationAssessment?.AccuracyScore || 0,
          errorType: word.PronunciationAssessment?.ErrorType || 'None',
          phonemes: word.Phonemes ? word.Phonemes.map(p => ({
            phoneme: p.Phoneme,
            accuracyScore: p.PronunciationAssessment?.AccuracyScore || 0
          })) : []
        }));
      }
    } catch (parseError) {
      console.warn('[Pronunciation] Could not parse detailed results:', parseError.message);
    }
    
    console.log(`[Pronunciation] Assessment complete - Score: ${assessmentResult.pronunciationScore}/100`);
    console.log(`[Pronunciation] Recognized: "${assessmentResult.recognizedText}"`);
    
    return {
      success: true,
      result: assessmentResult
    };
    
  } catch (error) {
    console.error('[Pronunciation] Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      fullError: error
    });
    
    // Provide more specific error messages
    let errorMessage = 'Pronunciation assessment failed';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code) {
      errorMessage = `Azure Speech error: ${error.code}`;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get human-readable feedback based on pronunciation scores
 * @param {object} assessmentResult - Result from assessPronunciation
 * @returns {object} Feedback messages
 */
function getFeedback(assessmentResult) {
  const { pronunciationScore, accuracyScore, fluencyScore, words } = assessmentResult;
  
  const feedback = {
    overall: '',
    accuracy: '',
    fluency: '',
    wordIssues: []
  };
  
  // Overall feedback
  if (pronunciationScore >= 90) {
    feedback.overall = 'Excellent pronunciation! 🌟';
  } else if (pronunciationScore >= 75) {
    feedback.overall = 'Good job! Your pronunciation is clear. 👍';
  } else if (pronunciationScore >= 60) {
    feedback.overall = 'Not bad, but there\'s room for improvement. 💪';
  } else {
    feedback.overall = 'Keep practicing! Pronunciation needs work. 📚';
  }
  
  // Accuracy feedback
  if (accuracyScore >= 90) {
    feedback.accuracy = 'Your pronunciation of individual sounds is excellent!';
  } else if (accuracyScore >= 75) {
    feedback.accuracy = 'Most sounds are pronounced correctly.';
  } else if (accuracyScore >= 60) {
    feedback.accuracy = 'Some sounds need improvement.';
  } else {
    feedback.accuracy = 'Focus on pronouncing each sound clearly.';
  }
  
  // Fluency feedback
  if (fluencyScore >= 90) {
    feedback.fluency = 'Very natural and smooth delivery!';
  } else if (fluencyScore >= 75) {
    feedback.fluency = 'Good rhythm and flow.';
  } else if (fluencyScore >= 60) {
    feedback.fluency = 'Try to speak more smoothly.';
  } else {
    feedback.fluency = 'Practice speaking more naturally.';
  }
  
  // Word-level issues
  if (words) {
    words.forEach(word => {
      if (word.errorType !== 'None' || word.accuracyScore < 60) {
        feedback.wordIssues.push({
          word: word.word,
          issue: word.errorType,
          score: word.accuracyScore,
          suggestion: getWordSuggestion(word)
        });
      }
    });
  }
  
  return feedback;
}

/**
 * Get specific suggestion for a mispronounced word
 * @param {object} word - Word assessment result
 * @returns {string} Suggestion
 */
function getWordSuggestion(word) {
  switch (word.errorType) {
    case 'Mispronunciation':
      return `Focus on the sounds in "${word.word}". Try saying it slowly.`;
    case 'Omission':
      return `Make sure to pronounce all parts of "${word.word}".`;
    case 'Insertion':
      return `You added extra sounds. Say "${word.word}" more carefully.`;
    default:
      if (word.accuracyScore < 60) {
        return `Practice saying "${word.word}" more clearly.`;
      }
      return '';
  }
}

module.exports = {
  assessPronunciation,
  getFeedback
};
