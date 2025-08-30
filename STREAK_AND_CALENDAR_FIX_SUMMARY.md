### 8. **Enhanced Weekly Progress Display** (`DashboardScreen.tsx`)
```typescript
// Updated "Weekly Summary" section to show more detailed information
<Text style={styles.insightTitle}>Weekly Summary</Text>
<Text style={styles.insightValue}>
  {progressData.weeklyProgress?.length > 0 ? 
   `${progressData.weeklyProgress.reduce((sum, day) => sum + (day.lessons_completed || 0), 0)} lessons` : 
   'No data yet'}
</Text>
<Text style={styles.insightSubtext}>
  {progressData.weeklyProgress?.length > 0 ? 
   `${progressData.weeklyProgress.reduce((sum, day) => sum + (day.total_study_time_minutes || 0), 0)} min studied • ${progressData.weeklyProgress.filter(day => (day.lessons_completed || 0) + (day.flashcards_reviewed || 0) + (day.games_played || 0) > 0).length} active days` : 
   'Start studying to see progress!'}
</Text>
```
