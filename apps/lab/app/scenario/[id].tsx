import React from 'react';
import { ScrollView, View, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useTheme, Text, ThemeProvider } from '@factory/ui';
import { scenarios } from '../../scenarios';

export default function ScenarioPage() {
  const { id, theme, width } = useLocalSearchParams<{ id: string; theme?: string; width?: string }>();
  const [mode, setMode] = React.useState<'light' | 'dark'>(theme === 'dark' ? 'dark' : 'light');
  const Scenario = id ? scenarios[id] : undefined;
  const targetWidth = width ? parseInt(width, 10) : 390;

  return (
    <ThemeProvider mode={mode}>
      <ScenarioContent
        Scenario={Scenario}
        mode={mode}
        width={targetWidth}
        onToggleMode={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
      />
    </ThemeProvider>
  );
}

function ScenarioContent({
  Scenario,
  mode,
  width,
  onToggleMode,
}: {
  Scenario?: React.ComponentType;
  mode: 'light' | 'dark';
  width: number;
  onToggleMode: () => void;
}) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
          width,
          maxWidth: width,
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {/* Sleek App Bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to Scenarios"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '600' }}>
            ‹ Scenarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} theme`}
          onPress={onToggleMode}
          style={[styles.themePill, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
            {mode === 'light' ? '🌙 Dark' : '☀️ Light'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Scenario ? <Scenario /> : <Text>Scenario not found</Text>}
      </ScrollView>
    </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
  },
  themePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
