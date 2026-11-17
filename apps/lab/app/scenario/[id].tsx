import React from 'react';
import { ScrollView, View, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useTheme, Text, ThemeProvider } from '@factory/ui';
import { scenarios } from '../../scenarios';

export default function ScenarioPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const Scenario = id ? scenarios[id] : undefined;

  return (
    <ThemeProvider mode={null}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: '100%' }}
          contentContainerStyle={[styles.scrollContent, { width: '100%', maxWidth: '100%' }]}
          showsVerticalScrollIndicator={false}
        >
          {Scenario ? <Scenario /> : <Text>Scenario not found</Text>}
        </ScrollView>
      </SafeAreaView>
    </ThemeProvider>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
