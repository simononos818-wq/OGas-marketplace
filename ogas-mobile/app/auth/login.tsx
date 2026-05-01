import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg = error.code === "auth/invalid-credential" ? "Incorrect email or password." :
                  error.code === "auth/user-not-found" ? "No account found with this email." :
                  error.code === "auth/wrong-password" ? "Incorrect password." :
                  error.message;
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>🔥 OGas</Text>
          <Text style={styles.tagline}>Nigeria's #1 LPG Marketplace</Text>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/register")} style={styles.link}>
          <Text style={styles.linkText}>New buyer? <Text style={styles.linkBold}>Create Account</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/seller-register")} style={styles.link}>
          <Text style={styles.linkText}>Want to sell gas? <Text style={styles.linkBold}>Register as Seller</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: "#fff", justifyContent: "center" },
  logoBox: { alignItems: "center", marginBottom: 32 },
  logoText: { fontSize: 40, fontWeight: "bold", color: "#FF6B35" },
  tagline: { fontSize: 14, color: "#888", marginTop: 4 },
  title: { fontSize: 26, fontWeight: "bold", color: "#222", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#888", marginBottom: 28 },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 14, borderRadius: 10, marginBottom: 18, fontSize: 16, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#FF6B35", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  link: { marginTop: 18, alignItems: "center" },
  linkText: { color: "#666", fontSize: 15 },
  linkBold: { color: "#FF6B35", fontWeight: "bold" },
});
