import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import registry from '@factory/catalog/registry.json';
import { Text, Stack as UIStack, Surface, ThemeProvider, useTheme, SegmentedControl } from '@factory/ui';
import { showcases } from '../../showcases/registry';

export default function ComponentPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = registry.find((x) => x.id === id);
  const [mode, setMode] = useState('system');
  const { colors } = useTheme();
  const Demo = item ? showcases[item.showcase] : undefined;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to Catalog"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '600' }}>
            ‹ Catalog
          </Text>
        </TouchableOpacity>
        <Text style={{ fontWeight: '700', fontSize: 16 }}>{item?.name ?? 'Component'}</Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <UIStack gap="lg">
          <Text muted variant="small">
            {item?.id ?? 'Not found'} · {item?.status ?? 'unknown'} · {item?.category}
          </Text>
          <Surface>
            <SegmentedControl
              label="Preview theme"
              value={mode}
              onValueChange={setMode}
              options={[
                { label: 'System', value: 'system' },
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]}
            />
          </Surface>
          <ThemeProvider mode={mode === 'system' ? null : mode === 'dark' ? 'dark' : 'light'}>
            <Preview>{Demo ? <Demo /> : <Text>Showcase unavailable</Text>}</Preview>
          </ThemeProvider>
          <Text muted variant="small">
            Canonical @factory/ui implementation with studio design tokens.
          </Text>
        </UIStack>
      </ScrollView>
    </SafeAreaView>
  );
}

function Preview({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.background,
        padding: 20,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
      }}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: 390,
    maxWidth: 390,
    overflow: 'hidden',
  },
  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
