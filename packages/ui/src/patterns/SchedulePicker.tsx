import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens, geometry } from '../foundation/tokens';
import { Badge } from '../controls/Badge';

export interface ScheduleDay {
  date: string; // ISO date format YYYY-MM-DD
  dayName: string; // e.g., 'Mon', 'Tue'
  dayNumber: number; // e.g., 17
  monthName?: string; // e.g., 'Nov'
  isAvailable?: boolean;
}

export interface ScheduleSlot {
  id: string;
  time: string; // e.g., '09:30 AM'
  available: boolean;
  period?: 'morning' | 'afternoon' | 'evening';
  price?: string;
}

export interface SchedulePickerProps {
  days: ScheduleDay[];
  slots: ScheduleSlot[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
  title?: string;
  description?: string;
  timeZone?: string;
  style?: ViewStyle;
}

export function SchedulePicker({
  days,
  slots,
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
  title = 'Select Date & Time',
  description,
  timeZone,
  style,
}: SchedulePickerProps) {
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const periods = ['all', 'morning', 'afternoon', 'evening'] as const;

  const filteredSlots = slots.filter((slot) => {
    if (selectedPeriod === 'all') return true;
    return slot.period === selectedPeriod;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {timeZone && (
            <Badge label={timeZone} tone="neutral" />
          )}
        </View>
        {description && (
          <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
        )}
      </View>

      {/* Date Rail */}
      <View style={styles.dateRailContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRail}
        >
          {days.map((day) => {
            const isSelected = day.date === selectedDate;
            const isAvailable = day.isAvailable !== false;

            return (
              <TouchableOpacity
                key={day.date}
                accessibilityRole="button"
                accessibilityLabel={`${day.dayName} ${day.dayNumber}${day.monthName ? ' ' + day.monthName : ''}`}
                accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
                disabled={!isAvailable}
                onPress={() => onSelectDate(day.date)}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    opacity: isAvailable ? 1 : 0.45,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    { color: isSelected ? colors.onPrimary : colors.muted },
                  ]}
                >
                  {day.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    { color: isSelected ? colors.onPrimary : colors.text },
                  ]}
                >
                  {day.dayNumber}
                </Text>
                {day.monthName && (
                  <Text
                    style={[
                      styles.monthName,
                      { color: isSelected ? colors.onPrimary : colors.muted },
                    ]}
                  >
                    {day.monthName}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Period Filter */}
      <View style={styles.periodFilterRow}>
        {periods.map((period) => {
          const isActive = selectedPeriod === period;
          return (
            <TouchableOpacity
              key={period}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${period} slots`}
              accessibilityState={{ selected: isActive }}
              onPress={() => setSelectedPeriod(period)}
              style={[
                styles.periodTab,
                {
                  backgroundColor: isActive ? colors.surface : 'transparent',
                  borderColor: isActive ? colors.border : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.periodTabText,
                  {
                    color: isActive ? colors.primary : colors.muted,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Time Slots Grid */}
      <View style={styles.slotsGrid}>
        {filteredSlots.length === 0 ? (
          <View style={[styles.emptySlots, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptySlotsText, { color: colors.muted }]}>
              No time slots available for this period.
            </Text>
          </View>
        ) : (
          filteredSlots.map((slot) => {
            const isSelected = slot.id === selectedSlot;
            const isAvailable = slot.available;

            return (
              <TouchableOpacity
                key={slot.id}
                accessibilityRole="button"
                accessibilityLabel={`${slot.time}${slot.price ? ', ' + slot.price : ''}${!isAvailable ? ', unavailable' : ''}`}
                accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
                disabled={!isAvailable}
                onPress={() => onSelectSlot(slot.id)}
                style={[
                  styles.slotButton,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isAvailable
                      ? colors.surface
                      : colors.surface,
                    borderColor: isSelected
                      ? colors.primary
                      : isAvailable
                      ? colors.border
                      : colors.border,
                    opacity: isAvailable ? 1 : 0.4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.slotTime,
                    {
                      color: isSelected ? colors.onPrimary : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {slot.time}
                </Text>
                {slot.price && (
                  <Text
                    style={[
                      styles.slotPrice,
                      { color: isSelected ? colors.onPrimary : colors.muted },
                    ]}
                  >
                    {slot.price}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.md,
  },
  header: {
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.heading,
    fontWeight: '700',
  },
  description: {
    fontSize: tokens.typography.small,
    marginTop: tokens.spacing.xs,
  },
  dateRailContainer: {
    marginBottom: tokens.spacing.md,
  },
  dateRail: {
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  dayCard: {
    minWidth: 56,
    height: 72,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
  },
  dayName: {
    fontSize: tokens.typography.caption,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: tokens.typography.heading,
    fontWeight: '700',
    marginVertical: 2,
  },
  monthName: {
    fontSize: 10,
    fontWeight: '500',
  },
  periodFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  periodTab: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
  },
  periodTabText: {
    fontSize: tokens.typography.small,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  slotButton: {
    minWidth: 100,
    height: 48,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  slotTime: {
    fontSize: tokens.typography.body,
  },
  slotPrice: {
    fontSize: 11,
    marginTop: 2,
  },
  emptySlots: {
    width: '100%',
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotsText: {
    fontSize: tokens.typography.small,
  },
});
