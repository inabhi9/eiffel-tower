import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View as RNView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useControllerConfig } from "@/context/ControllerConfig";

export default function TowerControlScreen() {
  const { baseUrl, setBaseUrl, isReady } = useControllerConfig();
  const [controllerUrl, setControllerUrl] = useState(baseUrl);
  const [power, setPower] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSyncingMode, setIsSyncingMode] = useState(false);
  const [isSettingMode, setIsSettingMode] = useState(false);
  const [isSettingDuration, setIsSettingDuration] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ledOnUntil, setLedOnUntil] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleStart, setScheduleStart] = useState("08:00");
  const [scheduleEnd, setScheduleEnd] = useState("18:00");
  const [durationMinutes, setDurationMinutes] = useState(1);

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`), []);
  const durationOptions = useMemo(() => [1, 2, 3, 4, 5], []);
  const scheduleDisabled = !power;

  const formatHour = useCallback((hour: number) => `${String(Math.min(23, Math.max(0, Math.floor(hour)))).padStart(2, "0")}:00`, []);

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
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Eiffel Tower LED</Text>
            <Text style={styles.pageSubtitle}>Control, schedule, and blink your tower over Wi-Fi.</Text>
          </View>
    try {
      return new URL("/blink", controllerUrl).toString();
    } catch (err) {
      return "";
    }
  }, [controllerUrl]);

  const fetchConfigValue = useCallback(
    async (name: string) => {
      let url: string;
      try {
        url = new URL(`/config?name=${name}`, controllerUrl).toString();
      } catch (err) {
        throw new Error("Controller URL is not valid.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(detail || `Controller returned ${resp.status}`);
      }

      return await resp.text();
    },
    [controllerUrl],
  );

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    setScheduleError(null);

    const modePromise = fetchMode();

    try {
      const [startBody, stopBody, durationBody] = await Promise.all([
        fetchConfigValue("start_hour"),
        fetchConfigValue("stop_hour"),
        fetchConfigValue("on_duration"),
      ]);

      const extractNumber = (body: string, key: string) => {
        const match = new RegExp(`${key}\\s*=\\s*(\\d+)`, "i").exec(body);
        if (!match) {
          throw new Error(`${key} response missing value`);
        }
        const value = Number(match[1]);
        if (!Number.isFinite(value)) {
          throw new Error(`${key} response contained an invalid number`);
        }
        return value;
      };

      const startHour = extractNumber(startBody, "start_hour");
      const stopHour = extractNumber(stopBody, "stop_hour");
      const durationValue = extractNumber(durationBody, "on_duration");

      setScheduleStart(formatHour(startHour));
      setScheduleEnd(formatHour(stopHour));
      setDurationMinutes(durationValue);

      const startMinutes = startHour * 60;
      const stopMinutes = stopHour * 60;
      setScheduleError(startMinutes >= stopMinutes ? "From must be earlier than To" : null);
      setStatus("Settings synced from controller");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message.includes("AbortError") ? "Refresh timed out" : message);
    } finally {
      await modePromise.catch(() => undefined);
      setIsRefreshing(false);
    }
  }, [fetchConfigValue, fetchMode, formatHour]);

  useEffect(() => {
    fetchMode();
  }, [fetchMode]);

  useEffect(() => {
    if (!isReady) return;
    if (!controllerUrl.trim()) return;
    handleRefresh();
  }, [isReady, controllerUrl, handleRefresh]);

  const bumpBrightness = useCallback(
    (delta: number) => {
      setBrightness((current) => Math.min(100, Math.max(5, current + delta)));
    },
    [],
  );

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.backdropOne} />
      <View style={styles.backdropTwo} />

      <ScrollView
        contentContainerStyle={styles.screen}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#ff4fd8" />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Eiffel Tower LED</Text>
          <Text style={styles.pageSubtitle}>Control, schedule, and blink your tower over Wi-Fi.</Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>Eiffel Tower LEDs</Text>
          <Text style={styles.heroTitle}>Light show, on tap.</Text>
          <Text style={styles.heroSubtitle}>
            Blink the tower, schedule glow hours, and toggle auto mode with a playful control board.
          </Text>
          <RNView style={styles.heroChips}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Base URL</Text>
              <Text style={styles.chipValue} numberOfLines={1}>
                {controllerUrl || "Not set"}
              </Text>
            </View>
            <View style={[styles.chip, styles.chipAlt]}>
              <Text style={styles.chipLabel}>Mode</Text>
              <Text style={styles.chipValue}>{power ? "Auto" : "Manual"}</Text>
            </View>
          </RNView>
        </View>

        <View style={styles.headerCard}>
          <Text style={styles.cardEyebrow}>Instant Blink</Text>
          <Text style={styles.cardTitle}>Spark the lights now</Text>
          <Pressable
            style={[styles.roundButton, ledOnUntil && ledOnUntil > Date.now() ? styles.roundButtonOn : styles.roundButtonOff]}
            onPress={sendCommand}
            disabled={isSending || (ledOnUntil !== null && ledOnUntil > Date.now())}
            accessibilityLabel="Blink LED"
          >
            {isSending ? (
              <ActivityIndicator color="#04041f" size="large" />
            ) : (
              <FontAwesome name="lightbulb-o" size={56} color="#04041f" />
            )}
          </Pressable>
          <Text style={styles.cardHint}>Tap to blink for the configured duration.</Text>
          {status ? <Text style={styles.status}>{status}</Text> : null}
          {error ? (
            <Text style={[styles.status, styles.errorText]} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Mode</Text>
          <Text style={styles.cardTitle}>Auto vs Manual</Text>
          <RNView style={styles.row}>
            <ToggleButton label="Auto" caption="Let the schedule run" active={power} onPress={() => updateMode(true)} />
            <ToggleButton label="Manual" caption="You control every blink" active={!power} onPress={() => updateMode(false)} />
          </RNView>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Schedule</Text>
          <Text style={styles.cardTitle}>Daily glow window</Text>
          <Text style={styles.subtitle}>Set a 24h window for automatic sparkle.</Text>
          <RNView style={styles.timeRow}>
            <RNView style={styles.timeField}>
              <Text style={styles.timeLabel}>From</Text>
              <HourSelect
                label="From"
                value={scheduleStart}
                onChange={handleScheduleStartChange}
                options={hourOptions}
                disabled={scheduleDisabled}
              />
            </RNView>
            <RNView style={styles.timeField}>
              <Text style={styles.timeLabel}>To</Text>
              <HourSelect
                label="To"
                value={scheduleEnd}
                onChange={handleScheduleEndChange}
                options={hourOptions}
                disabled={scheduleDisabled}
              />
            </RNView>
          </RNView>
          {scheduleError ? <Text style={[styles.status, styles.errorText]}>{scheduleError}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Duration</Text>
          <Text style={styles.cardTitle}>Blink length</Text>
          <Text style={styles.subtitle}>Choose how long each burst shines.</Text>
          <DurationSelect
            value={durationMinutes}
            onChange={handleDurationChange}
            options={durationOptions}
            disabled={scheduleDisabled}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Pressable style={[styles.hourButton, styles.hourButtonDisabled]} disabled>
        <Text style={[styles.hourButtonValue, styles.hourButtonDisabledText]}>{value}</Text>
      </Pressable>
    );
  }

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
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  options: number[];
  disabled?: boolean;
}) {
  const labels = options.map((opt) => `${opt} minute${opt > 1 ? "s" : ""}`);

  if (disabled) {
    return (
      <Pressable style={[styles.hourButton, styles.hourButtonDisabled]} disabled>
        <Text style={[styles.hourButtonValue, styles.hourButtonDisabledText]}>{`${value} minute${value > 1 ? "s" : ""}`}</Text>
      </Pressable>
    );
  }

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
  page: {
    flex: 1,
    backgroundColor: "#04041f",
    paddingTop: 16,
  },
  screen: {
    padding: 20,
    gap: 18,
    paddingBottom: 42,
  },
  backdropOne: {
    position: "absolute",
    width: 240,
    height: 240,
    backgroundColor: "#ff4fd822",
    borderRadius: 180,
    top: -80,
    right: -60,
    transform: [{ rotate: "-12deg" }],
  },
  backdropTwo: {
    position: "absolute",
    width: 200,
    height: 200,
    backgroundColor: "#5bf3ff22",
    borderRadius: 160,
    bottom: -60,
    left: -30,
    transform: [{ rotate: "18deg" }],
  },
  heroCard: {
    backgroundColor: "#0b1040",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#3146ff",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  heroKicker: {
    color: "#5bf3ff",
    fontWeight: "700",
    letterSpacing: 0.3,
    fontSize: 13,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#fffdff",
    fontSize: 24,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#d3ddff",
    lineHeight: 22,
  },
  pageHeader: {
    gap: 4,
  },
  pageTitle: {
    color: "#fffdff",
    fontSize: 26,
    fontWeight: "800",
  },
  pageSubtitle: {
    color: "#d3ddff",
    fontSize: 14,
  },
  heroChips: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: "#111a4d",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#3146ff",
  },
  chipAlt: {
    backgroundColor: "#132555",
    borderColor: "#ff4fd8",
  },
  chipLabel: {
    color: "#a5b6ff",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  chipValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  headerCard: {
    backgroundColor: "#111a4d",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#3146ff",
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardEyebrow: {
    color: "#a5b6ff",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  cardTitle: {
    color: "#fffdff",
    fontSize: 18,
    fontWeight: "700",
  },
  cardHint: {
    color: "#d3ddff",
    fontSize: 13,
  },
  roundButton: {
    width: 150,
    height: 150,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff4fd8",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    borderWidth: 4,
    borderColor: "#04041f",
  },
  roundButtonOff: {
    backgroundColor: "#ff4fd8",
  },
  roundButtonOn: {
    backgroundColor: "#5bf3ff",
  },
  status: {
    color: "#d3ddff",
    fontSize: 13,
    textAlign: "center",
  },
  errorText: {
    color: "#ff9fcb",
  },
  card: {
    backgroundColor: "#0b1040",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#3146ff",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3146ff",
    backgroundColor: "#0f1c56",
    minWidth: 72,
    alignItems: "center",
  },
  syncButtonText: {
    color: "#fffdff",
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  toggle: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3146ff",
    backgroundColor: "#0f1c56",
  },
  toggleActive: {
    borderColor: "#5bf3ff",
    backgroundColor: "#122a63",
  },
  toggleLabel: {
    color: "#fffdff",
    fontWeight: "700",
    fontSize: 15,
  },
  toggleLabelActive: {
    color: "#e9ffff",
  },
  toggleCaption: {
    color: "#d3ddff",
    fontSize: 12,
    marginTop: 4,
  },
  pageHeader: {
    gap: 6,
  },
  pageTitle: {
    color: "#fffdff",
    fontSize: 26,
    fontWeight: "800",
  },
  pageSubtitle: {
    color: "#d3ddff",
    fontSize: 14,
  },
  subtitle: {
    color: "#d3ddff",
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
    color: "#a5b6ff",
    fontSize: 13,
  },
  pickerContainer: {
    backgroundColor: "#0f1c56",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3146ff",
    overflow: "hidden",
  },
  picker: {
    color: "#fffdff",
    height: 56,
    width: "100%",
    backgroundColor: "#0f1c56",
  },
  pickerItem: {
    color: "#fffdff",
    fontSize: 16,
  },
  hourButton: {
    height: 56,
    backgroundColor: "#0f1c56",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3146ff",
    alignItems: "center",
    justifyContent: "center",
  },
  hourButtonValue: {
    color: "#fffdff",
    fontSize: 16,
    fontWeight: "700",
  },
  hourButtonDisabled: {
    opacity: 0.6,
    borderColor: "#2a3163",
  },
  hourButtonDisabledText: {
    color: "#9aacff",
  },
});
