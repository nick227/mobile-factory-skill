import React from 'react';
import { View, Modal, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../foundation/theme';
import { tokens } from '../foundation/tokens';
import { Text } from '../primitives/Text';
import { Button } from '../controls/Button';

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
  style,
}: AlertDialogProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
        }}
      >
        <Pressable
          accessibilityRole="alert"
          accessibilityLabel={title}
          style={[
            {
              width: '100%',
              maxWidth: 380,
              backgroundColor: colors.background,
              borderRadius: tokens.radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: tokens.spacing.lg,
              gap: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 6,
            },
            style,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={{ gap: 6 }}>
            <Text
              variant="heading"
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: destructive ? colors.danger : colors.text,
              }}
            >
              {title}
            </Text>
            <Text muted variant="small" style={{ lineHeight: 20 }}>
              {description}
            </Text>
          </View>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <Button
                label={cancelLabel}
                variant="ghost"
                fullWidth
                onPress={handleCancel}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Button
                label={confirmLabel}
                variant="primary"
                loading={loading}
                fullWidth
                style={
                  destructive
                    ? { backgroundColor: colors.danger, borderColor: colors.danger }
                    : undefined
                }
                onPress={handleConfirm}
              />
            </View>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}
