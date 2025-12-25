import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View as RNView,
} from "react-native";

import { Text, View } from "@/components/Themed";
import { useControllerConfig } from "@/context/ControllerConfig";

type Pattern = "steady" | "breathe" | "sparkle" | "wave";

const colorPresets: Array<{ label: string; value: string }> = [
  { label: "Warm", value: "#FFD166" },
  { label: "Sunset", value: "#FF7B7B" },
  { label: "Aurora", value: "#6EE7B7" },
  { label: "Ice", value: "#7BDFF2" },
  { label: "Royal", value: "#6C63FF" },
];

const patterns: Array<{ label: string; value: Pattern; hint: string }> = [
  { label: "Steady", value: "steady", hint: "Solid glow" },
  { label: "Breathe", value: "breathe", hint: "Slow fade" },
  { label: "Sparkle", value: "sparkle", hint: "Twinkle bursts" },
  { label: "Wave", value: "wave", hint: "Rolling sweep" },
];

export default function TowerControlScreen() {
  const { baseUrl, setBaseUrl } = useControllerConfig();
  const [controllerUrl, setControllerUrl] = useState(baseUrl);
  const [power, setPower] = useState(true);
  const [color, setColor] = useState(colorPresets[0].value);
  const [brightness, setBrightness] = useState(75);
  const [pattern, setPattern] = useState<Pattern>("steady");
  const [isSending, setIsSending] = useState(false);
  const [isSyncingMode, setIsSyncingMode] = useState(false);
  const [isSettingMode, setIsSettingMode] = useState(false);
  const [isSettingDuration, setIsSettingDuration] = useState(false);
  const [ledOnUntil, setLedOnUntil] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleStart, setScheduleStart] = useState("08:00");
  const [scheduleEnd, setScheduleEnd] = useState("18:00");
  const [durationMinutes, setDurationMinutes] = useState(1);

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`), []);
  const durationOptions = useMemo(() => [1, 2, 3, 4, 5], []);

  const parseMinutes = useCallback((value: string) => {
    const [h, m = "0"] = value.split(":");
    const hour = Number(h);
    const minute = Number(m);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : NaN;
  }, []);

  const handleScheduleStartChange = useCallback(
    async (next: string) => {
      const startMin = parseMinutes(next);
      const endMin = parseMinutes(scheduleEnd);
      if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
        setScheduleError("Invalid time value");
        return;
      }
      if (startMin >= endMin) {
        setScheduleError("From must be earlier than To");
        return;
      }
      setScheduleError(null);
      setScheduleStart(next);

      // Persist start hour
      try {
        const hourInt = Math.floor(startMin / 60);
        const url = new URL(`/config?name=start_hour&value=${hourInt}`, controllerUrl).toString();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!resp.ok) {
          const detail = await resp.text();
          throw new Error(detail || `Controller returned ${resp.status}`);
        }
        await setBaseUrl(controllerUrl);
        setStatus(`Start hour saved (${hourInt}:00)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message.includes("AbortError") ? "Start hour request timed out" : message);
      }
    },
    [parseMinutes, scheduleEnd, controllerUrl, setBaseUrl],
  );

  const handleScheduleEndChange = useCallback(
    async (next: string) => {
      const startMin = parseMinutes(scheduleStart);
      const endMin = parseMinutes(next);
      if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
        setScheduleError("Invalid time value");
        return;
      }
      if (startMin >= endMin) {
        setScheduleError("To must be later than From");
        return;
      }
      setScheduleError(null);
      setScheduleEnd(next);

      // Persist stop hour
      try {
        const hourInt = Math.floor(endMin / 60);
        const url = new URL(`/config?name=stop_hour&value=${hourInt}`, controllerUrl).toString();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!resp.ok) {
          const detail = await resp.text();
          throw new Error(detail || `Controller returned ${resp.status}`);
        }
        await setBaseUrl(controllerUrl);
        setStatus(`Stop hour saved (${hourInt}:00)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message.includes("AbortError") ? "Stop hour request timed out" : message);
      }
    },
    [parseMinutes, scheduleStart, controllerUrl, setBaseUrl],
  );

  const handleDurationChange = useCallback(
    async (next: number) => {
      const clamped = Math.min(5, Math.max(1, Math.floor(next)));
      setDurationMinutes(clamped);
      if (isSettingDuration) return;
      setIsSettingDuration(true);
      try {
        const url = new URL(`/config?name=on_duration&value=${clamped}`, controllerUrl).toString();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!resp.ok) {
          const detail = await resp.text();
          throw new Error(detail || `Controller returned ${resp.status}`);
        }
        await setBaseUrl(controllerUrl);
        setStatus(`Blink duration saved (${clamped} minute${clamped > 1 ? "s" : ""})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message.includes("AbortError") ? "Duration request timed out" : message);
      } finally {
        setIsSettingDuration(false);
      }
    },
    [controllerUrl, isSettingDuration, setBaseUrl],
  );
  const ledTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setControllerUrl(baseUrl);
  }, [baseUrl]);

  const durationUrl = useMemo(() => {
    try {
      return new URL("/config?name=on_duration", controllerUrl).toString();
    } catch (err) {
      return "";
    }
  }, [controllerUrl]);

  const blinkUrl = useMemo(() => {
    try {
      return new URL("/blink", controllerUrl).toString();
    } catch (err) {
      return "";
    }
  }, [controllerUrl]);

  const clearLedTimer = useCallback(() => {
    if (ledTimerRef.current) {
      clearTimeout(ledTimerRef.current);
      ledTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearLedTimer(), [clearLedTimer]);

  const sendCommand = useCallback(async () => {
    if (!durationUrl || !blinkUrl) {
      setError("Controller URL is not valid.");
      return;
    }

    const now = Date.now();
    if (ledOnUntil && ledOnUntil > now) {
      setStatus(`LED already on; ready again in ${Math.ceil((ledOnUntil - now) / 1000)}s`);
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      // Fetch on_duration
      const durationController = new AbortController();
      const durationTimeout = setTimeout(() => durationController.abort(), 8000);
      const durationResp = await fetch(durationUrl, { signal: durationController.signal });
      clearTimeout(durationTimeout);

      if (!durationResp.ok) {
        const detail = await durationResp.text();
        throw new Error(detail || `Controller returned ${durationResp.status}`);
      }

      const durationBody = await durationResp.text();
      const match = /on_duration\s*=\s*(\d+)/i.exec(durationBody);
      if (!match) {
        throw new Error("on_duration response missing value");
      }
      const durationMinutes = Number(match[1]);
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error("on_duration must be a positive number of minutes");
      }
      const durationMs = durationMinutes * 60_000;
      setDurationMinutes(durationMinutes);

      // Trigger blink
      const blinkController = new AbortController();
      const blinkTimeout = setTimeout(() => blinkController.abort(), 8000);
      const blinkResp = await fetch(blinkUrl, { signal: blinkController.signal });
      clearTimeout(blinkTimeout);

      if (!blinkResp.ok) {
        const detail = await blinkResp.text();
        throw new Error(detail || `Blink failed with ${blinkResp.status}`);
      }

      const expiresAt = Date.now() + durationMs;
      clearLedTimer();
      setLedOnUntil(expiresAt);
      ledTimerRef.current = setTimeout(() => {
        setLedOnUntil(null);
        setStatus("Blink");
      }, durationMs);

      await setBaseUrl(controllerUrl);
      setStatus(`Blinking for ${durationMinutes} min`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message.includes("AbortError") ? "Request timed out" : message);
    } finally {
      setIsSending(false);
    }
  }, [durationUrl, blinkUrl, ledOnUntil, clearLedTimer, setBaseUrl, controllerUrl]);

  const modeUrl = useMemo(() => {
    try {
      return new URL("/config?name=mode", controllerUrl).toString();
    } catch (err) {
      return "";
    }
  }, [controllerUrl]);

  const fetchMode = useCallback(async () => {
    if (!modeUrl) {
      setError("Controller URL is not valid.");
      return;
    }

    setIsSyncingMode(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(modeUrl, { signal: controller.signal });

      clearTimeout(timeout);

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Controller returned ${response.status}`);
      }

      const body = await response.text();
      const match = /mode\s*=\s*(\d+)/i.exec(body);
      if (!match) {
        throw new Error("Mode response missing value");
      }

      const value = Number(match[1]);
      const nextPower = Number.isFinite(value) && value > 0;
      setPower(nextPower);
      setStatus(`Mode synced (${nextPower ? "Auto" : "Manual"}) at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message.includes("AbortError") ? "Mode request timed out" : message);
    } finally {
      setIsSyncingMode(false);
    }
  }, [modeUrl]);

  const updateMode = useCallback(
    async (next: boolean) => {
      if (isSettingMode) return;
      let targetUrl: string;
      try {
        targetUrl = new URL(`/config?name=mode&value=${next ? 1 : 0}`, controllerUrl).toString();
      } catch (err) {
        setError("Controller URL is not valid.");
        return;
      }

      const previous = power;
      setPower(next);
      setIsSettingMode(true);
      setError(null);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(targetUrl, { signal: controller.signal });

        clearTimeout(timeout);

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || `Controller returned ${response.status}`);
        }

        await setBaseUrl(controllerUrl);
        setStatus(`Mode set to ${next ? "Auto" : "Manual"} at ${new Date().toLocaleTimeString()}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setPower(previous);
        setError(message.includes("AbortError") ? "Mode request timed out" : message);
      } finally {
        setIsSettingMode(false);
      }
    },
    [controllerUrl, isSettingMode, power, setBaseUrl],
  );

  useEffect(() => {
    fetchMode();
  }, [fetchMode]);

  const bumpBrightness = useCallback(
    (delta: number) => {
      setBrightness((current) => Math.min(100, Math.max(5, current + delta)));
    },
    [],
  );

  const quickScenes = useMemo(
    () => [
      { title: "Paris Night", next: { color: "#6C63FF", pattern: "breathe" as Pattern, brightness: 60 } },
      { title: "Sunrise", next: { color: "#FFB347", pattern: "wave" as Pattern, brightness: 85 } },
      { title: "Spark", next: { color: "#FF7B7B", pattern: "sparkle" as Pattern, brightness: 90 } },
    ],
    [],
  );

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.headerCard}>
        <Pressable
          style={[styles.roundButton, ledOnUntil && ledOnUntil > Date.now() ? styles.roundButtonOn : styles.roundButtonOff]}
          onPress={sendCommand}
          disabled={isSending || (ledOnUntil !== null && ledOnUntil > Date.now())}
          accessibilityLabel="Blink LED"
        >
          {isSending ? (
            <ActivityIndicator color="#0B1C2C" size="large" />
          ) : (
            <FontAwesome name="lightbulb-o" size={56} color="#0B1C2C" />
          )}
        </Pressable>
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {error ? (
          <Text style={[styles.status, styles.errorText]} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <RNView style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Mode</Text>
          <Pressable style={styles.syncButton} onPress={fetchMode} disabled={isSyncingMode}>
            {isSyncingMode ? <ActivityIndicator color="#E5E7EB" /> : <Text style={styles.syncButtonText}>Sync</Text>}
          </Pressable>
        </RNView>
        <RNView style={styles.row}>
          <ToggleButton label="Auto" active={power} onPress={() => updateMode(true)} />
          <ToggleButton label="Manual" active={!power} onPress={() => updateMode(false)} />
        </RNView>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Schedule</Text>
        <Text style={styles.subtitle}>Set a daily time range (24h)</Text>
        <RNView style={styles.timeRow}>
          <RNView style={styles.timeField}>
            <Text style={styles.timeLabel}>From</Text>
            <HourSelect
              label="From"
              value={scheduleStart}
              onChange={handleScheduleStartChange}
              options={hourOptions}
            />
          </RNView>
          <RNView style={styles.timeField}>
            <Text style={styles.timeLabel}>To</Text>
            <HourSelect
              label="To"
              value={scheduleEnd}
              onChange={handleScheduleEndChange}
              options={hourOptions}
            />
          </RNView>
        </RNView>
        {scheduleError ? <Text style={[styles.status, styles.errorText]}>{scheduleError}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Duration</Text>
        <Text style={styles.subtitle}>Blink length</Text>
        <DurationSelect value={durationMinutes} onChange={handleDurationChange} options={durationOptions} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Colors</Text>
        <RNView style={styles.swatchRow}>
          {colorPresets.map((preset) => (
            <Pressable
              key={preset.value}
              style={[styles.swatch, { backgroundColor: preset.value }, color === preset.value && styles.swatchActive]}
              onPress={() => setColor(preset.value)}
              accessibilityLabel={`Set color ${preset.label}`}
            />
          ))}
        </RNView>
        <TextInput
          value={color}
          onChangeText={setColor}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="#FFD166"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Brightness</Text>
        <RNView style={styles.row}>
          <Pressable style={styles.pillButton} onPress={() => bumpBrightness(-10)}>
            <Text style={styles.pillText}>-</Text>
          </Pressable>
          <Text style={styles.brightnessValue}>{brightness}%</Text>
          <Pressable style={styles.pillButton} onPress={() => bumpBrightness(10)}>
            <Text style={styles.pillText}>+</Text>
          </Pressable>
        </RNView>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pattern</Text>
        <RNView style={styles.rowWrap}>
          {patterns.map((item) => (
            <ToggleButton
              key={item.value}
              label={item.label}
              caption={item.hint}
              active={pattern === item.value}
              onPress={() => setPattern(item.value)}
            />
          ))}
        </RNView>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Scenes</Text>
        {quickScenes.map((scene) => (
          <Pressable
            key={scene.title}
            style={styles.sceneRow}
            onPress={() => {
              setColor(scene.next.color);
              setPattern(scene.next.pattern);
              setBrightness(scene.next.brightness);
            }}
          >
            <Text style={styles.sceneTitle}>{scene.title}</Text>
            <Text style={styles.sceneDetail}>{`${scene.next.brightness}% • ${scene.next.pattern}`}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function ToggleButton({
  label,
  caption,
  active,
  onPress,
}: {
  label: string;
  caption?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.toggle, active && styles.toggleActive]} onPress={onPress}>
      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{label}</Text>
      {caption ? <Text style={styles.toggleCaption}>{caption}</Text> : null}
    </Pressable>
  );
}

function HourSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: string[];
}) {
  if (Platform.OS === "ios") {
    const openSheet = () => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: label,
          options: [...options, "Cancel"],
          cancelButtonIndex: options.length,
          userInterfaceStyle: "dark",
        },
        (index) => {
          if (index != null && index >= 0 && index < options.length) {
            onChange(options[index]);
          }
        },
      );
    };

    return (
      <Pressable style={styles.hourButton} onPress={openSheet}>
        <Text style={styles.hourButtonValue}>{value}</Text>
      </Pressable>
    );
  }

  return (
    <RNView style={styles.pickerContainer}>
      <Picker
        selectedValue={value}
        onValueChange={(next) => onChange(String(next))}
        dropdownIconColor="#E5E7EB"
        mode="dropdown"
        itemStyle={styles.pickerItem}
        style={styles.picker}
      >
        {options.map((opt) => (
          <Picker.Item key={opt} label={opt} value={opt} />
        ))}
      </Picker>
    </RNView>
  );
}

function DurationSelect({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (next: number) => void;
  options: number[];
}) {
  const labels = options.map((opt) => `${opt} minute${opt > 1 ? "s" : ""}`);

  if (Platform.OS === "ios") {
    const openSheet = () => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Duration",
          options: [...labels, "Cancel"],
          cancelButtonIndex: labels.length,
          userInterfaceStyle: "dark",
        },
        (index) => {
          if (index != null && index >= 0 && index < options.length) {
            onChange(options[index]);
          }
        },
      );
    };

    return (
      <Pressable style={styles.hourButton} onPress={openSheet}>
        <Text style={styles.hourButtonValue}>{`${value} minute${value > 1 ? "s" : ""}`}</Text>
      </Pressable>
    );
  }

  return (
    <RNView style={styles.pickerContainer}>
      <Picker
        selectedValue={value}
        onValueChange={(next) => onChange(Number(next))}
        dropdownIconColor="#E5E7EB"
        mode="dropdown"
        itemStyle={styles.pickerItem}
        style={styles.picker}
      >
        {options.map((opt) => (
          <Picker.Item key={opt} label={`${opt} minute${opt > 1 ? "s" : ""}`} value={opt} />
        ))}
      </Picker>
    </RNView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    gap: 16,
    backgroundColor: "#0F172A",
  },
  headerCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
    gap: 12,
    alignItems: "center",
  },
  roundButton: {
    width: 140,
    height: 140,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  roundButtonOff: {
    backgroundColor: "#22C55E",
  },
  roundButtonOn: {
    backgroundColor: "#FACC15",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  subtitle: {
    color: "#9CA3AF",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  pickerContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
    overflow: "hidden",
  },
  picker: {
    color: "#E5E7EB",
    height: 52,
    width: "100%",
    backgroundColor: "#1F2937",
  },
  pickerItem: {
    color: "#E5E7EB",
    fontSize: 16,
  },
  hourButton: {
    height: 52,
    backgroundColor: "#1F2937",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  hourButtonValue: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
  },
  status: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  errorText: {
    color: "#FCA5A5",
  },
  connectionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#1F2937",
    color: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
  },
  sendButton: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 88,
    alignItems: "center",
  },
  sendButtonText: {
    color: "#0B1C2C",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#1F2937",
    minWidth: 72,
    alignItems: "center",
  },
  syncButtonText: {
    color: "#E5E7EB",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatchRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: {
    borderColor: "#22C55E",
  },
  pillButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    color: "#E5E7EB",
    fontSize: 20,
    fontWeight: "700",
  },
  brightnessValue: {
    color: "#E5E7EB",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  toggle: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#1F2937",
  },
  toggleActive: {
    borderColor: "#22C55E",
    backgroundColor: "#123026",
  },
  toggleLabel: {
    color: "#E5E7EB",
    fontWeight: "600",
    fontSize: 14,
  },
  toggleLabelActive: {
    color: "#CFFAFE",
  },
  toggleCaption: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  sceneRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  sceneTitle: {
    color: "#E5E7EB",
    fontWeight: "600",
  },
  sceneDetail: {
    color: "#9CA3AF",
    marginTop: 2,
  },
});
