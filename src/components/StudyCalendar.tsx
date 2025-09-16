import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface StudyCalendarProps {
  studyDates: string[]; // Array of dates when user studied (YYYY-MM-DD format)
  currentMonth?: Date; // Optional: specific month to display, defaults to current month
}

export default function StudyCalendar({ studyDates, currentMonth }: StudyCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth || new Date());
  const [calendarDays, setCalendarDays] = useState<Array<{
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isStudyDay: boolean;
    isFuture: boolean;
  }>>([]);

  useEffect(() => {
    generateCalendarDays();
  }, [selectedMonth, studyDates]);

  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get the last day number
    const lastDayNumber = lastDay.getDate();
    
    // Get the previous month's last few days to fill the first week
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthLastDay = prevMonth.getDate();
    
    const days: Array<{
      date: Date;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isStudyDay: boolean;
      isFuture: boolean;
    }> = [];
    
    // Add previous month's days to fill the first week
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: isToday(date),
        isStudyDay: isStudyDay(date),
        isFuture: isFuture(date),
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= lastDayNumber; day++) {
      const date = new Date(year, month, day);
      const dayData = {
        date,
        day,
        isCurrentMonth: true,
        isToday: isToday(date),
        isStudyDay: isStudyDay(date),
        isFuture: isFuture(date),
      };
      
      days.push(dayData);
    }
    
    // Add next month's days to fill the last week (ensure we have 6 rows)
    const totalDays = days.length;
    const remainingDays = 42 - totalDays; // 6 rows * 7 days = 42
    
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: isToday(date),
        isStudyDay: isStudyDay(date),
        isFuture: isFuture(date),
      });
    }
    
    console.log(`📅 Generated ${days.length} calendar days for ${getMonthName(selectedMonth)}`);
    console.log(`📅 First day of week: ${firstDayOfWeek}, Last day number: ${lastDayNumber}`);
    
    setCalendarDays(days);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isStudyDay = (date: Date): boolean => {
    // Use local date string instead of toISOString() to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return studyDates.includes(dateString);
  };

  const isFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return date > today;
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayName = (dayIndex: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const getDayStyle = (day: any) => {
    if (day.isFuture) {
      return [styles.calendarDay, styles.futureDay];
    }
    if (day.isStudyDay) {
      return [styles.calendarDay, styles.studyDay];
    }
    if (day.isToday) {
      return [styles.calendarDay, styles.today];
    }
    if (!day.isCurrentMonth) {
      return [styles.calendarDay, styles.otherMonthDay];
    }
    return styles.calendarDay;
  };

  const getDayTextStyle = (day: any) => {
    if (day.isFuture) {
      return styles.futureDayText;
    }
    if (day.isStudyDay) {
      return styles.studyDayText;
    }
    if (day.isToday) {
      return styles.todayText;
    }
    if (!day.isCurrentMonth) {
      return styles.otherMonthDayText;
    }
    return styles.dayText;
  };

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#6366f1" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToCurrentMonth} style={styles.monthDisplay}>
          <Text style={styles.monthText}>{getMonthName(selectedMonth)}</Text>
          <Ionicons name="today" size={16} color="#6366f1" style={styles.todayIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Day Names Header */}
      <View style={styles.dayNamesHeader}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={styles.dayNameContainer}>
            <Text style={styles.dayNameText}>{getDayName(i)}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          console.log(`📅 Rendering day ${index}: ${day.day} (${day.isCurrentMonth ? 'current' : 'other'})`);
          return (
            <View key={index} style={getDayStyle(day)}>
              <Text style={getDayTextStyle(day)}>{day.day}</Text>
            </View>
          );
        })}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 8,
  },
  todayIcon: {
    marginLeft: 4,
  },
  dayNamesHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayNameContainer: {
    width: '14.28%', // Match calendar day width
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days = ~14.28%
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  today: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
  },
  todayText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  studyDay: {
    backgroundColor: '#059669', // Deeper green that better complements the purple theme
    borderRadius: 20,
  },
  studyDayText: {
    color: '#ffffff', // Changed from '#065f46' to white for better contrast
    fontWeight: '700', // Changed from '600' to '700' for better visibility
  },
  futureDay: {
    backgroundColor: '#f1f5f9',
  },
  futureDayText: {
    color: '#9ca3af',
  },
  otherMonthDay: {
    backgroundColor: '#f8fafc',
  },
  otherMonthDayText: {
    color: '#cbd5e1',
  },
});
