import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View as RNView } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
        <ActivityIndicator color="#ff4fd8" size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <RNView style={styles.backdropOne} />
      <RNView style={styles.backdropTwo} />

      <RNView style={styles.logoRow}>
        <FontAwesome name="star" size={16} color="#ff4fd8" />
        <Text style={styles.logoBadge}>Eiffel Tower</Text>
        <Text style={styles.logoSub}>LED Control</Text>
      </RNView>

      {step === 0 ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Welcome</Text>
          <RNView style={styles.titleRow}>
            <FontAwesome name="rocket" size={18} color="#5bf3ff" />
            <Text style={styles.title}>Launch your mini light show.</Text>
          </RNView>
          <Text style={styles.subtitle}>
            Connect to your tower controller over Wi-Fi, blink on demand, and set playful schedules that keep the glow alive.
          </Text>

          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <RNView style={styles.pillRow}>
                <FontAwesome name="flash" size={14} color="#fffdff" />
                <Text style={styles.pillLabel}>Blink bursts</Text>
              </RNView>
            </View>
            <View style={[styles.pill, styles.pillAlt]}>
              <RNView style={styles.pillRow}>
                <FontAwesome name="clock-o" size={14} color="#fffdff" />
                <Text style={styles.pillLabel}>Auto schedules</Text>
              </RNView>
            </View>
            <View style={[styles.pill, styles.pillMint]}>
              <RNView style={styles.pillRow}>
                <FontAwesome name="hand-o-up" size={14} color="#fffdff" />
                <Text style={styles.pillLabel}>Manual mode</Text>
              </RNView>
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Setup</Text>
          <RNView style={styles.titleRow}>
            <FontAwesome name="link" size={16} color="#ff4fd8" />
            <Text style={styles.title}>Set the controller URL</Text>
          </RNView>
          <Text style={styles.subtitle}>
            Enter the controller address (example: http://192.168.4.1). This URL powers every command.
          </Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.4.1"
            placeholderTextColor="#7b8fb1"
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
    backgroundColor: "#04041f",
    justifyContent: "center",
    gap: 18,
  },
  backdropOne: {
    position: "absolute",
    width: 260,
    height: 260,
    backgroundColor: "#ff4fd822",
    borderRadius: 200,
    top: -70,
    right: -80,
    transform: [{ rotate: "-10deg" }],
  },
  backdropTwo: {
    position: "absolute",
    width: 200,
    height: 200,
    backgroundColor: "#5bf3ff22",
    borderRadius: 180,
    bottom: -60,
    left: -60,
    transform: [{ rotate: "16deg" }],
  },
  logoRow: {
    alignItems: "center",
    gap: 6,
    flexDirection: "row",
    justifyContent: "center",
  },
  logoBadge: {
    color: "#ff4fd8",
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontSize: 13,
  },
  logoSub: {
    color: "#d3ddff",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#0b1040",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#3146ff",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  eyebrow: {
    color: "#5bf3ff",
    fontWeight: "700",
    letterSpacing: 0.4,
    fontSize: 12,
    textTransform: "uppercase",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#fffdff",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  subtitle: {
    color: "#d3ddff",
    fontSize: 15,
    lineHeight: 22,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#0f1c56",
    borderWidth: 1,
    borderColor: "#3146ff",
  },
  pillAlt: {
    backgroundColor: "#0f2658",
    borderColor: "#5bf3ff",
  },
  pillMint: {
    backgroundColor: "#121a3f",
    borderColor: "#ff4fd8",
  },
  pillLabel: {
    color: "#fffdff",
    fontWeight: "700",
    fontSize: 12,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: {
    backgroundColor: "#0f1c56",
    color: "#fffdff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3146ff",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#ff4fd8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#ff4fd8",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#04041f",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  error: {
    color: "#ff9fcb",
  },
});
