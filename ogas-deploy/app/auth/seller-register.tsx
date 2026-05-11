import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";

export default function SellerRegisterScreen() {
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!businessName || !fullName || !phone || !address || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, "seller", { businessName, fullName, phone, address });
      Alert.alert("Welcome, Seller! 🎉", "Your seller account is ready. Start adding your gas inventory.", [
        { text: "Go to Dashboard", onPress: () => router.replace("/seller/index") }
      ]);
    } catch (error: any) {
      const msg = error.code === "auth/email-already-in-use" ? "An account with this email already exists." : error.message;
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Register as Seller</Text>
        <Text style={styles.subtitle}>Set up your gas vendor account on OGas</Text>

        <Text style={styles.label}>Business Name</Text>
        <TextInput style={styles.input} placeholder="e.g. Ade Gas Enterprises" value={businessName} onChangeText={setBusinessName} />

        <Text style={styles.label}>Your Full Name</Text>
        <TextInput style={styles.input} placeholder="John Doe" value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="08012345678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Business Address</Text>
        <TextInput style={styles.input} placeholder="12 Adeola Street, Lagos" value={address} onChangeText={setAddress} />

        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Minimum 6 characters" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Seller Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: "#fff" },
  backBtn: { marginTop: 20, marginBottom: 20 },
  backText: { color: "#FF6B35", fontSize: 16 },
  title: { fontSize: 26, fontWeight: "bold", color: "#222", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#888", marginBottom: 28 },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 14, borderRadius: 10, marginBottom: 18, fontSize: 16, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#1a7a4a", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  link: { marginTop: 18, alignItems: "center" },
  linkText: { color: "#666", fontSize: 15 },
  linkBold: { color: "#1a7a4a", fontWeight: "bold" },
});
