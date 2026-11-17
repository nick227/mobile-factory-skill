import React, { useRef, useState } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from 'react-native';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';

export type SlideTone = 'primary' | 'success' | 'danger';

export interface SlideToConfirmProps {
  label?: string;
  completedLabel?: string;
  confirmed?: boolean;
  onConfirm: () => void;
  onReset?: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: SlideTone;
  style?: StyleProp<ViewStyle>;
}

export function SlideToConfirm({
  label = 'Slide to confirm',
  completedLabel = 'Confirmed',
  confirmed = false,
  onConfirm,
  onReset,
  loading = false,
  disabled = false,
  tone = 'primary',
  style,
}: SlideToConfirmProps) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const startPageX = useRef(0);

  let toneColor: string = colors.primary;
  if (tone === 'success') {
    toneColor = colors.success;
  } else if (tone === 'danger') {
    toneColor = colors.danger;
  }

  const thumbSize = 48;
  const padding = 4;
  const maxDrag = Math.max(0, trackWidth - thumbSize - padding * 2);

  const handleTouchStart = (e: GestureResponderEvent) => {
    if (disabled || confirmed || loading) return;
    startPageX.current = e.nativeEvent.pageX;
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (disabled || confirmed || loading) return;
    const deltaX = e.nativeEvent.pageX - startPageX.current;
    const clamped = Math.max(0, Math.min(deltaX, maxDrag));
    setDragOffset(clamped);
  };

  const handleTouchEnd = () => {
    if (disabled || confirmed || loading) return;
    const threshold = maxDrag * 0.75;
    if (dragOffset >= threshold && threshold > 0) {
      setDragOffset(maxDrag);
      onConfirm();
    } else {
      setDragOffset(0);
    }
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  // Rule 10: Keep semantic gestures and preserve accessible tap alternatives.
  const handleAccessibleTap = () => {
    if (disabled || loading) return;
    if (confirmed) {
      setDragOffset(0);
      onReset?.();
    } else {
      setDragOffset(maxDrag);
      onConfirm();
    }
  };

  const effectiveLabel = confirmed ? completedLabel : label;
  const currentDrag = confirmed ? maxDrag : dragOffset;

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          backgroundColor: colors.surface,
          borderColor: confirmed ? toneColor : colors.border,
        },
        disabled && styles.disabledTrack,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={effectiveLabel}
      accessibilityHint={confirmed ? 'Tap to reset' : 'Double tap to confirm'}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {/* Active colored fill background following the drag or when confirmed */}
      <View
        style={[
          styles.fillTrack,
          {
            backgroundColor: toneColor,
            width: confirmed
              ? '100%'
              : thumbSize + padding * 2 + currentDrag,
          },
        ]}
      />

      {/* Centered prompt text */}
      <View style={styles.labelContainer} pointerEvents="none">
        <Text
          style={[
            styles.labelText,
            {
              color: confirmed ? colors.onPrimary : colors.muted,
            },
          ]}
        >
          {effectiveLabel}
        </Text>
      </View>

      {/* Draggable thumb button */}
      {!confirmed ? (
        <View
          onStartShouldSetResponder={() => !disabled && !confirmed && !loading}
          onMoveShouldSetResponder={() => !disabled && !confirmed && !loading}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
          onResponderTerminate={handleTouchEnd}
          style={[
            styles.thumb,
            {
              backgroundColor: toneColor,
              transform: [{ translateX: currentDrag }],
            },
          ]}
        >
          <Pressable
            onPress={handleAccessibleTap}
            style={styles.thumbTouch}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={8}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.arrowGlyph, { color: colors.onPrimary }]}>
                →
              </Text>
            )}
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleAccessibleTap}
          style={[styles.confirmedIconSlot, { backgroundColor: toneColor }]}
          accessibilityRole="button"
          accessibilityLabel={completedLabel}
        >
          <Text style={[styles.checkGlyph, { color: colors.onPrimary }]}>✓</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 56,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    padding: 4,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  disabledTrack: {
    opacity: 0.5,
  },
  fillTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: tokens.radius.full,
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontWeight: '700',
    fontSize: tokens.typography.body,
    letterSpacing: 0.2,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbTouch: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowGlyph: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  confirmedIconSlot: {
    position: 'absolute',
    right: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
});
