import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { router } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useControllerConfig } from "@/context/ControllerConfig";

export default function WelcomeWizard() {
  const { baseUrl, setBaseUrl, isReady } = useControllerConfig();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState(baseUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    if (isReady && baseUrl.trim()) {
      router.replace("/(tabs)");
    }
  }, [isReady, baseUrl]);

  const handleNext = useCallback(() => {
    setStep(1);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const value = input.trim();
      if (!value) {
        setError("Please enter the controller URL.");
        return;
      }
      await setBaseUrl(value);
      router.replace("/(tabs)");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [input, setBaseUrl]);

  if (!isReady) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color="#E5E7EB" size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {step === 0 ? (
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to the Eiffel Tower LED Controller</Text>
          <Text style={styles.subtitle}>
            This app connects to your Eiffel Tower LED controller over Wi-Fi. You can blink the tower, set Auto or Manual mode, schedule on hours, and choose blink durations.
          </Text>
          <Pressable style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>Set Controller Base URL</Text>
          <Text style={styles.subtitle}>
            Enter the controller address (for example: http://192.168.4.1). This URL is used for all commands.
          </Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.4.1"
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.primaryButton, saving && styles.primaryButtonDisabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save & Continue"}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#0F172A",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1F2937",
    gap: 14,
  },
  title: {
    color: "#E5E7EB",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#1F2937",
    color: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
  },
  primaryButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#0B1C2C",
    fontWeight: "700",
  },
  error: {
    color: "#FCA5A5",
  },
});
