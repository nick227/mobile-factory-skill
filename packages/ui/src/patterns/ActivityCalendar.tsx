import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Text } from '../primitives/Text';
import { IconButton } from '../controls/IconButton';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';

export interface CalendarDayMark {
  hasEvents?: boolean;
  dotColor?: string;
  badge?: string;
  disabled?: boolean;
}

export interface ActivityCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  year?: number;
  month?: number; // 1-12
  onMonthChange?: (year: number, month: number) => void;
  markedDates?: Record<string, CalendarDayMark>;
  style?: ViewStyle;
}

export function ActivityCalendar({
  selectedDate,
  onSelectDate,
  year: initialYear = 2026,
  month: initialMonth = 11,
  onMonthChange,
  markedDates = {},
  style,
}: ActivityCalendarProps) {
  const { colors } = useTheme();
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    let nextMonth = currentMonth - 1;
    let nextYear = currentYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
    onMonthChange?.(nextYear, nextMonth);
  };

  const handleNextMonth = () => {
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
    onMonthChange?.(nextYear, nextMonth);
  };

  // Build grid of days
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells: Array<{ dayNumber: number | null; dateString: string | null }> = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ dayNumber: null, dateString: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(currentMonth).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    calendarCells.push({
      dayNumber: d,
      dateString: `${currentYear}-${monthStr}-${dayStr}`,
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {/* Month & Navigation Header */}
      <View style={styles.headerRow}>
        <View style={styles.monthTitleCol}>
          <Text variant="heading" style={{ fontWeight: '700' }}>
            {monthNames[currentMonth - 1]} {currentYear}
          </Text>
        </View>
        <View style={styles.navRow}>
          <IconButton
            label="Previous month"
            icon={<Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>}
            onPress={handlePrevMonth}
            variant="surface"
          />
          <IconButton
            label="Next month"
            icon={<Text style={{ color: colors.text, fontSize: 18 }}>›</Text>}
            onPress={handleNextMonth}
            variant="surface"
          />
        </View>
      </View>

      {/* Day of Week Row */}
      <View style={styles.dayLabelsRow}>
        {dayLabels.map((lbl) => (
          <View key={lbl} style={styles.dayLabelCell}>
            <Text muted variant="caption" style={{ fontWeight: '600' }}>
              {lbl}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.gridContainer}>
        {calendarCells.map((cell, index) => {
          if (!cell.dayNumber || !cell.dateString) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const isSelected = cell.dateString === selectedDate;
          const mark = markedDates[cell.dateString];
          const isDisabled = mark?.disabled;

          return (
            <TouchableOpacity
              key={cell.dateString}
              accessibilityRole="button"
              accessibilityLabel={`${monthNames[currentMonth - 1]} ${cell.dayNumber}, ${currentYear}${
                mark?.hasEvents ? ', has events' : ''
              }`}
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onSelectDate(cell.dateString!)}
              style={styles.dayCell}
            >
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                    opacity: isDisabled ? 0.3 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumberText,
                    {
                      color: isSelected ? colors.onPrimary : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cell.dayNumber}
                </Text>
              </View>

              {/* Event dot indicator */}
              {mark?.hasEvents && (
                <View
                  style={[
                    styles.eventDot,
                    {
                      backgroundColor: mark.dotColor || (isSelected ? colors.onPrimary : colors.primary),
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  monthTitleCol: {
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.xs,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: tokens.typography.small,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
});
