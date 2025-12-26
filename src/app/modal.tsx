import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View } from "@/components/Themed";

export default function ModalScreen() {
  return (
    <View style={styles.page}>
      <View style={styles.backdropOne} />
      <View style={styles.backdropTwo} />

      <View style={styles.card}>
        <Text style={styles.eyebrow}>About</Text>
        <View style={styles.titleRow}>
          <FontAwesome name="info-circle" size={18} color="#5bf3ff" />
          <Text style={styles.title}>Eiffel Tower LED Controller</Text>
        </View>
        <Text style={styles.body}>
          This app sends quick commands to your tower controller: blink on tap, switch between Auto and Manual, and sync the schedule.
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>- Blink now to trigger an immediate light burst.</Text>
          <Text style={styles.listItem}>- Auto mode uses your configured hours to glow every day.</Text>
          <Text style={styles.listItem}>- Manual mode leaves timing in your hands.</Text>
        </View>

        <Text style={styles.footer}>Built for playful city lights.</Text>
      </View>

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#04041f",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backdropOne: {
    position: "absolute",
    width: 240,
    height: 240,
    backgroundColor: "#ff4fd822",
    borderRadius: 180,
    top: -60,
    right: -60,
    transform: [{ rotate: "-12deg" }],
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
  card: {
    backgroundColor: "#0b1040",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#3146ff",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    maxWidth: 540,
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
    fontSize: 22,
    fontWeight: "800",
  },
  body: {
    color: "#d3ddff",
    lineHeight: 22,
  },
  list: {
    gap: 6,
  },
  listItem: {
    color: "#fffdff",
    lineHeight: 20,
  },
  footer: {
    color: "#d3ddff",
    fontWeight: "700",
  },
});
