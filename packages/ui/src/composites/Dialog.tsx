import React from 'react';
import { View, Modal, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';
import { Button } from '../controls/Button';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  dismissible?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  dismissible = true,
  style,
}: DialogProps) {
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
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
        }}
        onPress={handleDismiss}
      >
        <Pressable
          role="dialog"
          accessibilityViewIsModal
          accessibilityLabel={title}
          style={[
            {
              width: '100%',
              maxWidth: 400,
              backgroundColor: colors.background,
              borderRadius: tokens.radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: tokens.spacing.lg,
              gap: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 5,
            },
            style,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={{ gap: 4 }}>
            <Text variant="heading" style={{ fontSize: 18, fontWeight: '700' }}>
              {title}
            </Text>
            {description ? (
              <Text muted variant="small" style={{ lineHeight: 20 }}>
                {description}
              </Text>
            ) : null}
          </View>

          {/* Body Content */}
          {children ? <View>{children}</View> : null}

          {/* Action Buttons */}
          {primaryAction || secondaryAction ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 4,
              }}
            >
              {secondaryAction ? (
                <View style={{ flex: 1 }}>
                  <Button
                    label={secondaryAction.label}
                    variant="ghost"
                    fullWidth
                    onPress={secondaryAction.onPress}
                  />
                </View>
              ) : null}
              {primaryAction ? (
                <View style={{ flex: secondaryAction ? 1 : 0, minWidth: 110 }}>
                  <Button
                    label={primaryAction.label}
                    variant="primary"
                    loading={primaryAction.loading}
                    disabled={primaryAction.disabled}
                    fullWidth
                    onPress={primaryAction.onPress}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
