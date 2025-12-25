import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useControllerConfig } from "@/context/ControllerConfig";
export default function ConfigScreen() {
  const { baseUrl, setBaseUrl, isReady } = useControllerConfig();
  const [input, setInput] = useState(baseUrl);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setInput(baseUrl);
  }, [baseUrl]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    try {
      await setBaseUrl(input.trim());
      setStatus(input.trim() ? "Saved" : "Cleared; setup required");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setStatus(`Failed: ${message}`);
    } finally {
      setSaving(false);
    }
  }, [input, setBaseUrl]);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.backdropOne} />
        <View style={styles.backdropTwo} />

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Configuration</Text>
          <Text style={styles.pageSubtitle}>Set the controller base URL so commands can reach your tower.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>Connection</Text>
          <Text style={styles.title}>Controller Base URL</Text>
          <Text style={styles.subtitle}>Used for all LED commands and mode sync.</Text>

          <View style={styles.inputShell}>
            <TextInput
              value={input}
              onChangeText={setInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="http://192.168.4.1"
              placeholderTextColor="#7b8fb1"
              style={styles.input}
              editable={isReady}
            />
            <Text style={styles.helper}>Example: http://192.168.4.1</Text>
          </View>

          <Pressable
            style={[styles.saveButton, (!isReady || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isReady || saving}
          >
            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
          </Pressable>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#04041f",
  },
  screen: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  pageHeader: {
    gap: 6,
  },
  pageTitle: {
    color: "#fffdff",
    fontSize: 24,
    fontWeight: "800",
  },
  pageSubtitle: {
    color: "#d3ddff",
    fontSize: 14,
    lineHeight: 20,
  },
  backdropOne: {
    position: "absolute",
    width: 220,
    height: 220,
    backgroundColor: "#ff4fd822",
    borderRadius: 160,
    top: -60,
    right: -50,
    transform: [{ rotate: "-10deg" }],
  },
  backdropTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    backgroundColor: "#5bf3ff22",
    borderRadius: 150,
    bottom: -50,
    left: -40,
    transform: [{ rotate: "18deg" }],
  },
  card: {
    backgroundColor: "#0b1040",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#3146ff",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  eyebrow: {
    color: "#5bf3ff",
    fontWeight: "700",
    letterSpacing: 0.4,
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    color: "#fffdff",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "#d3ddff",
    fontSize: 14,
    lineHeight: 20,
  },
  inputShell: {
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
  helper: {
    color: "#a5b6ff",
    fontSize: 12,
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#04041f",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  status: {
    color: "#d3ddff",
    fontSize: 13,
  },
});
