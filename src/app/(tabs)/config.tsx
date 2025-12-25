import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

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
    <View style={styles.screen}>
      <Text style={styles.title}>Controller Base URL</Text>
      <Text style={styles.subtitle}>Used for all LED commands and mode sync.</Text>

      <TextInput
        value={input}
        onChangeText={setInput}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="http://192.168.4.1"
        style={styles.input}
        editable={isReady}
      />

      <Pressable style={[styles.saveButton, !isReady && styles.saveButtonDisabled]} onPress={handleSave} disabled={!isReady || saving}>
        <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    gap: 12,
    backgroundColor: "#0F172A",
  },
  title: {
    color: "#E5E7EB",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9CA3AF",
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
  saveButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#0B1C2C",
    fontWeight: "700",
  },
  status: {
    color: "#9CA3AF",
    fontSize: 13,
  },
});
