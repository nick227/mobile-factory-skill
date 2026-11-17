import React from 'react';
import {
  View,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  dismissible?: boolean;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  dismissible = true,
  scrollable = false,
  style,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleDismiss = () => {
    if (dismissible) {
      onOpenChange(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch target */}
        <Pressable
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss sheet"
          style={styles.backdrop}
        />

        {/* Sheet container */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, tokens.spacing.md),
            },
            style,
          ]}
          accessibilityViewIsModal={true}
        >
          {/* Tactile drag / grab handle indicator */}
          <View style={styles.handleSlot} pointerEvents="none">
            <View style={[styles.grabHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          {(title || dismissible) ? (
            <View style={styles.header}>
              <View style={styles.headerTitleSlot}>
                {title ? (
                  <Text variant="heading" style={styles.titleText}>
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text variant="small" muted style={styles.subtitleText}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              {dismissible ? (
                <Pressable
                  onPress={handleDismiss}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { backgroundColor: colors.surfaceSubtle, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.closeGlyph, { color: colors.muted }]}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Body content */}
          {scrollable ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.content}>{children}</View>
          )}

          {/* Bottom fixed footer */}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  handleSlot: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.sm,
  },
  headerTitleSlot: {
    flex: 1,
    paddingRight: tokens.spacing.sm,
    gap: 2,
  },
  titleText: {
    fontWeight: '700',
  },
  subtitleText: {
    lineHeight: 18,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
  },
  footer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
  },
});
